#!/usr/bin/env bash
# webOS CE Doctor — Phase 0 build orchestrator.
#
# Thin wrapper around harness.py that fixes conventional paths. Produces a
# patched, unsigned CE Doctor JAR from the OEM Doctor plus an optional overlay.
#
# Usage:
#   ./build-ce-doctor.sh [OVERLAY_DIR]
#
# Env overrides:
#   JAR    OEM Doctor JAR         (default: ../webosdoctorp305hstnhwifi.jar)
#   OUT    output CE Doctor JAR   (default: ../out/webosdoctorp305hstnh-3.1CE.jar)
#   WORK   work directory         (default: ./work)
#   REEXTRACT=1  force re-extract of the OEM JAR into WORK
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR="${JAR:-$HERE/../webosdoctorp305hstnhwifi.jar}"
OUT="${OUT:-$HERE/../out/webosdoctorp305hstnh-3.1CE.jar}"
WORK="${WORK:-$HERE/work}"
OVERLAY="${1:-}"

mkdir -p "$(dirname "$OUT")"

# Refuse to build while a Doctor is open on this JAR. The harness now renames
# the new JAR into place (so an in-flight flash keeps its own inode and cannot
# be corrupted), but a Doctor started AFTER the swap would silently flash a
# different image than the one its window was launched for. Near-miss
# 2026-08-18: a rebuild landed 63s after a flash finished reading this path.
if pgrep -f "java .*-jar .*$(basename "$OUT")" > /dev/null 2>&1; then
    echo "ERROR: a webOS Doctor is running on $(basename "$OUT")." >&2
    echo "       Close it before rebuilding, or set OUT= to a different path." >&2
    echo "       (pids: $(pgrep -f "java .*-jar .*$(basename "$OUT")" | tr '\n' ' '))" >&2
    exit 1
fi

# Refuse to repack a full-ce overlay whose inputs have changed since it was
# baked. The overlay is generated output that happens to be tracked in git, so
# nothing about it reveals that AddToImage/ moved on -- the 2026-08-25 core-apps
# refresh left a committed overlay missing the new db8 grants, and this script
# would have shipped it without a word. bake.py records a sha256 over every
# AddToImage/ file (+ the LunaCE binary) in the manifest; recompute and compare.
if [[ "${OVERLAY:-}" == *overlays/full-ce* ]] && [ -f "$HERE/full-ce/BUILDMARK" ]; then
    MANIFEST="$HERE/full-ce/manifests/$(cat "$HERE/full-ce/BUILDMARK").json"
    if [ -f "$MANIFEST" ]; then
        RECORDED="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("inputs_sha256",""))' "$MANIFEST")"
        CURRENT="$(cd "$HERE/full-ce" && python3 -c 'import bake; print(bake.inputs_stamp())')"
        if [ -z "$RECORDED" ]; then
            echo "WARNING: $(basename "$MANIFEST") predates the inputs stamp; cannot verify the overlay is fresh." >&2
        elif [ "$RECORDED" != "$CURRENT" ]; then
            echo "ERROR: overlays/full-ce is STALE: AddToImage/ (or the LunaCE binary) changed" >&2
            echo "       since BUILDMARK $(cat "$HERE/full-ce/BUILDMARK") was baked." >&2
            echo "       Run: python3 full-ce/bake.py   (or ALLOW_STALE_OVERLAY=1 to override)" >&2
            [ "${ALLOW_STALE_OVERLAY:-0}" = "1" ] || exit 1
        else
            echo ">>> overlay inputs verified against $(basename "$MANIFEST")"
        fi
    fi
fi

args=(build --jar "$JAR" --out "$OUT" --work "$WORK")
[ -n "$OVERLAY" ] && args+=(--overlay "$OVERLAY")
[ "${REEXTRACT:-0}" = "1" ] && args+=(--reextract)

echo ">>> OEM JAR : $JAR"
echo ">>> overlay : ${OVERLAY:-<none>}"
echo ">>> output  : $OUT"
echo ">>> work    : $WORK"
echo

python3 "$HERE/harness.py" "${args[@]}"

OUT_SHA="$(sha256sum "$OUT" | awk '{print $1}')"

# complete the full-ce build manifest (written by full-ce/bake.py, keyed by
# BUILDMARK) with the output JAR's hash, when this build used that overlay
if [[ "${OVERLAY:-}" == *overlays/full-ce* ]] && [ -f "$HERE/full-ce/BUILDMARK" ]; then
    MANIFEST="$HERE/full-ce/manifests/$(cat "$HERE/full-ce/BUILDMARK").json"
    if [ -f "$MANIFEST" ]; then
        M="$MANIFEST" O="$OUT" S="$OUT_SHA" python3 - <<'PY'
import json, os
m = os.environ["M"]
d = json.load(open(m))
d["output_jar"] = {"path": os.environ["O"], "sha256": os.environ["S"]}
with open(m, "w") as f:
    json.dump(d, f, indent=2)
    f.write("\n")
PY
        echo ">>> manifest: $MANIFEST (output sha256 recorded)"
    fi
fi

echo
echo ">>> built: $OUT"
echo ">>> sha256: $OUT_SHA"
echo ">>> NOTE: unsigned + checkToFlash patched off. Flash-test on real hardware"
echo "    before distributing (no on-device rollback — recovery is re-Doctoring)."
