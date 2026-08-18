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
