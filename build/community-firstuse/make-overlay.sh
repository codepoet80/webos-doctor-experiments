#!/bin/bash
# make-overlay.sh — generate build/overlays/community-firstuse/ : the CE Doctor
# overlay that swaps stock first-use for the community webOS Account flow.
#
# What lands in the overlay (see README.md here for the full story):
#   1. com.palm.app.firstuse patched IN PLACE (id unchanged): the community
#      account patches from ../webos-community-account, plus the OOBE deltas in
#      oobe/ (real Wi-Fi join, markFirstUseDone + reboot completion, no Museum
#      self-updater), plus the trimmed OOBE card list (oobe/config.js).
#   2. com.palm.service.palmprofile patched to the webOS Archive backend, plus
#      the three community assistants (updateUsername/syncDeviceName/signOut).
#   3. The account flow's hard transport prerequisites, baked into the rootfs:
#      modern curl (TLS 1.3) from the OpenSSL-legacyWebOS ipk, the ntpdate-sync
#      upstart job (TLS needs a sane clock), and a current CA bundle.
#   4. /var/gadget/novacom_enabled — every CE device is dev-unlocked out of the
#      box (community decision; deviceTool never needed again).
#
# We ship diffs, not HP source: everything HP-derived is patched at build time
# from the OEM rootfs already in work/, so this repo stays clean.
#
# Usage:  ./make-overlay.sh          (from build/community-firstuse/)
# Env:    COMMUNITY=<path to webos-community-account>   (default ../../..)
#         TLSIPKS=<path to OpenSSL-legacyWebOS/ipks>
#         CA_BUNDLE=<current Mozilla bundle>            (default: host's)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"                    # build/community-firstuse
BUILD="$(dirname "$HERE")"                               # build/
COMMUNITY="${COMMUNITY:-$BUILD/../../webos-community-account}"
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

for f in "$ROOTFS_TGZ" "$COMMUNITY/patches/FirstUse.js.patch" "$CURL_IPK" "$NTP_IPK" "$CA_BUNDLE"; do
    [ -e "$f" ] || { echo "ERROR: missing input: $f" >&2; exit 1; }
done

APP=usr/palm/applications/com.palm.app.firstuse
SVC=usr/palm/services/com.palm.service.palmprofile

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo ">> 0) extract stock first-use + palmprofile files from the OEM rootfs"
tar xzf "$ROOTFS_TGZ" -C "$TMP" \
    "./$APP/FirstUse.js" "./$APP/source/signin/Signin.js" "./$APP/source/tnc/Palm.js" \
    "./$APP/css/Firstuse.css" \
    "./$SVC/utils/palm_profile_util.js" \
    "./$SVC/handlers/LoginProfileCommandAssistant.js" \
    "./$SVC/handlers/IsEmailAvailableCommandAssistant.js" \
    "./$SVC/handlers/GetTermsAndConditionsCommandAssistant.js" \
    "./$SVC/handlers/GetTokenCommandAssistant.js" \
    "./$SVC/handlers/GetAccountInfoAggregateAssistant.js" \
    "./$SVC/services.json" "./$SVC/sources.json"

# apply <file-under-$TMP> <patch> — patch -f so a mismatch fails the build loudly.
apply() { patch -s -f "$TMP/$1" "$2"; echo "   patched $1"; }

echo ">> 1) palmprofile service -> webOS Archive backend"
apply "$SVC/utils/palm_profile_util.js"                        "$COMMUNITY/patches/palm_profile_util.js.patch"
apply "$SVC/handlers/LoginProfileCommandAssistant.js"          "$COMMUNITY/patches/LoginProfileCommandAssistant.js.patch"
apply "$SVC/handlers/IsEmailAvailableCommandAssistant.js"      "$COMMUNITY/patches/IsEmailAvailableCommandAssistant.js.patch"
apply "$SVC/handlers/GetTermsAndConditionsCommandAssistant.js" "$COMMUNITY/patches/GetTermsAndConditionsCommandAssistant.js.patch"
apply "$SVC/handlers/GetTokenCommandAssistant.js"              "$COMMUNITY/patches/GetTokenCommandAssistant.js.patch"
apply "$SVC/handlers/GetAccountInfoAggregateAssistant.js"      "$COMMUNITY/patches/GetAccountInfoAggregateAssistant.js.patch"
apply "$SVC/services.json"                                     "$COMMUNITY/patches/services.json.patch"
apply "$SVC/sources.json"                                      "$COMMUNITY/patches/sources.json.patch"

