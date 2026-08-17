#!/bin/bash
# make-overlay.sh — generate build/overlays/community-firstuse/ : the CE Doctor
# overlay that swaps stock first-use for the community webOS Account flow.
#
# What lands in the overlay (see README.md here for the full story):
#   1. com.palm.app.firstuse replaced IN PLACE (id unchanged) with the community
#      webOS Account app from AddToImage/OOBE (org.webosarchive.webosaccount
#      ipk — the full app source, already carrying the community account flow),
#      plus the OOBE deltas in oobe/ (real Wi-Fi join, markFirstUseDone + reboot
#      completion, no Museum self-updater) and the trimmed OOBE card list
#      (oobe/config.js). The ipk's appinfo.json files are all EXCLUDED — the
#      app must keep the stock com.palm.app.firstuse identity or LunaSysMgr's
#      firstuse-mode launch can't find it.
#   2. com.palm.service.palmprofile: the ipk's service/ files laid over the
#      stock service (services.json + sources.json at the service root,
#      palm_profile_util.js -> utils/, the assistants -> handlers/) — the
#      webOS Archive backend plus updateUsername/syncDeviceName/signOut.
#   3. The account flow's hard transport prerequisites, baked into the rootfs:
#      modern curl (TLS 1.3) from the OpenSSL-legacyWebOS ipk, the ntpdate-sync
#      upstart job (TLS needs a sane clock), and a current CA bundle.
#   4. /var/gadget/novacom_enabled — every CE device is dev-unlocked out of the
#      box (community decision; deviceTool never needed again).
#
# Usage:  ./make-overlay.sh          (from build/community-firstuse/)
# Env:    TLSIPKS=<path to OpenSSL-legacyWebOS/ipks>
#         CA_BUNDLE=<current Mozilla bundle>            (default: host's)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"                    # build/community-firstuse
BUILD="$(dirname "$HERE")"                               # build/
TLSIPKS="${TLSIPKS:-$BUILD/../../OpenSSL-legacyWebOS/ipks}"
CA_BUNDLE="${CA_BUNDLE:-/etc/ssl/certs/ca-certificates.crt}"
ROOTFS_TGZ="$BUILD/work/webos/nova-cust-image-topaz.rootfs.tar.gz"
OUT="$BUILD/overlays/community-firstuse"

# prefer the project's AddToImage/PatchOrReplace copies (the user's statement
# of intent for image contents); fall back to the OpenSSL-legacyWebOS repo.
ATI_POR="$BUILD/../AddToImage/PatchOrReplace"
CURL_IPK="$(ls "$ATI_POR"/org.webosinternals.curl-tls13_*_armv7.ipk 2>/dev/null | sort -V | tail -1)"
[ -n "$CURL_IPK" ] || CURL_IPK="$(ls "$TLSIPKS"/org.webosinternals.curl-tls13_*_armv7.ipk | sort -V | tail -1)"
NTP_IPK="$(ls "$ATI_POR"/org.webosinternals.ntpdate-sync_*_armv7.ipk 2>/dev/null | sort -V | tail -1)"
[ -n "$NTP_IPK" ] || NTP_IPK="$(ls "$TLSIPKS"/org.webosinternals.ntpdate-sync_*_armv7.ipk | sort -V | tail -1)"

# the firstuse replacement app: newest webosaccount ipk in AddToImage/OOBE
# (mtime, not version — a corrected rebuild can reuse the same version string)
ATI_OOBE="$BUILD/../AddToImage/OOBE"
WOSA_IPK="$(ls -t "$ATI_OOBE"/org.webosarchive.webosaccount_*.ipk 2>/dev/null | head -1)"

for f in "$ROOTFS_TGZ" "$WOSA_IPK" "$CURL_IPK" "$NTP_IPK" "$CA_BUNDLE"; do
    [ -e "$f" ] || { echo "ERROR: missing input: $f" >&2; exit 1; }
done
echo ">> firstuse source: $(basename "$WOSA_IPK")"

