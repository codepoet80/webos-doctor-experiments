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

args=(build --jar "$JAR" --out "$OUT" --work "$WORK")
[ -n "$OVERLAY" ] && args+=(--overlay "$OVERLAY")
[ "${REEXTRACT:-0}" = "1" ] && args+=(--reextract)

echo ">>> OEM JAR : $JAR"
echo ">>> overlay : ${OVERLAY:-<none>}"
echo ">>> output  : $OUT"
echo ">>> work    : $WORK"
echo

python3 "$HERE/harness.py" "${args[@]}"

echo
echo ">>> built: $OUT"
echo ">>> NOTE: unsigned + checkToFlash patched off. Flash-test on real hardware"
echo "    before distributing (no on-device rollback — recovery is re-Doctoring)."
