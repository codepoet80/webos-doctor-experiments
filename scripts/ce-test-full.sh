#!/bin/sh
# webOS CE full automated test pass — everything in TEST-PLAN.md that a shell can
# decide. Anything needing eyes or hands is NOT here; those stay [Human] in the plan.
#
#   sh ce-test-full.sh [EXPECTED_BUILDMARK]      (default 600029)
#
# Output: [PASS] / [FAIL] / [INFO] <section> <test> -- detail
# Run AFTER first use completes. luna-send needs </dev/null under novacom.
EXPECT=${1:-600029}
P() { echo "[PASS] $*"; }
F() { echo "[FAIL] $*"; }
I() { echo "[INFO] $*"; }
have() { [ -e "$1" ]; }

APPS=/media/cryptofs/apps/usr/palm/applications
STATUS=/media/cryptofs/apps/usr/lib/ipkg/status
LOG=/var/log/messages

echo "===== webOS CE automated pass — expecting BUILDMARK=$EXPECT — $(date) ====="

# ---------------------------------------------------------------- identity
BI=$(cat /etc/palm-build-info 2>/dev/null)
echo "$BI" | grep -q "BUILDMARK=$EXPECT" && P "id  BUILDMARK=$EXPECT" || F "id  BUILDMARK -- $BI"
echo "$BI" | grep -q "PRODUCT_VERSION_STRING=webOS CE 3.1.0" && P "id  version string webOS CE 3.1.0" || F "id  version string"
I  "id  $(grep BUILDTIME /etc/palm-build-info 2>/dev/null)"
I  "id  uptime:$(uptime | sed 's/.*up/ up/')"

# ---------------------------------------------------------------- 0b. respawn storm
n=$(grep -c "ipkgservice main process ended, respawning" $LOG 2>/dev/null)
[ "$n" = "0" ] && P "0b  no ipkgservice respawn events" || F "0b  ipkgservice respawned $n time(s)"
n=$(grep "respawning too fast" $LOG 2>/dev/null | grep -c ipkgservice)
[ "$n" = "0" ] && P "0b  no 'respawning too fast'" || F "0b  respawning too fast x$n"
# Luna Restart prerequisite: the service must be upstart-resident, not on-demand
if initctl status org.webosinternals.ipkgservice 2>/dev/null | grep -qE "\(start\) running"; then
  P "0   ipkgservice resident (Luna Restart prerequisite)"
else
  F "0   ipkgservice NOT resident -- Luna Restart may freeze: $(initctl status org.webosinternals.ipkgservice 2>&1)"
fi

# upstart crash + self re-exec. On a fatal signal upstart forks a core-dumper and
# then execl()s itself; the re-exec loses its job table, so `respawn` silently
# stops working for anything already running. Check this BEFORE concluding that a
# dead daemon "just died" -- it may have died normally and simply not come back.
n=$(grep -cE "Caught .*(segmentation fault|core dumped)|Failed to re-execute" $LOG 2>/dev/null)
[ "$n" = "0" ] && P "0b  upstart never crashed/re-exec'd" \
  || F "0b  upstart crashed + re-exec'd ($n) -- respawn is UNRELIABLE for already-running jobs from that point"