APP=usr/palm/applications/com.palm.app.firstuse
SVC=usr/palm/services/com.palm.service.palmprofile

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo ">> 0) extract the webosaccount ipk (full app + service source)"
mkdir -p "$TMP/wosaipk" && (cd "$TMP/wosaipk" && ar x "$WOSA_IPK" && tar xzf data.tar.gz)
SRC="$TMP/wosaipk/usr/palm/webosarchive/webosaccount"
for f in "$SRC/app/FirstUse.js" "$SRC/app/source/tnc/Palm.js" "$SRC/service/services.json" \
         "$SRC/service/sources.json" "$SRC/service/palm_profile_util.js"; do
    [ -e "$f" ] || { echo "ERROR: webosaccount ipk payload missing $f" >&2; exit 1; }
done

echo ">> 1) assemble overlay rootfs"
rm -rf "$OUT"
R="$OUT/rootfs"
mkdir -p "$R/$APP" "$R/$SVC/utils" "$R/$SVC/handlers" \
         "$R/usr/lib/curl11" "$R/usr/bin" "$R/etc/ssl/certs" "$R/etc/event.d" "$R/var/gadget"

echo ">> 2) first-use app: webosaccount app over com.palm.app.firstuse"
# Every ipk appinfo.json is excluded (top-level AND per-locale resources/
# ones — they carry id com.palm.app.webosaccount; the com.palm.app.firstuse
# identity must survive or LunaSysMgr's firstuse-mode launch breaks).
# scripts/ is the author's dev tooling.
(cd "$SRC/app" && find . -type f ! -name appinfo.json ! -path "./scripts/*" -print0 \
    | while IFS= read -r -d '' f; do
        mkdir -p "$R/$APP/$(dirname "$f")"
        cp "$f" "$R/$APP/$f"
      done)
# ... but unlike stock firstuse (visible:false), the app IS the account
# manager post-OOBE: sign out and there'd be no way back in without a
# launcher icon. Ship a CE appinfo: firstuse id kept, visible, titled
# "webOS Account", on the Settings tab via the wosa-settings keyword.
# A standalone launch (no locale on the URL) just closes like a normal
# app — the 1.1.10+ closeApp only finishes OOBE for the firstuse launch.
WOSA_VER="$(basename "$WOSA_IPK" | cut -d_ -f2)"
cat > "$R/$APP/appinfo.json" <<APPINFO
{
	"id": "com.palm.app.firstuse",
	"version": "$WOSA_VER",
	"vendor": "webOS Archive",
	"type": "web",
	"main": "index.html",
	"title": "webOS Account",
	"icon": "images/icon.png",
	"visible": true,
	"uiRevision": 2,
	"keywords": ["wosa-settings"]
}
APPINFO

echo ">> 3) OOBE deltas on the app copy"
# The ipk is the STANDALONE build (assumes Wi-Fi is up, never marks first use
# done); the oobe/ deltas turn it into a real OOBE. patch -f: a mismatch with a
# new app build must fail the build loudly, not ship a half-OOBE image.
(cd "$R/usr/palm/applications" && patch -p1 -s -f) < "$HERE/oobe/FirstUse-oobe.patch"
echo "   patched $APP/FirstUse.js"
(cd "$R/usr/palm/applications" && patch -p1 -s -f) < "$HERE/oobe/Palm-oobe.patch"
echo "   patched $APP/source/tnc/Palm.js"
cp "$HERE/oobe/config.js" "$R/$APP/config.js"   # trimmed OOBE card list
grep -q "markFirstUseDone" "$R/$APP/FirstUse.js" \
    || { echo "ERROR: OOBE completion delta missing from FirstUse.js" >&2; exit 1; }

