# Photos: showing a real filename  — IMPLEMENTED

> **Status 2026-08-19: option A is built, device-verified, and in the image**
> (BUILDMARK 600030). The toolbar shows the basename — verified on device with
> `/media/internal/wallpapers/06.jpg`, which rendered as `06.jpg` centred between
> the "Wallpapers" back button and the tool buttons.
>
> * app source: `~/Desktop/jonwise/Projects/com.palm.app.photos`
>   (`source/modes/PictureMode.js`, `css/PictureMode.css`)
> * patches: `build/full-ce/photos-exhibition/patches/PictureMode-filename.{js,css}.patch`
> * applied by `edit_photos()` in `bake.py`, AFTER synergy's own `PictureMode.js.patch`
>   (ours is generated against that result, so order is load-bearing)
> * the webOS Internals patch was NOT used — user reports it never worked
>
> Left undone deliberately: **option B (details popup)** if full path / dimensions
> / size are ever wanted, and the **video-suppression path is untested** — the
> code skips the label when `mediaType === "video"`, but there was no video on the
> device to confirm it.

## Original scoping follows

**Ask:** the Photos app never shows a filename anywhere; there should be *some*
way to see one. Scoped 2026-08-19 against `com.palm.app.photos` 3.0.8001
(source: `~/Desktop/jonwise/Projects/com.palm.app.photos`, byte-identical to what
ships).

## Summary

Cheap and low-risk. The data is already in hand at exactly the right moment, and
**the app already does this for videos** — photos simply never got the same
treatment. Recommended option is ~15 lines in one file plus a CSS rule.

---

## 1. What's available

`dbEntry.path` holds the full path and is the app's second-most-used record field
(23 call sites). It is already in scope in the single-photo view:

```js
// source/modes/PictureMode.js:422
path = this.$.imageView.center.dbEntry.path;
```

**`dbEntry.name` is NOT the filename** — it is the *album* name
(`LibraryMode.js:200`, `AlbumLocalizationHackDbService.js`). Photo records carry
no display name, so a basename has to be derived from `path`.

## 2. Prior art — inside the app, and outside it

**Inside:** videos already show their filename. `DbViewVideo.js:293-295`:

```js
var tokens = this.dbEntry.path.split(/\//);
var basename = tokens[tokens.length-1];
this.$.videoTitle.setContent(enyo.string.escapeHtml(basename));
```

That is the pattern to copy, `escapeHtml` included — a filename is untrusted text
being written into innerHTML, so it must be escaped. Copying this also keeps
photos and videos consistent rather than inventing a second convention.

**Outside:** webOS Internals ships a patch called
`org.webosinternals.patches.photos-show-filenames` — it was installed on the
stock-lineage test device. **Look at it before building anything.** If it already
solves this well, matching its placement is better than diverging from what users
already know; if it does something we do not want, that is worth knowing too.
It was not inspected here because that device has since been re-flashed.

**Abandoned attempt, still in the source** — `AlbumGridView.js:276`:

```js
//    var fname = inRecord.path.split("/");
//    fname = fname[fname.length-1];
//    console.log("- @ - @ -  setup cell ...
```

Someone started per-thumbnail filenames and stopped. Presumably it was too noisy
at grid scale; treat that as a hint, not a mandate.

---

## 3. Options, ranked

### A. Filename in the single-photo toolbar  ← recommended

`PictureMode`'s top control bar is `backButton` → **`spacer` (flex:1)** → six tool
buttons. That spacer is dead space across the middle of the bar and is the natural
home for a centred filename.

* **Hook:** `pictureChanged()` (`PictureMode.js:397`) already runs on every photo
  change and already holds `im.center.dbEntry`.
* **Visibility:** the bar auto-hides, so the filename appears on tap and fades with
  the other controls. That suits "some way to see it" without permanently
  covering the photo.
* **Cost:** one component, ~8 lines in `pictureChanged`, one CSS rule.

Sketch:

```js
// in the topControls components array, replacing the bare spacer
{ name: 'spacer', flex: 1, components: [
    { name: 'fileNameLabel', className: 'pictureFileName enyo-text-ellipsis' }
]},
```

