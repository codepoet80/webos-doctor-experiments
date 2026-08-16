# PivotMagazine-WOSA

The "Pivot Magazine" featured-content edition for the [webOS Archive App Catalog](https://github.com/webOSArchive/webos-appcatalog). This repo holds the magazine **content** (page layouts, app data, background images, manifests) independently of the app itself.

## How it fits together

The webOS App Catalog (`com.palm.app.enyo-findapps`) contains a built-in magazine viewer engine. At runtime the engine loads page layout files, bindings, and images from a path inside the package called `defaultEdition/`. The build script in the app repo assembles the final IPK by injecting `Issues/Current/` from this repo into that path.

```
PivotMagazine-WOSA/
└── Issues/
    ├── Current/        ← injected as defaultEdition/ when building the IPK
    │   ├── en/         ← English edition (32 pages, full content)
    │   ├── de/         ← German (page 0 only)
    │   ├── es/fr/it/   ← Other locales (page 0 only)
    │   └── common/     ← lang-agnostic CSS and images
    └── 2011/           ← archived original HP issue (reference / history)
```

## Building the IPK

From the app catalog workspace (`~/Projects/webos-appcatalog`):

```bash
./build-ipk.sh          # uses Issues/Current as-is
./build-ipk.sh --pull   # git pull this repo first, then build
```

See the app repo's `build-ipk.sh` for full options.

## Creating a new issue

1. Duplicate `Issues/Current` to a new named folder (e.g. `Issues/2025`).
2. Edit page content — see `CLAUDE.md` for format details.
3. Add any new app entries to `{lang}/common/apps/`.
4. Regenerate `{lang}/manifest.json` using the tooling in `Tools/`.
5. When ready to ship: copy or symlink the new issue folder to `Issues/Current`.

## Tools

`Tools/` contains helpers for working with issue content. See `Tools/README.md` (or `CLAUDE.md`) for usage.