# rdxd crash reports, by component. The /var/log/crash* count in section 8 does
# NOT see these, and every crash found during 600029-600033 triage was an rdxd
# report. NB a report whose component is "upstart" is usually upstart's own
# core-dumper child working as designed, not an upstart bug.
n=0; comps=""
for f in /var/log/rdxd/pending/*.tgz; do
  [ -e "$f" ] || continue
  c=$(tar xzOf "$f" overview.txt 2>/dev/null | sed -n 's/^REPORT_COMPONENT=//p')
  comps="$comps $c"; n=$((n+1))
done
[ "$n" = "0" ] && P "0b  no rdxd crash reports" || F "0b  $n rdxd crash report(s):$(printf '%s' "$comps" | tr ' ' '\n' | sort | uniq -c | tr '\n' ' ')"

# LunaDownloadMgr: hosts com.palm.appInstallService too, so its death also breaks
# the App Catalog. 600033 shipped a one-byte patch disabling the runtime glibcurl
# multi-handle restart (a crash trigger); "Restarting glibcurl" must stay at 0.
if pidof LunaDownloadMgr >/dev/null 2>&1; then
  P "0b  LunaDownloadMgr running (pid $(pidof LunaDownloadMgr))"
else
  F "0b  LunaDownloadMgr NOT running -- downloads and App Catalog are dead (recover: start LunaDownloadMgr)"
fi
m=$(md5sum /usr/bin/LunaDownloadMgr 2>/dev/null | cut -d' ' -f1)
[ "$m" = "a618391be0d8f16f8b70fd653f85a583" ] && P "0b  LunaDownloadMgr is the patched build" \
  || F "0b  LunaDownloadMgr md5 $m -- expected patched a618391be0d8f16f8b70fd653f85a583"
n=$(grep -c "Restarting glibcurl" $LOG 2>/dev/null)
[ "$n" = "0" ] && P "0b  glibcurl restart path dead (patch holding)" || F "0b  glibcurl restarted $n time(s) -- patch NOT in effect"
n=$(grep -c "LunaDownloadMgr main process .* killed by SEGV" $LOG 2>/dev/null)
[ "$n" = "0" ] && P "0b  LunaDownloadMgr no SEGV this boot" || F "0b  LunaDownloadMgr SEGV x$n"

# ---------------------------------------------------------------- 1. first-boot seeding
have /var/luna/preferences/ce-cryptofs-seeded && P "1   cryptofs seed flag set" || F "1   cryptofs seed flag missing"
if have /var/log/ce-cryptofs-seed.log; then
  grep -q "seed verified complete" /var/log/ce-cryptofs-seed.log \
    && P "1   seed verified complete" || F "1   seed never verified"
  I "1   seed log tail: $(tail -1 /var/log/ce-cryptofs-seed.log)"
else
  F "1   no ce-cryptofs-seed.log"
fi
for f in ce-cryptofs-deshadowed ce-preloads-deshadowed ce-default-wallpaper ce-customization-media-reclaimed; do
  have /var/luna/preferences/$f && P "1   flag $f" || F "1   flag $f MISSING"
done
have /media/cryptofs/apps/etc/ipkg/arch.conf && P "1   Preware feeds seeded" || F "1   Preware feeds missing"

# ---------------------------------------------------------------- 4. core apps
for a in com.palm.app.contacts com.palm.app.messaging com.palm.app.phone com.palm.app.accounts; do
  if [ -d /usr/palm/applications/$a ]; then
    if [ -d $APPS/$a ]; then F "4   $a SHADOWED by a cryptofs copy"; else P "4   $a baked, unshadowed"; fi
  else
    F "4   $a missing from rootfs"
  fi
done
v=$(grep -o '"version"[^,]*' /usr/palm/applications/com.palm.app.accounts/appinfo.json 2>/dev/null | head -1)
I  "4   accounts app $v"
if luna-send -n 1 -a com.palm.app.contacts palm://com.palm.db/find '{"query":{"from":"com.palm.person:1"}}' </dev/null 2>/dev/null | grep -q '"returnValue":true'; then
  P "4   db8 healthy (com.palm.person:1 answers)"
else
  F "4   db8 query for com.palm.person:1 failed"
fi

# ---------------------------------------------------------------- 5. synergy runtime
have /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 && P "5   synergy glibc ld-linux present" || F "5   synergy glibc missing"
[ -d /media/cryptofs/synergy-runtime ] && [ -d /media/cryptofs/synergy-purple-plugins ] \
  && P "5   synergy runtime dirs present" || F "5   synergy runtime dirs missing"
imt=$(initctl status imtransport 2>/dev/null)
imtpid=$(echo "$imt" | sed -n 's/.*process \([0-9]*\).*/\1/p')
if echo "$imt" | grep -qE "\(start\) running" && [ -n "$imtpid" ] \
   && tr '\0' ' ' < /proc/$imtpid/cmdline 2>/dev/null | grep -q imlibpurpletransport; then
  P "5   imtransport running (pid $imtpid = imlibpurpletransport)"
