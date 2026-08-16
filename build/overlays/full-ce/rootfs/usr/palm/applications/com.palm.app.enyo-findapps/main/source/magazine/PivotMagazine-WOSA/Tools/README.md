# Tools

Cross-platform helpers for working with Pivot Magazine issues. See the repo's `CLAUDE.md` for full format documentation.

---

## `preview/` — Live browser preview

Renders the magazine in a desktop browser using the real Enyo 0.x engine from the app's `build.js`. Requires the app repo to be checked out alongside this one under the same `webos-appcatalog/` parent.

**Start the preview:**

```bash
cd ~/Projects/webos-appcatalog
python3 PivotMagazine-WOSA/Tools/preview/serve.py
```

Opens `http://localhost:8080/PivotMagazine-WOSA/Tools/preview/` automatically.

**URL parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `issue` | `Current` | Issue folder name under `Issues/` |
| `lang` | `en` | Language subfolder |
| `page` | `0` | Starting page number |

Example: `http://localhost:8080/PivotMagazine-WOSA/Tools/preview/?issue=Current&lang=en&page=5`

To preview a new issue, create it first with `new-issue.py` (see below), then use `?issue=YourIssueName`.

**Toolbar controls:** Prev/Next page · Portrait/Landscape toggle · Issue + Lang inputs with Reload button.

**How it works:** The server serves the `webos-appcatalog/` root so both repos are reachable. The preview sets `AppCatalog.Config.draftEditionDir` to the issue URL, which tells the magazine engine to load `manifest.json` and derive all asset URLs from that base — no path remapping needed. WebOS-specific services (Luna, DB, activity manager) are stubbed out. The featured-app download buttons are replaced with passive placeholders since HP-era app IDs no longer exist.

**First-time setup:** `vendor/enyo-build.js` and `vendor/enyo-build.css` are copied from the Palm SDK and are gitignored. If they go missing, re-run:

```bash
cp /opt/PalmSDK/Current/share/framework/enyo/1.0/framework/build/enyo-build.{js,css} \
   Tools/preview/vendor/
```

Other Palm SDK assets (Onyx theme images, g11n data) are served automatically by `serve.py` directly from `/opt/PalmSDK/Current/` — no copying needed.

---

## `gen-manifest.py` — Manifest regenerator

Regenerates `{lang}/manifest.json` after any files are added, removed, or changed. Replaces the Linux-only `gen-manifest.sh` found in each locale folder. Works on macOS and Linux.

```bash
# From the PivotMagazine-WOSA repo root:
python3 Tools/gen-manifest.py

# Specify issue and language:
python3 Tools/gen-manifest.py --issue Issues/Current --lang en

# Override page count (default: auto-count page* folders):
python3 Tools/gen-manifest.py --issue Issues/2026-Summer --lang en --num-pages 28
```

Computes MD5 checksums, file sizes, and `physicalPath` values (`source/magazine/defaultEdition/{lang}/…`) for every file in the language folder, then writes `manifest.json` in-place. Preserves the existing `publishDate` if the manifest already exists.

**Run this every time you add, remove, or replace a file in a language folder.**

---

## `new-issue.py` — Issue scaffolder

Creates a new issue folder by copying `Issues/Current` as a starting point.

```bash
# From the PivotMagazine-WOSA repo root:
python3 Tools/new-issue.py 2026-Summer
```

Copies `Issues/Current/` → `Issues/2026-Summer/`, updates `publishDate` to today in all `manifest.json` files, and prints next-step instructions.

After editing content, regenerate the manifest:

```bash
python3 Tools/gen-manifest.py --issue Issues/2026-Summer --lang en
```

Then preview:

```bash
python3 Tools/preview/serve.py
# open: http://localhost:8080/PivotMagazine-WOSA/Tools/preview/?issue=2026-Summer&lang=en
```
