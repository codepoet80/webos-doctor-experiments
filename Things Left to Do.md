# Things Left to Do

## Done — shipped in the 600024 release candidate

- ~~`/etc/palm-build-info` has an ancient BUILDTIME~~ — stamped per build.
- ~~ancient BUILDMARK=528667~~ — CE marks start at 600000 and increment per bake;
  every build also writes `build/full-ce/manifests/<BUILDMARK>.json`.
- ~~Preware is not registered as an app installer~~ — pre-registered as the `.ipk`
  handler in `/usr/palm/command-resource-handlers.json`.
- ~~LunaCE Patches missing~~ — LunaCE Tweaks definitions seeded to cryptofs
  (inert until the user installs Tweaks).
- ~~Developer mode turned itself off~~ — `turnOnNovacomAtStart=true` forces it on
  at every boot.
- ~~Hotspot detection using a dead URL~~ — connectivity probes byte-patched to
  live community hosts; captive-portal webview repointed too.
- ~~Default keyboard size~~ — defaults to small.
- ~~webOS Account app re-runs the OOBE language card from the launcher~~ — the app
  is OOBE-only again (`visible:false`); post-OOBE account management becomes a
  separate catalog app (notes on branch `split-oobe-and-account-app` in
  `webos-community-account`).
- ~~"Skip Account Setup" leaves the profile named "Dr. Skipped Firstuse"~~ —
  renamed to "webOS User".
- ~~Audit ce-firstboot-tweaks / ce-remove-preloads against a no-reboot OOBE~~ —
  both now wait for a real cryptofs write, verify their work, and only then set
  their once-per-flash flag; each retries on later triggers.

## Open