else
  F "5   imtransport not running -- $imt"
fi
grep -q "synergy-runtime" /proc/mounts && P "5   synergy bind mount live" || F "5   synergy bind mount missing"
[ -d /usr/palm/applications/com.palm.app.cloud-auth ] && P "5   cloud-auth present" || F "5   cloud-auth missing"
[ ! -d $APPS/com.palm.app.docviewer ] && P "5   docviewer absent (intentional)" || F "5   docviewer present (should be excluded)"
gone=0
for a in com.palm.app.skype com.palm.app.yahoo; do [ -d /usr/palm/applications/$a ] && gone=1; done
[ $gone = 0 ] && P "5   retired accounts (skype/yahoo) gone" || F "5   a retired account app is still present"
miss=""
for g in audioresample matroska ogg opus speex vpx; do
  have /usr/lib/gstreamer-0.10/libgst$g.so || miss="$miss $g"
done
[ -z "$miss" ] && P "5   gst WebM/Opus plugins present (6/6)" || F "5   gst plugins missing:$miss"
for a in com.quickoffice.ar com.quickoffice.webos com.palm.app.photos; do
  [ -d $APPS/$a ] && P "5   $a installed to cryptofs" || F "5   $a NOT installed"
done
have $APPS/com.quickoffice.webos/source/RemoteFileService.js \
  && P "5   QuickOffice RemoteFileService.js present (synergy patch)" || F "5   QuickOffice synergy patch missing"
grep -q "Synergy-revival" /usr/palm/services/com.palm.service.photos/photos-src/base/Utils.js 2>/dev/null \
  && P "5   photos service patch marker present" || F "5   photos service patch marker missing"

# ---------------------------------------------------------------- 6. preware / status
if luna-send -n 1 palm://org.webosinternals.ipkgservice/getStatus '{}' </dev/null 2>/dev/null | grep -q returnValue; then
  P "6   ipkgservice answers"
else
  F "6   ipkgservice did not answer"
fi
for pk in org.webosinternals.preware org.webosinternals.govnah com.palm.synergy.generic; do
  c=$(grep -c "^Package: $pk\$" $STATUS 2>/dev/null)
  [ "$c" = "1" ] && P "6   status stanza $pk (1)" || F "6   status stanza $pk = $c (want 1)"
done
for pk in com.webosarchive.usbsettings org.webosarchive.btgamepad; do
  c=$(grep -c "^Package: $pk\$" $STATUS 2>/dev/null)
  [ "$c" = "0" ] && P "6   $pk correctly absent from ipkg status" || F "6   $pk present in status ($c)"
