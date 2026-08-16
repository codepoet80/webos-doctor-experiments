# CLAUDE.md — PivotMagazine-WOSA

## What this repo is

Magazine content for the webOS Archive App Catalog. The app's built-in magazine viewer (the "Pivot Magazine" feature) loads pages dynamically from a folder called `defaultEdition/` inside the installed package. This repo holds that content independently so it can be versioned and updated without touching the app code.

`Issues/Current/` is what gets injected into `defaultEdition/` at build time. `Issues/2011/` is the original HP-era content kept for reference.

The build script lives in the **app repo** at `~/Projects/webos-appcatalog/build-ipk.sh` — not here.

---

## Issue folder structure

Every issue folder (e.g. `Issues/Current/`) has the same layout:

```
{issue}/
├── manifest.json               ← root/legacy manifest (no lang code, 1-page)
├── common/                     ← lang-agnostic shared assets
│   ├── css/                    ← magazine.css, page.css
│   └── images/                 ← light-bg.png etc.
└── {lang}/                     ← one folder per locale: en, de, es, fr, it
    ├── manifest.json           ← THE manifest the app actually uses
    ├── gen-manifest.sh         ← legacy Linux-only manifest generator (see below)
    ├── common/
    │   ├── apps/               ← one subfolder per featured app
    │   │   └── {appname}/
    │   │       └── info.json
    │   ├── layouts/            ← shared Enyo component templates (.lo.js)
    │   │   ├── app.lo.js           ← renders a single app card
    │   │   ├── portraitHeader.lo.js
    │   │   ├── landscapeHeader.lo.js
    │   │   └── header.json         ← bindings for the header templates
    │   ├── css/                ← magazine.css, page.css
    │   └── images/             ← shared UI images (arrows, gradients)
    └── page{N}/                ← one folder per page, 0-indexed
        ├── bindings.json       ← template variable values for this page
        ├── portrait.lo.js      ← Enyo component tree, portrait layout
        ├── landscape.lo.js     ← Enyo component tree, landscape layout
        └── images/
            ├── portrait-bg.jpg
            └── landscape-bg.jpg
```

The English edition (`en/`) has 32 pages (page0–page31). Other locales currently only have page0.

---

## File formats

### `bindings.json`

Plain JSON. Defines template variable values for a page. All `{$varName}` tokens in the `.lo.js` files for that page are substituted with the corresponding value before the layout is evaluated.

```json
{
    "portraitBgImage": "page28/images/portrait-bg.jpg",
    "landscapeBgImage": "page28/images/landscape-bg.jpg",
    "appTemplate": "common/layouts/app.lo.js",
    "app1BindingsPortrait": "common/apps/kindle/info.json",
    ...
}
```

All paths in `bindings.json` are **relative to the language folder** (e.g. `en/`).

### `.lo.js` layout files

A JavaScript array literal containing an Enyo 0.x component tree. **Not valid JSON** — keys may be unquoted, and the file is `eval()`'d by the magazine engine after template substitution.

```javascript
[
    {kind: "VFlexBox", className: "portrait",
     style: "background-image: url({$portraitBgImage}); height:1024px; width:768px;",
     components: [
        {kind: "enyo.FindApps.Magazine.BindableLayout",
         templatePath: "{$portraitHeaderTemplate}",
         bindingPath: "{$headerTemplateBindings}"},
        {kind: "enyo.FindApps.Magazine.BindableLayout",
         className: "index-app1",
         templatePath: "{$appTemplate}",
         bindingPath: "{$app1BindingsPortrait}"},
        ...
    ]}
]
```

`{$varName}` tokens are replaced by values from `bindings.json` before eval. Paths in `templatePath` and `bindingPath` are also relative to the language folder.

### `common/apps/{appname}/info.json`

Identifies an app to feature. `_app_id` is the webOS app ID. The remaining fields are placeholders — the magazine engine fetches live values (rating, price, review count) from the App Catalog service at render time.

```json
{
    "_app_id": "com.palm.app.kindle",
    "rating": "{$_app_rating}",
    "reviewCount": "{$_app_reviewCount}",
    "price": "{$_app_price}"
}
```

