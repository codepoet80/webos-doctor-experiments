#!/bin/sh
# webOS CE 600011 automated test-plan pass (shell-checkable items only).
# Output format: [PASS]/[FAIL]/[INFO] <test> -- detail
P() { echo "[PASS] $*"; }
F() { echo "[FAIL] $*"; }
I() { echo "[INFO] $*"; }

echo "===== webOS CE 600011 automated checks: $(date) ====="

# --- Build identity ---
BI=$(cat /etc/palm-build-info 2>/dev/null)
echo "$BI" | grep -q "BUILDMARK=600011" && P "build identity BUILDMARK=600008" || F "build identity -- $BI"
echo "$BI" | grep -q "PRODUCT_VERSION_STRING=webOS CE 3.1.0" && P "version string webOS CE 3.1.0" || F "version string -- $BI"

# --- Tripwire ---
[ -x /sbin/reboot.real ] && [ -x /sbin/telinit.real ] && P "tripwire shims installed" || F "tripwire shims missing"
if [ -f /var/log/reboot-tripwire.log ]; then
  I "tripwire log contents:"; cat /var/log/reboot-tripwire.log
else
  I "tripwire log absent (no software reboot logged yet)"
fi

# --- CE jobs ran ---
I "ce- upstart jobs:"; initctl list 2>/dev/null | grep ce-
I "ce flags:"; ls -la /var/luna/preferences/ce-* 2>/dev/null

# --- Synergy runtime ---
[ -e /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 ] && P "synergy glibc ld-linux present" || F "synergy glibc ld-linux MISSING"
[ -d /media/cryptofs/synergy-runtime ] && [ -d /media/cryptofs/synergy-purple-plugins ] && P "synergy runtime dirs present" || F "synergy runtime dirs missing"
[ -e /var/luna/preferences/ce-cryptofs-seeded ] && P "cryptofs seed flag present" || F "cryptofs seed flag missing"
N=$(ps | grep imlibpurple | grep -v grep | wc -l)
[ "$N" -ge 1 ] && P "imlibpurpletransport running ($N proc)" || F "imlibpurpletransport NOT running"
mount | grep -q "purple-2" && mount | grep -q "synergy-runtime" && P "synergy bind mounts live" || F "synergy bind mounts missing: $(mount | grep synergy)"
I "imstdout.log tail:"; tail -5 /media/cryptofs/imstdout.log 2>/dev/null

# --- Crash reports (SIGBUS watch) ---
RDX=$(ls /var/log/rdxd/pending 2>/dev/null | wc -l)
[ "$RDX" -eq 0 ] && P "no pending rdxd crash reports" || { F "rdxd crash reports pending: $RDX"; ls -la /var/log/rdxd/pending; }

# --- Status seeding ---
ST=/media/cryptofs/apps/usr/lib/ipkg/status
for p in org.webosinternals.preware org.webosinternals.govnah org.webosarchive.synergy.generic com.palm.synergy.generic; do
  grep -q "^Package: $p" $ST 2>/dev/null && I "status stanza present: $p"
done
C=$(grep -c "^Package: " $ST 2>/dev/null)
[ "$C" -ge 3 ] && P "ipkg status has $C stanzas" || F "ipkg status only $C stanzas"
I "stanza packages:"; grep "^Package: " $ST 2>/dev/null

# --- Legacy junk gone ---
[ ! -e /usr/palm/applications/com.palm.app.skype ] && [ ! -e /usr/bin/skypem ] && P "skype gone" || F "skype remnants present"
[ ! -e /usr/palm/public/accounts/com.palm.yahoo ] && P "yahoo account template gone" || F "yahoo present"
for a in com.palm.app.kindle com.palm.app.facebook com.palm.app.youtube; do
  [ -e /usr/palm/applications/$a ] && F "preload present: $a"
done
P "kindle/facebook/youtube preload check done"

