# ~~Known issue~~ RESOLVED in 600037: `.ipk` files in the browser now open Preware

**Status: FIXED.** Confirmed on hardware — a `.ipk` link in the browser opens
Preware instead of stopping at a downloaded file.

**Root cause was NOT the MIME type.** The theory below (server sends
`application/octet-stream`, our registration only lists
`application/vnd.webos.ipk`) is **wrong** — `getResourceInfo` resolved `.ipk` to
Preware correctly all along. The actual cause:

* A **static** entry in `/usr/palm/command-resource-handlers.json` is always
  registered `streamable: false` — `MimeSystem::populateFromJson` does not honour
  the flag (setting it true, or omitting it, both still give `canStream:false`).
* The browser only hands an http/https URL to the handler app when `canStream` is
  **true** (`BrowserApp.js` `gotResourceInfo`), so it downloaded instead.
* Tapping **Open** could not rescue it either: `servicecallback_open` refuses
  `.ipk` unless the *caller* is in a hardcoded whitelist
  (`ApplicationManager::isTrustedInstallerApp` → `com.palm.app.{findapps,firstuse,updates}`);
  the browser is not in it.
* Worse, the static entry persisted into the saved mime table and **deduped** any
  later `addResourceHandler`, so it also defeated Preware's own prompt.

**The fix:** register the way Preware does — at runtime, via
`palm://com.palm.applicationManager/addResourceHandler` with
`{extension, mimeType, appId}` and **no** `streamable` key (that service defaults
it to true). Done once per flash by `/etc/event.d/ce-register-ipk-handler`
(verify-then-flag), and the static seed was removed.

**Do not re-add a static ipk entry** — it will re-break this.

---

*Original write-up, kept for the record (its "leading theory" is disproven):*

# Known issue: `.ipk` files downloaded in the browser aren't handed to Preware

**Applies to:** webOS CE 3.1.0 Doctor builds up to and including the **600024**
release candidate.

**Severity:** low — everyday installing is unaffected, but this one route
doesn't work.

## What you might see

Download a `.ipk` file **in the browser** and nothing installs it. The file
downloads and that's the end of it — webOS does **not** ask you what to open it
with, because it has no handler-disambiguation prompt: when it can't find a
handler for a file, it simply downloads it and stops.

So there is nothing to tap through. The package is on the device but never
reaches Preware.

**Unaffected:** installing from the **App Catalog** works normally, as does
installing from Preware's own feeds. Those are the routes almost everyone uses;
this issue only affects grabbing a raw `.ipk` from a web page.

## What we expected

This build pre-registers Preware as the handler for `.ipk` in
`/usr/palm/command-resource-handlers.json`:

```json
{"extn": "ipk", "mime": "application/vnd.webos.ipk",
 "appId": "org.webosinternals.preware", "streamable": false}
```

Stock webOS has **no** `ipk` entry at all. Seeding one statically was meant to
make browser-downloaded packages open in Preware on a fresh device. It clearly
takes effect for the App Catalog path, but not for a browser download.

## Leading theory (unconfirmed)

The registration carries both an extension and a MIME type. A browser download is
most likely matched on the **MIME type the web server sent**, and most servers
hand out `.ipk` as `application/octet-stream` (or `text/plain`), not
`application/vnd.webos.ipk`. The lookup finds no handler, and — with no
disambiguation prompt to fall back on — webOS just keeps the file.

If that's right, the fix is to register the generic download MIME types against
the `ipk` extension as well, rather than only the webOS-specific one. This has
**not** been verified on hardware; treat it as a starting point.

Second possibility worth ruling out: runtime handler state is written to
`/var/usr/palm/…-active.json`, which a Doctor flash wipes. If some component
reads only that file rather than the static one, our seed would be invisible to
it until something writes it.

## If you hit it: what to capture

The single most useful fact is **what MIME type the server sent**. From a
computer:

```
curl -sI <the .ipk URL> | grep -i content-type
```

Then from the device, over `novacom`:

```
novacom get file:///usr/palm/command-resource-handlers.json > handlers.json
novacom get file:///var/log/messages > messages.log
```

Also note where the file ended up (usually `/media/internal/downloads`) and
whether the same package installs cleanly from the App Catalog — the difference
between those two paths is the whole question.
