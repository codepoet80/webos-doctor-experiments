# Phase 0 — Repack Harness

Tooling to turn the OEM webOS 3.0.5 Doctor JAR into a **flashable CE Doctor**:
unpack → apply an overlay of rootfs changes → regenerate the ipkg md5 database →
verify with a faithful `integcheck` dry-run → repack, with the online build-check
gate patched off and the JAR unsigned.

**No device is required to build or self-test.** What Phase 0 delivers is the
*pipeline* and its correctness guarantees; the actual CE payload (TLS, LunaCE,
hardware, App Catalog, branding) is layered in via overlays / ipk-installs in
Phase 1+.

## Quick start

```bash
cd build

# Identity build: a functionally-equivalent, gate-patched, unsigned CE Doctor.
./build-ce-doctor.sh

# With a change overlay (see overlays/README.md):
./build-ce-doctor.sh overlays/sample-rdxd-fix
```

Output: `../out/webosdoctorp305hstnh-3.1CE.jar`. First run extracts the OEM JAR
into `work/` (cached for later runs; `REEXTRACT=1` forces re-extract).

## What it does

| Step | Detail |
|------|--------|
| **Unpack** | Streams `resources/webOS.tar` from the JAR; lands its members (incl. `nova-cust-image-topaz.rootfs.tar.gz`) in `work/webos/`, recording exact tar metadata for a faithful rebuild. |
| **Modify** | Applies an overlay (add/replace/remove) to the rootfs via a **streaming tar-rewriter**: untouched members are copied verbatim (mode, `root:root`, device nodes, symlinks all preserved); changed/added members are forced to `root:root`. |
| **Regen md5** | Keeps `/usr/lib/ipkg/info/*.md5sums` consistent for every change — updates the owning package's entry, attributes brand-new files to a CE package, drops removed files. (See overlays/README.md.) |
| **Verify** | Runs a faithful re-implementation of the on-device `integcheck -r <root> ipkg` (corrupt/missing **and** the ADDED-files check). **Aborts the build on failure.** |
| **Repack** | Rebuilds `webOS.tar` in original member order → rebuilds the JAR: copies all entries, **patches `FlasherThread.class`** (`checkToFlash`→false), **drops the signature** (`JARKEY.SF/RSA`) and rewrites `MANIFEST.MF` to a minimal `Main-Class` manifest. |

## Why these two patches are safe (verified)

- **`checkToFlash=false`** — the OEM Doctor's `FlasherThread.run()` contacts a
  dead Palm CS server (`/palmcsext/verifyWOD`) and throws "UNAUTHORIZED BUILD"
  when it can't authenticate. That block is guarded by the `checkToFlash` field.
  The 2-arg constructor already defaults it to `false` (`iconst_0; putfield`);
  the only thing that sets it `true` is `setCheckFlash(true)`. The harness
  neutralizes the setter with a **length-preserving, stack-neutral 1-byte swap**
  (`iload_1`→`iconst_0`), located via constant-pool parsing (not a hardcoded
  index). Verified: setter now stores false, constructor untouched, class parses.
- **Unsigned JAR** — nothing verifies the JAR's own signature at launch
  (`java -jar`); the OEM VeriSign cert is expired anyway. Dropping the signature
  and keeping only `Main-Class` is the standard, known-good approach.

- **`verifyRom` stays `true`** — the harness makes the *rootfs* honest instead of
  disabling the check. This is why md5 regeneration exists.

## Self-tests (run to date, all passing)

- `integcheck` on the **pristine** rootfs → SUCCEEDED (0 missing/failed/added) —
  validates the reimplementation against HP's own database.
- Full **identity build** → 234 MB JAR; repacked rootfs identical in count
  (19085), 100% `root:root`, all 59 device nodes / 1974 links / 2 setuid
  preserved; only `JARKEY.SF/RSA` removed; `FlasherThread` patched inside the JAR.
- **Overlay build** (rdxd fix) → owner detected, `rdxd.md5sums` updated,
  integcheck SUCCEEDED.
- **Negative:** tampered tracked file → `FAILED` (code 1); unregistered new file
  → `ADDED` (code 16) — the integrity net has teeth.

Reproduce:
```bash
python3 harness.py integcheck <rootfs.tar.gz>     # dry-run a rootfs
python3 harness.py patch-flasher <FlasherThread.class> [--write]
```

## Files

| Path | Role |
|------|------|
| `harness.py` | The engine (subcommands: `extract`, `integcheck`, `patch-flasher`, `build`). |
| `build-ce-doctor.sh` | Convenience orchestrator with conventional paths. |
| `overlays/` | Change overlays (+ `sample-rdxd-fix`). See `overlays/README.md`. |
| `work/` | Build workspace (git-ignored; extracted OEM members + intermediate rootfs). |

## Not yet in Phase 0 (Phase 1+)

- Installing components that are ipks (TLS, LunaCE, hardware, App Catalog) into
  the offline root (reuses the md5/integcheck engine).
- Branding writes (`palm-build-info` rename + `/etc/webos-ce-release`) as an
  overlay, with `palm-build-info`'s md5 regenerated.
- Regenerating the whole-rootfs `/md5sums.gz` (only needed if we edit
  `/etc/passwd|group|version` or `/etc/ipkg/arch.conf`, which Phase 0 does not).
- Optional self-signing of the JAR (currently shipped unsigned).
- On-hardware flash validation on a real `topaz`.
