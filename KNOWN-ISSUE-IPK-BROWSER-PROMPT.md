# Known issue: browser-downloaded `.ipk` files still ask which app to open them with

**Applies to:** webOS CE 3.1.0 Doctor builds up to and including the **600024**
release candidate.

**Severity:** cosmetic — one extra tap. Installing still works.

## What you might see

Download a `.ipk` file **in the browser** and tap it, and webOS asks you to pick
an application to open it with instead of handing it straight to Preware.

Picking **Preware** in that prompt installs the package normally. Nothing is
broken; you just get a prompt that this build was supposed to have removed.

Installing from the **App Catalog** is unaffected — that path works with no
prompt, because the catalog hands the file to the installer itself rather than
going through the file-association system.

## What we expected

This build pre-registers Preware as the handler for `.ipk` in
`/usr/palm/command-resource-handlers.json`:

```json
{"extn": "ipk", "mime": "application/vnd.webos.ipk",
 "appId": "org.webosinternals.preware", "streamable": false}
```

Stock webOS has **no** `ipk` entry at all, which is why Preware normally has to
ask for the association on first use. Seeding it statically was meant to make
that prompt disappear on a fresh device — and it does for the App Catalog path.

## Leading theory (unconfirmed)

The registration matches on **both** an extension and a MIME type. A browser
download is most likely matched on the **MIME type the web server sent**, and
most servers hand out `.ipk` as `application/octet-stream` (or `text/plain`),
not `application/vnd.webos.ipk`. If the lookup is MIME-first, our entry never
matches a browser download and webOS falls back to asking.

If that is right, the fix is to register the generic download MIME types for the
`ipk` extension as well, rather than only the webOS-specific one. This has not
been verified on hardware, so treat it as a starting point, not an answer.

A second possibility worth ruling out: runtime handler changes are written to
`/var/usr/palm/…-active.json`, which a Doctor flash wipes. If some component
consults only the active file rather than the static one, the static seed would
be invisible to it until something writes that file.

## If you hit it: what to capture

The most useful single fact is **what MIME type the server sent** for the file
you downloaded. From a computer:

```
curl -sI <the .ipk URL> | grep -i content-type
```

Then from the device, over `novacom`:

```
novacom get file:///usr/palm/command-resource-handlers.json > handlers.json
novacom get file:///var/log/messages > messages.log
```

and note whether the prompt appeared for a file downloaded from the browser, the
App Catalog, or somewhere else — the difference between those paths is the whole
question.