To feature a new app: create a new subfolder under `common/apps/` with an `info.json` using the app's webOS package ID.

### `manifest.json`

Tells the magazine engine which files exist in this edition. The engine reads this first, then fetches individual files on demand.

```json
{
    "publishDate": "06/01/2011 12:00:00",
    "numPages": 32,
    "packageSize": 12345678,
    "results": [
        {
            "logicalPath": "page10/images/landscape-bg.jpg",
            "checksum": "d5b7de79af584941a8ef0595c5b0c443",
            "section": "page10",
            "type": "image",
            "edition": 1,
            "physicalPath": "source/magazine/defaultEdition/en/page10/images/landscape-bg.jpg",
            "size": 179380
        },
        ...
    ]
}
```

**Critical fields:**
- `logicalPath` — path relative to the language folder (e.g. `en/`)
- `physicalPath` — path relative to the **app package root**. Must always start with `source/magazine/defaultEdition/{lang}/`. Getting this wrong silently breaks page loading.
- `checksum` — MD5 hex digest of the file
- `type` — one of `image`, `layout`, `binding`, `css`
- `section` — the page or `common` prefix (first path component of `logicalPath`)
- `numPages` — total page count; must match the actual number of page folders
- `packageSize` — sum of all file sizes in bytes

**The manifest must be regenerated any time files are added, removed, or changed.**

---

## Regenerating the manifest

Each language folder contains a `gen-manifest.sh` that was used by HP's original toolchain. **It only works on Linux** (`md5sum` and `stat -c%s` are Linux-specific). On macOS the equivalents are `md5 -q` and `stat -f%z`.

The `Tools/` directory is the intended home for cross-platform manifest tooling. A future tool should:
- Walk the language folder, find all `.js`, `.json`, `.jpg`, `.png`, `.gif`, `.css` files
- Skip `manifest.json` itself
- For each file: compute MD5, determine type from extension (`.lo.js` → `layout`, `.json` → `binding`, image exts → `image`, `.css` → `css`), get file size
- Construct `logicalPath` (relative to lang folder), `physicalPath` (`source/magazine/defaultEdition/{lang}/` + logicalPath), `section` (first path component)
- Sum all sizes for `packageSize`
- Accept `--numPages N` and `--lang en` arguments, write `manifest.json` in-place

---

## Page types in the English edition

Pages are not all the same — they use different layout templates and binding keys. Examples:

| Pages | Type | Key bindings |
|-------|------|-------------|
| 0 | Splash / cover | Just background images |
| 1 | Masthead / about | Header template, email, version |
| 2 | Table of contents | `targetHinge`, `targetSphereN`, `targetHub`, `targetOrientN` (navigate to pages by name) |
| 3 | TOC page 2 | Navigation targets |
| 28, 30 | Featured app grids | `appNBindingsPortrait/Landscape` pointing to `common/apps/*/info.json`; navigation link fragments |
| Most others | Content/editorial | Background images + header template |

The `target` / `runtimeParams` mechanism on clickable elements navigates to another page or launches a search list. `target: "searchlist"` with a `queryFragment` opens the app list filtered by that query.

---

## Deploying a new issue

1. Create `Issues/{name}/` (copy `Issues/Current` as a starting point).
2. Edit pages: swap background images, update `bindings.json` for new featured apps, add new `common/apps/` entries.
3. Run the manifest tool from `Tools/` to regenerate `{lang}/manifest.json`.
4. Test by building the IPK: `cd ~/Projects/webos-appcatalog && ./build-ipk.sh`.
5. When satisfied: replace `Issues/Current/` with the new content (copy, rename, or adjust the build script to point to the new issue folder).

---

## Relationship to the app repo

- App repo: `~/Projects/webos-appcatalog/com.palm.app.enyo-findapps`
- The magazine **engine** (Enyo kinds: `Magazine`, `MagazinePage`, `BindableLayout`, etc.) is compiled into `build.js` in the app repo. Do not look for it here.
- The magazine **content** (pages, images, bindings) lives here in `Issues/`.
- `com.palm.app.enyo-findapps/main/source/magazine/defaultEdition/` is an empty placeholder (`.gitkeep`) in the app repo — it gets populated at build time.
