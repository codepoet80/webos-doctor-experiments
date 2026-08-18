# Things Left to Do

- /etc/palm-build-info has an ancient BUILDTIME=20111221110520 - we should update it
- /etc/palm-build-info has an ancient BUILDMARK=528667 - we should include in our build process to update it each time, let's start at 600000 so there's a clear separation from legacy
- Preware is not registered as an app installer, and won't be until the user launches and approves it. We should pre-register it as the app installer (Preware source code available here: https://github.com/webOSArchive/preware)
- LunaCE Patches missing (see ~/Downloads/LunaCE-All/install_tweaks.sh and ~/Downloads/LunaCE-All/tweaks/)
- Developer mode was on after flash, but then turned off on its own somehow -- it might have been a different Claude session spelunking around on another topic, but double check: We should ALWAYS be in Developer mode (unless the user manually turns it off) in 3.1
- Hotspot detection is using a dead URL, and spuriously demanding the user to log-in to the Hotspot. We should update the URL it checks to http://www.webosarchive.org for connectivity
- LunaCE supports changing the keyboard size. Can we default to a smaller size (the original size looks comically large in 2026)?

## Open after flash 600009 (see NEXT-SESSION-PLAN.md for full detail)

- webOS Account app launched from the launcher re-runs the OOBE language card, which DELETES the user's account (and Done can power the device off) — it has no way to tell an OOBE launch from a normal one
- "Skip Account Setup" leaves the profile named "Dr. Skipped Firstuse"; should be "webOS User" (set by the stock palmprofile handler on the next boot, not by the app)
- Audit ce-firstboot-tweaks and ce-remove-preloads against a no-reboot OOBE — they still trigger only on `stopped configurator` and have never been checked without a second boot
