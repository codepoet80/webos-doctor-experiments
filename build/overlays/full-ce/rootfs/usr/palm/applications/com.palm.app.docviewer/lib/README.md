# Vendored render libraries (drop-in)

These libraries are **not committed** here (size + license hygiene). The render harness
(`../render/harness.js`) loads them at runtime from the paths below and **degrades to an
on-screen message if one is absent** — so the app installs and runs without them; you only
add the ones whose formats you want. All three are **view-only** renderers (no editing).

| Format | Library | File(s) to place | Global it exposes | License |
|---|---|---|---|---|
| PDF  | **PDF.js** (Mozilla)        | `pdfjs/pdf.js` **and** `pdfjs/pdf.worker.js` | `window.pdfjsLib` | Apache-2.0 |
| DOCX | **mammoth.js**             | `mammoth/mammoth.browser.min.js`             | `window.mammoth`  | BSD-2-Clause |
| XLSX | **SheetJS (xlsx)** CE       | `sheetjs/xlsx.full.min.js`                   | `window.XLSX`     | Apache-2.0 |

## Which build / version

The card's own webview is WebKit ~2009 and is **not** used for these — the harness runs in
**Atlas (WPE WebKit, modern)**, so use the current standard browser builds.

**Pinned versions actually deployed + verified on device (2026-07-15):**

| Lib | npm | File(s) taken from the tarball |
|---|---|---|
| PDF.js  | `pdfjs-dist@3.11.174` | `legacy/build/pdf.js`, `legacy/build/pdf.worker.js` → `pdfjs/` |
| mammoth | `mammoth@1.6.0`       | `mammoth.browser.min.js` → `mammoth/` |
| SheetJS | `xlsx@0.18.5`         | `dist/xlsx.full.min.js` → `sheetjs/` |

Reproduce with `npm pack <pkg>@<ver>` and copy the files above. Notes:

- **PDF.js** — the v3 **legacy** (ES5-transpiled) build is the safest match for an older WPE;
  v4+ needs more modern JS. Keep `pdf.js` + `pdf.worker.js` together in `pdfjs/`; the harness
  sets `workerSrc` to `pdf.worker.js`.
- **mammoth** — `mammoth.browser.min.js` exposes `window.mammoth`.
- **SheetJS** — `xlsx.full.min.js` (CE) exposes `window.XLSX`.

Place the files exactly at the paths in the table (relative to this `lib/` dir). On device
that resolves under the app install dir, e.g.
`/media/cryptofs/apps/usr/palm/applications/com.palm.app.docviewer/lib/pdfjs/pdf.js`.

## file:// access note (read this if PDFs load blank)

The harness XHRs the document as an ArrayBuffer from a `file://` URL while the harness page
is itself served over `file://`. Most WebKit/WPE builds treat file→file as same-origin and
allow it. If a hardened WPE build blocks it (`status 0`, empty response), either:

1. launch Atlas/WPE with file-access-from-file-URLs enabled (WPE build flag), or
2. co-locate the document with the harness so the read is within one directory (some builds
   scope file access to the loading document's folder).

This caveat only affects the Atlas-hosted formats (pdf/docx/xlsx); the card's own
text/image paths use the same trick and are the zero-dependency proof that it works.