echo ">> 2) first-use app: community account flow + OOBE deltas"
apply "$APP/FirstUse.js"             "$COMMUNITY/patches/FirstUse.js.patch"
apply "$APP/source/signin/Signin.js" "$COMMUNITY/patches/Signin.js.patch"
apply "$APP/source/tnc/Palm.js"      "$COMMUNITY/patches/Palm.js.patch"
apply "$APP/css/Firstuse.css"        "$COMMUNITY/patches/Firstuse.css.patch"   # skip-button styling
apply "$APP/FirstUse.js"             "$HERE/oobe/FirstUse-oobe.patch"
apply "$APP/source/tnc/Palm.js"      "$HERE/oobe/Palm-oobe.patch"

echo ">> 3) assemble overlay rootfs"
rm -rf "$OUT"
R="$OUT/rootfs"
mkdir -p "$R/$APP/source/signin" "$R/$APP/source/tnc" "$R/$APP/css" "$R/$SVC/utils" "$R/$SVC/handlers" \
         "$R/usr/lib/curl11" "$R/usr/bin" "$R/etc/ssl/certs" "$R/etc/event.d" "$R/var/gadget"

# patched app + service files
cp "$TMP/$APP/FirstUse.js"                "$R/$APP/FirstUse.js"
cp "$TMP/$APP/source/signin/Signin.js"    "$R/$APP/source/signin/Signin.js"
cp "$TMP/$APP/source/tnc/Palm.js"         "$R/$APP/source/tnc/Palm.js"
cp "$TMP/$APP/css/Firstuse.css"           "$R/$APP/css/Firstuse.css"
cp "$HERE/oobe/config.js"                 "$R/$APP/config.js"
cp "$TMP/$SVC/utils/palm_profile_util.js" "$R/$SVC/utils/palm_profile_util.js"
for h in LoginProfileCommandAssistant IsEmailAvailableCommandAssistant \
         GetTermsAndConditionsCommandAssistant GetTokenCommandAssistant \
         GetAccountInfoAggregateAssistant; do
    cp "$TMP/$SVC/handlers/$h.js" "$R/$SVC/handlers/$h.js"
done
cp "$TMP/$SVC/services.json" "$R/$SVC/services.json"
cp "$TMP/$SVC/sources.json"  "$R/$SVC/sources.json"
# the three community-authored assistants (ours, no stock counterpart)
for a in UpdateUsernameCommandAssistant SyncDeviceNameCommandAssistant SignOutCommandAssistant; do
    cp "$COMMUNITY/service/$a.js" "$R/$SVC/handlers/$a.js"
done

echo ">> 4) modern curl (TLS 1.3) baked into the rootfs"
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

echo ">> 5) clock + trust: ntpdate-sync job, current CA bundle"
mkdir -p "$TMP/ntpipk" && (cd "$TMP/ntpipk" && ar x "$NTP_IPK" && tar xzf data.tar.gz)
cp "$TMP/ntpipk/usr/palm/applications/org.webosinternals.ntpdate-sync/files/ntpdate-sync" \
   "$R/etc/event.d/ntpdate-sync"
chmod 755 "$R/etc/event.d/ntpdate-sync"
cp "$CA_BUNDLE" "$R/etc/ssl/certs/ca-certificates.crt"

echo ">> 6) dev unlock out of the box"
: > "$R/var/gadget/novacom_enabled"

cat > "$OUT/changes.json" <<'JSON'
{
  "description": "Community first-use swap: com.palm.app.firstuse patched in place to the webOS Archive account flow (OOBE variant), palmprofile service -> device.php backend, + its transport prerequisites (modern curl/TLS 1.3, ntpdate-sync, current CA bundle) and novacom enabled. Generated by community-firstuse/make-overlay.sh - do not edit by hand.",
  "ce_package": "org.webosarchive.ce-files"
}
JSON

echo ">> done: $OUT"
find "$OUT/rootfs" -type f | sed "s|$OUT/rootfs|  |" | sort