done
en=$(grep -l "" /media/cryptofs/apps/etc/ipkg/*.conf 2>/dev/null | wc -l)
dis=$(ls /media/cryptofs/apps/etc/ipkg/*.disabled 2>/dev/null | wc -l)
I  "6   feed configs: $en enabled, $dis disabled"
for f in webos-patches webos-kernels; do
  have /media/cryptofs/apps/etc/ipkg/$f.conf.disabled && P "6   $f ships disabled" \
    || { have /media/cryptofs/apps/etc/ipkg/$f.conf && F "6   $f is ENABLED (should ship disabled)" || I "6   $f feed not present"; }
done
grep -q "application/vnd.webos.ipk" /usr/palm/command-resource-handlers.json 2>/dev/null \
  && P "6   .ipk handler registered" || F "6   .ipk handler not registered"
grep -q "application/octet-stream" /usr/palm/command-resource-handlers.json 2>/dev/null \
  && P "6   octet-stream also mapped (browser-download fix)" \
  || I  "6   octet-stream NOT mapped -- known issue: browser .ipk downloads stop at the file"

# ---------------------------------------------------------------- 7. CE tweaks
grep -q "turnOnNovacomAtStart=true" /etc/palm/sysservice.conf 2>/dev/null \
  && P "7   novacom-at-start baked" || F "7   novacom-at-start missing"
grep -q '"keyboardSize":-1\|keyboardSize.*-1' /etc/palm/defaultPreferences.txt 2>/dev/null \
  && P "7   keyboard defaults small" || I "7   keyboard default: $(grep -i keyboard /etc/palm/defaultPreferences.txt 2>/dev/null | head -1)"
n=$(strings /usr/bin/LunaSysMgr 2>/dev/null | grep -c "HP webOS ")
[ "$n" = "0" ] && P "7   version-prefix patch: 0 'HP webOS ' in LunaSysMgr" || F "7   'HP webOS ' still in LunaSysMgr x$n"

# ---------------------------------------------------------------- 8. regressions
for a in com.palm.app.kindle com.palm.app.enyo-facebook com.palm.app.youtube; do
  [ ! -d $APPS/$a ] && P "8   HP preload $a absent" || F "8   HP preload $a present"
done
n=$(grep -c "is not listed in any role file" $LOG 2>/dev/null)
[ "$n" = "0" ] && P "8   ls-hubd clean (0 unlisted-service errors)" || F "8   ls-hubd unlisted-service errors: $n"
n=$(ls /var/ssl/trustedcerts 2>/dev/null | wc -l)
[ "$n" -gt 150 ] && P "8   trust store populated ($n entries)" || F "8   trust store thin ($n)"
# Real assertion, not an INFO: any crash artifact is a failure.
arts=$(ls /media/cryptofs/.crash* /var/log/crash* 2>/dev/null)
n=$(printf '%s' "$arts" | grep -c .)
[ "$n" = "0" ] && P "8   no crash artifacts" \
  || { F "8   $n crash artifact(s):"; printf '%s\n' "$arts" | sed 's/^/       /'; }

# Tripwire: /sbin/{reboot,telinit} are shimmed to log WHO asked for a reboot.
# A UI-initiated reboot is legitimate -- section 0 asks you to do one -- so a bare
# line count would fail on correct behaviour. Classify by requester instead: the
# whole point of this tripwire is catching reboots nobody asked for.
TW=/var/log/reboot-tripwire.log
if [ ! -s "$TW" ]; then
  P "8   tripwire clean (no software reboot logged)"
else
  n=$(grep -c . "$TW")
  odd=$(grep -vc "LunaSysMgr" "$TW")
  if [ "$odd" = "0" ]; then
    P "8   tripwire: $n software reboot(s), all UI-initiated (LunaSysMgr)"
  else
    F "8   tripwire: $odd of $n software reboot(s) NOT UI-initiated:"
    grep -v "LunaSysMgr" "$TW" | head -3 | sed 's/^/       /'
  fi
fi
grep -q "webosarchive" /usr/palm/applications/com.palm.app.help/appinfo.json 2>/dev/null \
  || grep -rq "webosarchive" /usr/palm/applications/com.palm.app.help/ 2>/dev/null \
  && P "8   Help app repointed at webosarchive" || I "8   Help app repoint not detected by grep"

# ---------------------------------------------------------------- 9. preload/un-baking (600025+)
for a in com.palm.app.enyo-findapps com.palm.app.maps; do
  [ ! -d /usr/palm/applications/$a ] && P "9   $a not baked" || F "9   $a STILL BAKED"
  if [ -d $APPS/$a ]; then
    v=$(awk -v a=$a '$0=="Package: "a{f=1} f&&/^Version:/{print $2; exit}' $STATUS 2>/dev/null)
    c=$(grep -c "^Package: $a\$" $STATUS 2>/dev/null)
    [ "$c" = "1" ] && P "9   $a installed in cryptofs v${v:-?} (1 stanza)" \
                   || F "9   $a has $c stanzas (2 = installed alongside, not upgraded)"
  else
    F "9   $a NOT in cryptofs -- preload install failed or was deleted"
  fi
done
# Version-agnostic on purpose: these used to hardcode 6.1.2901 / 4.0.1 and went
# stale the moment AddToImage got a newer ipk, reporting a FAIL for a healthy build.
# Assert "exactly one staged, and it isn't the stock one" instead, and print what it is.
n=$(ls /usr/palm/ipkgs/com.palm.app.enyo-findapps_*_all.ipk 2>/dev/null | wc -l)
cat_ipk=$(ls /usr/palm/ipkgs/com.palm.app.enyo-findapps_*_all.ipk 2>/dev/null | head -1)
if [ "$n" = "1" ] && [ "$(basename "${cat_ipk:-none}")" != "com.palm.app.enyo-findapps_5.0.2900_all.ipk" ]; then
  P "9   catalog ipk staged ($(basename "$cat_ipk"))"
else
  F "9   catalog ipk staging wrong: $n staged [$(ls /usr/palm/ipkgs/com.palm.app.enyo-findapps_*_all.ipk 2>/dev/null | tr '\n' ' ')]"
fi
n=$(ls /usr/palm/ipkgs/com.palm.app.maps/com.palm.app.maps_*_all.ipk 2>/dev/null | wc -l)
map_ipk=$(ls /usr/palm/ipkgs/com.palm.app.maps/com.palm.app.maps_*_all.ipk 2>/dev/null | head -1)
[ "$n" = "1" ] && P "9   maps ipk staged ($(basename "$map_ipk"))" \
  || F "9   maps ipk staging wrong: $n staged"
[ ! -f /usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk ] && P "9   stock 5.0.2900 ipk removed" || F "9   stock catalog ipk still staged"
c=$(grep -c "org.webosarchive.appcatalog" $STATUS 2>/dev/null)
[ "$c" = "0" ] && P "9   no mis-named appcatalog stanza" || F "9   mis-named org.webosarchive.appcatalog stanza present"
# corrupt filenames from >100-char tar paths
n=$(find $APPS/com.palm.app.enyo-findapps -name "*000[0-7][0-7][0-7]*" -type f 2>/dev/null | wc -l)
[ "$n" = "0" ] && P "9   catalog files extracted cleanly" \
               || F "9   $n catalog files have CORRUPT names (>100-char tar paths mis-extracted)"
if grep -qE '"com.palm.app.(contacts|messaging)"' /usr/palm/ipkgs/manifest.json 2>/dev/null; then
  F "9   manifest still advertises baked contacts/messaging"
else
  P "9   manifest: baked contacts/messaging dropped"
fi

# ---------------------------------------------------------------- 10. exhibition + l10n
Q=/usr/palm/sysmgr/uiComponents/DockModeTime
have $Q/SimpleClock.qml && grep -q SimpleClock $Q/Clocks.qml 2>/dev/null \
  && P "10  SimpleClock present and referenced" || F "10  SimpleClock missing/unreferenced"
have $Q/AnalogClock.qml && have $Q/DigitalClock.qml && P "10  stock clock faces retained" || F "10  stock clock faces missing"
ok=1
for pair in de_de:SPIELE fr_fr:JEUX it_it:GIOCHI es_es:JUEGOS fr_ca:JEUX es_us:JUEGOS en_gb:GAMES en_ca:GAMES; do
  loc=${pair%%:*}; want=${pair##*:}
  grep -q "\"GAMES\": \"$want\"" /usr/palm/sysmgr/localization/$loc/strings.json 2>/dev/null || { ok=0; F "10  GAMES l10n $loc != $want"; }
done
[ $ok = 1 ] && P "10  GAMES localized in all 8 locales"
grep -q "favorites" /etc/palm/launcher3/app-keywords-to-designator-map.txt 2>/dev/null \
  && grep -q "games" /etc/palm/launcher3/app-keywords-to-designator-map.txt 2>/dev/null \
  && P "10  launcher page rename favorites->games configured" || F "10  launcher page rename missing"
PA=$APPS/com.palm.app.photos
if [ -d $PA ]; then
  have $PA/images/icn-slidetiming.png && grep -q ec-shadow $PA/css/SlideshowMode.css 2>/dev/null \
    && grep -q onClockToggleClicked $PA/source/modes/SlideshowMode.js 2>/dev/null \
    && P "10  photos exhibition clock installed (icon+CSS+JS)" || F "10  photos exhibition clock incomplete"
else
  F "10  photos app not installed"
fi

# ---------------------------------------------------------------- 10b. default search engine
USL=/usr/palm/universalsearchmgr/resources
n=0; bad=0
for f in $USL/*/UniversalSearchList.json; do
  [ -f "$f" ] || continue
  n=$((n+1))
  grep -q '"defaultSearchEngine": "duckduckgo"' "$f" || { bad=$((bad+1)); F "10b $(basename $(dirname $f)) default is not duckduckgo"; }
  grep -q '"id": "google"' "$f" && { bad=$((bad+1)); F "10b $(basename $(dirname $f)) still lists google"; }
done
[ "$n" -gt 0 ] && [ "$bad" = "0" ] && P "10b default search engine is DuckDuckGo in all $n locale list(s)" \
  || [ "$n" -gt 0 ] || F "10b no UniversalSearchList.json found at all"
have $USL/en_us/UniversalSearchList.json && grep -q "lite.duckduckgo.com/lite" $USL/en_us/UniversalSearchList.json \
  && P "10b search URL points at the /lite/ endpoint" || F "10b search URL is not DuckDuckGo Lite"
have /usr/lib/luna/system/luna-applauncher/images/search-icon-duckduckgo.png \
  && P "10b universal-search DDG icon present" || F "10b universal-search DDG icon missing"
B=/usr/palm/applications/com.palm.app.browser
have $B/images/list-icon-duckduckgo.png && P "10b browser DDG icon present" || F "10b browser DDG icon missing"
grep -q "lite.duckduckgo.com/lite" $B/source/URLSearch.js 2>/dev/null \
  && P "10b browser fallback search is DuckDuckGo" || F "10b browser fallback still not DuckDuckGo"
grep -qi "google" $B/source/URLSearch.js 2>/dev/null \
  && F "10b browser URLSearch.js still mentions google" || P "10b no google left in browser URLSearch.js"

# ---------------------------------------------------------------- 11. space / media
STAGE=/usr/lib/luna/customization/copy_binaries/media/internal
if have /var/luna/preferences/ce-customization-media-reclaimed; then
  [ ! -d "$STAGE" ] && P "11  staged customization media reclaimed" || F "11  flagged but staging still present"
else
  F "11  staged media NOT reclaimed"
fi
have /var/log/ce-reclaim-customization-media.log && I "11  reclaim: $(tail -1 /var/log/ce-reclaim-customization-media.log)"
I  "11  rootfs: $(df -k / | awk 'END{print $(NF-2)"K free, "$(NF-1)" used"}')"
I  "11  media: wallpapers=$(ls /media/internal/wallpapers 2>/dev/null | wc -l) ringtones=$(ls /media/internal/ringtones 2>/dev/null | wc -l)"
n=$(ls /media/internal/wallpapers/*.png 2>/dev/null | wc -l)
[ "$n" = "0" ] && P "11  no orphaned .png wallpapers" || I "11  $n orphaned .png wallpapers (upgrade-from-CE artifact, accepted)"
have /media/internal/wallpapers/22.jpg && P "11  default wallpaper 22.jpg present" || F "11  default wallpaper 22.jpg MISSING"

echo "===== done ====="