echo ">> 4) palmprofile service files from the ipk"
# The ipk ships the service files flat; the stock service layout is
# services.json + sources.json at the root, utils/ and handlers/ below —
# exactly how the ipk's own sources.json references them.
cp "$SRC/service/services.json"        "$R/$SVC/services.json"
cp "$SRC/service/sources.json"         "$R/$SVC/sources.json"
cp "$SRC/service/palm_profile_util.js" "$R/$SVC/utils/palm_profile_util.js"
for f in "$SRC/service/"*.js; do
    b="$(basename "$f")"
    [ "$b" = "palm_profile_util.js" ] && continue
    cp "$f" "$R/$SVC/handlers/$b"
done

echo ">> 5) modern curl (TLS 1.3) baked into the rootfs"
# Same layout the ipk's postinst produces on-device, minus the symlink: the
# binary's DT_NEEDED is libcurl.so.4, so ship the library under that name.
mkdir -p "$TMP/curlipk" && (cd "$TMP/curlipk" && ar x "$CURL_IPK" && tar xzf data.tar.gz)
CSRC="$TMP/curlipk/usr/palm/applications/org.webosinternals.curl-tls13/files/curl11"
cp "$CSRC/curl"            "$R/usr/lib/curl11/curl"
cp "$CSRC/libcurl.so.4.8.0" "$R/usr/lib/curl11/libcurl.so.4"
cp "$CSRC/libssl.so.1.1"   "$R/usr/lib/curl11/libssl.so.1.1"
cp "$CSRC/libcrypto.so.1.1" "$R/usr/lib/curl11/libcrypto.so.1.1"
chmod 755 "$R/usr/lib/curl11/"*
# wrapper (identical as /usr/bin/curl and /usr/bin/curl11; stock has no /usr/bin/curl)
cat > "$R/usr/bin/curl11" <<'WRAP'
#!/bin/sh
[ -n "$CURL_CA_BUNDLE" ] || CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
export CURL_CA_BUNDLE LD_LIBRARY_PATH=/usr/lib/curl11
exec /usr/lib/curl11/curl "$@"
WRAP
cp "$R/usr/bin/curl11" "$R/usr/bin/curl"
chmod 755 "$R/usr/bin/curl" "$R/usr/bin/curl11"

echo ">> 6) clock + trust: ntpdate-sync job, current CA bundle"
mkdir -p "$TMP/ntpipk" && (cd "$TMP/ntpipk" && ar x "$NTP_IPK" && tar xzf data.tar.gz)
cp "$TMP/ntpipk/usr/palm/applications/org.webosinternals.ntpdate-sync/files/ntpdate-sync" \
   "$R/etc/event.d/ntpdate-sync"
chmod 755 "$R/etc/event.d/ntpdate-sync"
cp "$CA_BUNDLE" "$R/etc/ssl/certs/ca-certificates.crt"

echo ">> 7) dev unlock out of the box"
: > "$R/var/gadget/novacom_enabled"

# The STOCK per-locale appinfo.json overrides must go: webOS merges
# resources/<locale>/appinfo.json over the base appinfo, and stock's carry
# "HP webOS"/hidden — they silently override the CE "webOS Account" visible
# appinfo (confirmed live: getAppInfo returned the stock en locale merge and
# no launch point existed). Our ipk's locale appinfos are excluded too (they
# carry the wrong id), so the base appinfo is authoritative everywhere.
cat > "$OUT/changes.json" <<'JSON'
{
  "description": "Community first-use swap: com.palm.app.firstuse replaced in place with the AddToImage/OOBE webosaccount app (OOBE deltas applied), palmprofile service -> device.php backend, + its transport prerequisites (modern curl/TLS 1.3, ntpdate-sync, current CA bundle) and novacom enabled. Generated by community-firstuse/make-overlay.sh - do not edit by hand.",
  "ce_package": "org.webosarchive.ce-files",
  "remove": [
    "/usr/palm/applications/com.palm.app.firstuse/resources/it/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/de/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/fr/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/fr/ca/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/es/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/es/es/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/en/appinfo.json",
    "/usr/palm/applications/com.palm.app.firstuse/resources/en/ca/appinfo.json"
  ]
}
JSON

echo ">> done: $OUT"
find "$OUT/rootfs" -type f | sed "s|$OUT/rootfs|  |" | sort