# --- Stale staged ipks gone ---
STALE=0
for f in /usr/palm/ipkgs/com.palm.app.contacts* /usr/palm/ipkgs/com.palm.app.messaging* /usr/palm/ipkgs/com.palm.app.maps*; do
  [ -e "$f" ] && { F "stale staged ipk: $f"; STALE=1; }
done
[ "$STALE" -eq 0 ] && P "no stale staged core-app ipks"

# --- Contacts runs from rootfs ---
[ ! -e /media/cryptofs/apps/usr/palm/applications/com.palm.app.contacts ] && P "contacts on rootfs (no cryptofs copy)" || F "contacts cryptofs copy exists"

# --- Docviewer NOT baked ---
[ ! -e /media/cryptofs/apps/usr/palm/applications/com.palm.app.docviewer ] && I "docviewer not pre-baked (expected: first-boot install may add it)" || I "docviewer present in cryptofs"

# --- db8 ---
DB=$(luna-send -n 1 -a com.palm.app.contacts palm://com.palm.db/find '{"query":{"from":"com.palm.person:1","limit":1}}' 2>&1)
echo "$DB" | grep -q '"returnValue":true' && P "db8 com.palm.person query ok" || F "db8 query: $DB"

# --- ipkgservice ---
IPKG=$(luna-send -n 1 palm://org.webosinternals.ipkgservice/version '{}' 2>&1)
echo "$IPKG" | grep -qi version && P "ipkgservice answers: $IPKG" || F "ipkgservice: $IPKG"

# --- Launcher: designator map + lifecycle ---
grep -q "designator=favorites" /etc/palm/launcher3/app-keywords-to-designator-map.txt && grep -qi "name=games" /etc/palm/launcher3/app-keywords-to-designator-map.txt && P "games designator map baked" || F "designator map wrong: $(cat /etc/palm/launcher3/app-keywords-to-designator-map.txt)"
LL=$(grep -c LAUNCHER-LIFECYCLE /var/log/messages 2>/dev/null)
I "LAUNCHER-LIFECYCLE lines this log: $LL"
grep LAUNCHER-LIFECYCLE /var/log/messages 2>/dev/null | tail -6
if grep LAUNCHER-LIFECYCLE /var/log/messages 2>/dev/null | grep -q -E "DESTROYED|ZERO icons|REFUSING"; then F "launcher race signature PRESENT"; else P "no launcher race signature"; fi

# --- Wallpaper ---
WP=$(luna-send -n 1 palm://com.palm.systemservice/getPreferences '{"keys":["wallpaper"]}' 2>&1)
echo "$WP" | grep -q "22.png" && P "default wallpaper is 22.png" || F "wallpaper pref: $WP"
WPC=$(ls /media/internal/wallpapers/ 2>/dev/null | wc -l)
[ "$WPC" -ge 18 ] && P "wallpapers in /media/internal ($WPC files)" || F "only $WPC wallpapers in /media/internal"
RT=$(ls /media/internal/ringtones/ 2>/dev/null | grep -ci treo)
[ "$RT" -ge 1 ] && P "Treo ringtones present ($RT)" || I "no Treo ringtones found (check path)"

# --- Carrier string + keyboard defaults ---
grep -q '"sysUiCarrierString": "webOS CE"' /etc/palm/defaultPreferences.txt && P "default carrier string webOS CE" || F "carrier default missing"
grep -q 'keyboard size.*-1' /etc/palm/defaultPreferences.txt && P "small keyboard default baked" || F "keyboard default missing"

# --- Dev mode ---
grep -q "turnOnNovacomAtStart=true" /etc/palm/sysservice.conf && P "novacom-at-start baked" || F "sysservice.conf: $(cat /etc/palm/sysservice.conf)"

# --- webOS Account app ---
AI=/usr/palm/applications/com.palm.app.firstuse/appinfo.json
grep -q '"webOS Account"' $AI && grep -q '"visible": *true' $AI && P "webOS Account appinfo visible" || F "firstuse appinfo: $(cat $AI 2>/dev/null | head -20)"
LOC=$(ls /usr/palm/applications/com.palm.app.firstuse/resources/*/appinfo.json 2>/dev/null | wc -l)
[ "$LOC" -eq 0 ] && P "stock locale appinfos removed ($LOC left)" || F "$LOC stock locale appinfos still present"

# --- Byte patches ---
BT=$(dd if=/usr/bin/PmBtEngine bs=1 skip=119792 count=4 2>/dev/null | hexdump -C | head -1)
echo "$BT" | grep -q "31 00 00 ea" && P "PmBtEngine BT patch present" || F "PmBtEngine bytes: $BT"

# --- Fonts / gst ---
SZ=$(ls -la /usr/share/fonts/HeiT_nb.ttf 2>/dev/null | awk '{print $5}')
[ -n "$SZ" ] && [ "$SZ" -lt 2000000 ] && P "Thai font slim ($SZ bytes)" || F "HeiT_nb.ttf: ${SZ:-missing}"
[ -e /usr/lib/gstreamer-0.10/libgstopus.so ] && [ -e /usr/lib/gstreamer-0.10/libgstvpx.so ] && P "gst opus+vpx plugins present" || F "gst plugins missing"

# --- Trust store ---
CC=$(ls /etc/ssl/certs/trustedcerts/ 2>/dev/null | grep -c '\.pem$')
[ "$CC" -ge 150 ] && P "trust store: $CC pems" || F "trust store only $CC pems"
VC=$(ls /var/ssl/trustedcerts 2>/dev/null | wc -l)
[ "$VC" -ge 100 ] && P "/var/ssl/trustedcerts populated ($VC)" || F "/var/ssl/trustedcerts: $VC entries"

# --- ls-hubd ---
HN=$(grep -c "not listed in service files" /var/log/messages 2>/dev/null)
[ "$HN" -eq 0 ] && P "ls-hubd clean (no unlisted-service errors)" || { F "ls-hubd unlisted-service errors: $HN"; grep "not listed in service files" /var/log/messages | sort -u | head -5; }

# --- Connectivity probe patch ---
strings /usr/bin/PmNetConfigManager | grep -q "webosarchive.org" && P "connectivity probe patched to webosarchive.org" || F "PmNetConfigManager patch missing"

echo "===== done ====="

# --- 600011 first-boot fixes ---
grep -q "seed verified complete" /var/log/ce-cryptofs-seed.log 2>/dev/null && P "cryptofs seed verified (log)" || F "seed log: $(cat /var/log/ce-cryptofs-seed.log 2>&1 | tail -2)"
FC=$(ls /media/cryptofs/apps/etc/ipkg/ 2>/dev/null | wc -l)
[ "$FC" -ge 10 ] && P "Preware feeds present ($FC) on first boot" || F "only $FC feed files"
for pk in org.webosinternals.preware org.webosinternals.govnah com.palm.synergy.generic; do
  grep -q "^Package: $pk\$" /media/cryptofs/apps/usr/lib/ipkg/status && P "stanza seeded: $pk" || F "stanza MISSING: $pk"
done
UN=$(luna-send -n 1 -a com.palm.app.accounts palm://com.palm.db/find '{"query":{"from":"com.palm.account:1","where":[{"prop":"templateId","op":"=","val":"com.palm.palmprofile"}]}}' 2>&1)
echo "$UN" | grep -q '"webOS User"' && P "skip profile named webOS User" || F "profile: $UN"
grep -q "Dr. Skipped Firstuse" /usr/palm/services/com.palm.service.palmprofile/handlers/CreateProfileCommandAssistant.js 2>/dev/null && F "old placeholder still in handler" || P "old placeholder gone from handler"
[ -f /var/log/reboot-tripwire.log ] && { F "a software reboot happened:"; cat /var/log/reboot-tripwire.log; } || P "no software reboot since flash (tripwire empty)"