```js
// in pictureChanged(), where dbEntry is already in hand
if (im.center && im.center.dbEntry && im.center.dbEntry.path) {
    var t = im.center.dbEntry.path.split(/\//);
    this.$.fileNameLabel.setContent(enyo.string.escapeHtml(t[t.length - 1]));
} else {
    this.$.fileNameLabel.setContent("");
}
```

```css
.pictureFileName {
    text-align: center;
    color: #ffffff;
    font-size: 20px;
    line-height: 40px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
```

**Note for whoever implements:** `text-shadow` does NOT render in this WebKit — if
the label needs contrast against a bright photo, use the two-copy trick from the
exhibition clock (black copy behind, white in front). Against the existing dark
toolbar background it should not be needed.

### B. Details popup from the "More" menu

`moreMenu` already has *Add to Album* and *Set As Wallpaper*, with a working
`moreMenuItemSelectHandler`. Adding a *Details* entry that opens a small popup
could show filename, full path, album, and type.

More useful, roughly 3–4× the work (new popup kind + strings + layout), and it
puts the information two taps away instead of zero.

### C. Filenames under grid thumbnails

The `AlbumGridView` route someone already abandoned. Cheap to re-enable but
likely noisy, and thumbnail cells give very little width. Not recommended as the
primary answer; possible as a preference later.

### D. Filename in the Exhibition slideshow

Would reuse the corner-overlay pattern from the exhibition clock. Deliberately
out of scope — an unattended photo frame is the one place a filename is least
wanted, and it competes with the clock for the same corner.

---

## 4. Risks and details

* **Escape the filename.** It is user-controlled text going into innerHTML.
  `enyo.string.escapeHtml`, as `DbViewVideo` does.
* **Long names.** `enyo-text-ellipsis` is already used by `backButtonLabel`;
  reuse it rather than inventing truncation.
* **Videos would show it twice.** `PictureMode` handles both photos and videos,
  and videos already display their basename in the video control bar. Either
  suppress the new label when `dbEntry.mediaType === "video"` (the field is
  already read in `pictureChanged`) or accept the duplication deliberately.
* **Cloud photos may have odd paths.** Facebook/Dropbox-backed entries may carry
  a URL-ish or synthetic `path`; the basename split still yields *something*, but
  it is worth eyeballing one cloud album before shipping.
* **No i18n needed** for option A — a filename is not translatable text. Option B
  would need strings for its labels.

## 5. Effort

| option | files touched | rough size |
| --- | --- | --- |
| A — toolbar label | `PictureMode.js`, `css/PictureMode.css` | ~15 lines |
| B — details popup | + a new popup kind + `resources/` strings | ~120 lines |
| C — grid captions | `AlbumGridView.js`, `css/AlbumMode.css` | ~20 lines |

## 6. How it would ship

Same route the exhibition clock already uses, so this is a solved path:

1. Patch the app in `~/Desktop/jonwise/Projects/com.palm.app.photos`.
2. Generate a patch into `build/full-ce/photos-exhibition/patches/`
   (or rename that dir to something neutral like `photos-ui/` — it is CE-authored
   Photos work, and "exhibition" no longer describes all of it).
3. Add a `run_patch(...)` line to `edit_photos()` in `bake.py`.

`repack_staged_ipk()` rebuilds the Photos preload ipk from the stock jar on every
bake, so the patch must live there — editing the overlay directly does nothing,
since `bake.py` regenerates it.

**Test loop reminder:** webOS caches Enyo app code aggressively and an Exhibition
scene never fully dies. Restart Luna after pushing, or you will be testing the old
code and concluding the change did not work.

## 7. Recommendation

Do **A**, after first looking at `org.webosinternals.patches.photos-show-filenames`
to see whether it already places this somewhere users expect. A is small enough
that matching the community patch's placement, if it is sensible, costs nothing.
Keep B on the list if you later want full path / dimensions / size, which a single
toolbar label cannot carry.