- **Un-bake Maps and App Catalog — ship them as preload `.ipk`s again.**
  **DONE as of 600028 (2026-08-19): rootfs 122 MB free / 79% used = stock parity.**
  Catalog ships as a 1.6 MB preload ipk; `ce-reclaim-customization-media` frees the
  staged wallpapers/ringtones unattended at first boot (+28.2 MB). Fix the supplied
  catalog ipk's `Package:` field AT SOURCE (see TEST-PLAN §6).
  Earlier flash-test (BUILDMARK 600025) on the RC1->600025
  path: both install to cryptofs, register, and survive; rootfs 93%/38.3MB free.
  Still open: the stock-lineage upgrade (stale 5.0.2900/3.0.1 cryptofs copies) and
  the de-shadow-after-install ordering, neither exercised yet — see TEST-PLAN §6.** Both now
  stage from `AddToImage/PreInstall/` into `/usr/palm/ipkgs/`; both removed from
  `BAKED_APP_IDS`; manifest.json rewritten (16 -> 14 entries). Remaining risk: a
  device upgrading from stock keeps stale cryptofs copies (5.0.2900 / 3.0.1) that
  the de-shadow pass no longer removes — first boot should `ipkg install`-upgrade
  them, but that path is unverified. See TEST-PLAN §6. Swap in the deduped catalog
  ipk when it lands (41.5 MB interim -> ~14 MB).
  **Decision (2026-08-19):** Maps and App Catalog come out of the system image.
  Messaging, Contacts, Preware, Govnah, usbsettings, btgamepad and cloud-auth
  **stay baked**.

  **The primary reason is updateability, not size.** An app delivered as a
  preload ipk installs into `/media/cryptofs/apps`, so it can be updated through
  the App Catalog afterwards. An app baked into the read-only rootfs can only be
  changed by re-flashing the Doctor. Reclaimed rootfs headroom is a secondary
  benefit.

  Doctor-side change:
  - drop `usr/palm/applications/com.palm.app.enyo-findapps` and
    `usr/palm/applications/com.palm.app.maps` from the overlay;
  - ship `usr/palm/ipkgs/com.palm.app.<id>_<version>_all.ipk` instead, with the
    `<id>-icon.png` and `manifest.json` entry the preload mechanism expects
    (stock ships both alongside each ipk);
  - remove both ids from `bake.py`'s `BAKED_APP_IDS` (~line 2063) and revisit the
    `ce-firstboot-tweaks` de-shadow step for them — see caveat.

  **Order matters for App Catalog:** the duplicate magazine tree must be gone
  first. Measured `tar | gzip -9` of the bundle — with the duplicates **39.5 MB**
  as an ipk (worse than stock's 14.2 MB), with them removed **14.3 MB** (stock
  parity), with no bundled magazine at all **1.6 MB**. The unreferenced ~30 MB
  `PivotMagazine-WOSA` tree is proven safe to delete (nothing in `build.js`,
  `archive-patch.js` or `pre-init.js` references it; removed by hand on the test
  device, 95% -> 90%) but the overlay still carries it. Getting the magazine to
  fetch into `/media/internal` is the App Catalog project's side — see
  `APP-CATALOG-MAGAZINE-DISTRIBUTION.md` (moved into that project).

  **Caveat — the baking was deliberate, so this is not a plain revert.**
  `BAKED_APP_IDS` exists because `/media/cryptofs` **survives Doctor flashes**, so
  a stale cryptofs copy shadows a newly-baked rootfs app — seen live, Maps 3.0.1
  shadowing baked 4.0.1 — and `ce-firstboot-tweaks` deletes those stale copies
  once per flash to compensate. Shipping only as an ipk sidesteps shadowing
  entirely (no rootfs copy left to shadow, and ipkg's version comparison handles
  the upgrade), but the de-shadow job must be updated as part of the change
  rather than left fighting it.

  **Size effect of the decision:** App Catalog −5.7 MB (−18 MB once the magazine
  fetches) plus Maps −0.5 MB, so roughly **6 MB** now. Messaging would have been
  the single largest win at −7.1 MB — almost entirely ext3 block-rounding on its
  2,667-file emoji set, which is 4.4 MB of bytes occupying 10.5 MB of blocks —
  but is deliberately staying in. Contacts −0.4 MB, not worth it.

  Measurements behind this: stock 3.0.5 ships all of these as preload ipks and has
  none of them in `/usr/palm/applications` — `enyo-findapps` 14.2 MB ipk -> 29 MB
  expanded, `maps` 185 KB -> 2 MB, `messaging` 313 KB -> 3 MB, `contacts` 130 KB
  -> 2 MB. Baking App Catalog expanded (50 MB) while dropping its ipk cost the
  rootfs a net **+36 MB**, the single largest reason CE shipped `/` at **95%
  (26.8 MB free)** against stock's **79% (115.2 MB free)**; both devices measured
  with `/` pristine and `ro`.

- **Post-OOBE account manager** — the sign-in app is first-use only. Build the
  separate `com.palm.app.webosaccount` catalog app (design notes on the
  `split-oobe-and-account-app` branch).
- **OTA path** — teach the update server that CE-uberkernel is the expected
  baseline, then the bootstrap OTA (OEM 3.0.5 → CE 3.1). See OTA-STRATEGY.md.
- **Browser-downloaded `.ipk` never reaches Preware** — the static handler seed
  works for App Catalog installs but not browser downloads, which simply stop at
  the downloaded file (webOS has no handler-disambiguation prompt). Likely a
  MIME-type mismatch: servers send `application/octet-stream`, we registered only
  `application/vnd.webos.ipk`. See KNOWN-ISSUE-IPK-BROWSER-PROMPT.md.
- **Default governor** — CE ships `performance`; consider seeding `ondemandtcl`.
- **Remaining hands-on tests** for the release candidate — see TEST-PLAN.md
  (controller pairing, email sync, QuickOffice/Photos UIs, `.ipk` tap-to-install,
  captive portal, non-English OOBE).
- **Unexplained one-off:** on 600023 the UI wedged once after tapping Luna
  Restart. 600024 fixed the mechanism behind it (ipkgservice is resident again)
  and the restart now works, but if a UI wedge is ever seen again, capture state
  before rebooting — procedure in TEST-PLAN.md.
