#!/bin/bash
# ce-reboot-soak.sh — reboot the device N times and assert it comes back healthy.
#
#   scripts/ce-reboot-soak.sh [CYCLES] [SOAK_SECONDS] [EXPECTED_BUILDMARK]
#   (defaults: 7 cycles, 300s soak, 600070)
#
# HOST-side script. Runs over novacom; the device only ever sees `reboot` and a
# read-only check block piped to /bin/sh.
#
# Why this exists: ce-test-full.sh decides one boot. The ipkgservice upstart race
# (KNOWN-ISSUES #1) fires roughly one boot in six, so a single clean boot is not
# evidence — a build has to survive repeated boots before the fault can be called
# absent rather than merely dodged. 600067 did 5 cycles; the release gate is 7.
#
# The checks below are deliberately the same assertions ce-test-full.sh makes,
# not a looser subset: an item that is only true on the flash boot is exactly the
# kind of regression a soak is for.
#
# ROTATION. /var/log/messages rotates at ~2MB, which on this device is roughly
# every 13 minutes of normal use -- several times during a 7-cycle soak. So the
# counters are split by what survives it:
#
#   rotation-immune, read as TOTALS since the flash:
#     ipkgservice repairs + store repairs  (ce-cryptofs-seed.log never rotates)
#     rdxd reports, crash artifacts        (file counts)
#   rotation-fragile, so read PER BOOT instead of since-flash:
#     respawn events, respawn thrash, upstart crash/re-exec
#
# Per-boot means "since the last 'Kernel command line' in the current messages,
# or the whole file if that marker has already rotated away" -- in which case
# everything left in the file is this boot anyway. Counting these as totals would
# let a rotation LOWER the number and read as an improvement.
#
# Reboot proof is /proc/uptime, not a log-derived boot counter, for the same
# reason: uptime cannot rotate.

set -u

CYCLES=${1:-7}
SOAK=${2:-300}
EXPECT=${3:-600070}

BOOT_TIMEOUT=300          # device must reappear on the bus within this
LUNA_TIMEOUT=240          # ...and LunaSysMgr must be up within this after that

pass=0; fail=0
say()  { echo "$(date '+%H:%M:%S') $*"; }
P()    { echo "[PASS] $*"; pass=$((pass+1)); }
F()    { echo "[FAIL] $*"; fail=$((fail+1)); }
I()    { echo "[INFO] $*"; }

dev_present() { novacom -l 2>/dev/null | grep -q "topaz"; }

# Run a command block on the device. Never let a wedged device hang the soak.
on_dev() { timeout 60 novacom run file://bin/sh 2>/dev/null; }

wait_for_device() {   # $1 = timeout
    local t=0
    while [ $t -lt "$1" ]; do
        if dev_present && echo 'echo up' | on_dev 2>/dev/null | grep -q up; then
            return 0
        fi
        sleep 5; t=$((t+5))
    done
    return 1
}

wait_for_luna() {     # $1 = timeout -- LunaSysMgr answering, not merely a shell
    local t=0
    while [ $t -lt "$1" ]; do
        if echo 'pidof LunaSysMgr' | on_dev 2>/dev/null | grep -qE '[0-9]'; then
            return 0
        fi
        sleep 5; t=$((t+5))
    done
    return 1
}

# ---------------------------------------------------------------- device checks
# Read-only. Everything here is asserted by ce-test-full.sh too; this is the
# subset that a reboot could plausibly break, plus the cross-boot counters.
check_block() {
cat <<'DEVEOF'
echo "BUILDMARK=$(sed -n 's/^BUILDMARK=//p' /etc/palm-build-info)"
echo "UPTIME=$(cut -d' ' -f1 /proc/uptime | cut -d. -f1)"
# ipkgservice: the whole point of the soak
initctl status org.webosinternals.ipkgservice 2>&1 | grep -qE '\(start\) running' \
  && echo "IPKG=resident" || echo "IPKG=NOT-RESIDENT:$(initctl status org.webosinternals.ipkgservice 2>&1)"
echo "IPKG_JOB=$([ -s /var/palm/event.d/org.webosinternals.ipkgservice ] && echo present || echo MISSING)"
# rotation-immune totals since the flash
echo "REPAIRS=$(grep -c 'REPAIRING ipkgservice' /var/log/ce-cryptofs-seed.log 2>/dev/null)"
echo "STOREREPAIRS=$(grep -c 'REPAIRED' /var/log/ce-cryptofs-seed.log 2>/dev/null)"
# rotation-fragile events, scoped to THIS boot. If the boot marker has already
# rotated away, the whole remaining file is this boot.
BOOTLINE=$(grep -n 'Kernel command line' /var/log/messages 2>/dev/null | tail -1 | cut -d: -f1)
if [ -n "$BOOTLINE" ]; then
  tail -n +"$BOOTLINE" /var/log/messages > /tmp/.soakboot 2>/dev/null
else
  cp /var/log/messages /tmp/.soakboot 2>/dev/null
fi
echo "BOOTSLICE=$([ -n "$BOOTLINE" ] && echo "from-marker" || echo "whole-file-marker-rotated")"
echo "THRASH=$(grep 'respawning too fast' /tmp/.soakboot 2>/dev/null | grep -c ipkgservice)"
echo "RESPAWN=$(grep -c 'ipkgservice main process ended, respawning' /tmp/.soakboot 2>/dev/null)"
echo "UPSTARTCRASH=$(grep -cE 'Caught .*(segmentation fault|core dumped)|Failed to re-execute' /tmp/.soakboot 2>/dev/null)"
echo "SEGV=$(grep -c 'killed by SEGV' /tmp/.soakboot 2>/dev/null)"
rm -f /tmp/.soakboot
echo "MSGSIZE=$(wc -c < /var/log/messages 2>/dev/null)"
echo "VARFREE=$(df -k /var 2>/dev/null | awk 'END{print $(NF-2)}')"
# rdxd reports, by component
n=0; comps=""
for f in /var/log/rdxd/pending/*.tgz; do
  [ -e "$f" ] || continue
  c=$(tar xzOf "$f" overview.txt 2>/dev/null | sed -n 's/^REPORT_COMPONENT=//p')
  comps="$comps$c,"; n=$((n+1))
done
echo "RDXD=$n"; echo "RDXDCOMPS=$comps"
echo "CRASHART=$(ls /media/cryptofs/.crash* /var/log/crash* 2>/dev/null | grep -c .)"
# services that have to survive a reboot
echo "IMT=$(initctl status imtransport 2>&1 | grep -qE '\(start\) running' && echo running || echo NOT-RUNNING)"
echo "BIND=$(grep -q synergy-runtime /proc/mounts && echo live || echo MISSING)"
echo "DLMGR=$(pidof LunaDownloadMgr >/dev/null 2>&1 && echo running || echo NOT-RUNNING)"
echo "APPS=$(ls /media/cryptofs/apps/usr/palm/applications 2>/dev/null | grep -c .)"
# the 600070 additions must survive a reboot too (they are in /usr, so they should)
echo "OTAKEY=$([ -f /usr/share/ce-ota/keys/ce-ota-signing.pub ] && echo present || echo MISSING)"
echo "OTAVER=$([ -x /usr/bin/ce-ota-verify ] && echo present || echo MISSING)"
DEVEOF
}

kv() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -1; }

echo "===== webOS CE reboot soak — $CYCLES cycles x ${SOAK}s — BUILDMARK $EXPECT — $(date) ====="
echo

if ! wait_for_device 60; then
    echo "[FAIL] no device on the bus at start — is it booted and plugged in?"; exit 1
fi

# Baseline before touching anything.
base=$(check_block | on_dev)
base_repairs=$(kv "$base" REPAIRS);      base_repairs=${base_repairs:-0}
base_thrash=$(kv "$base" THRASH);        base_thrash=${base_thrash:-0}
base_rdxd=$(kv "$base" RDXD);            base_rdxd=${base_rdxd:-0}
I "baseline: uptime=$(kv "$base" UPTIME)s repairs=$base_repairs rdxd=$base_rdxd apps=$(kv "$base" APPS) msgsize=$(kv "$base" MSGSIZE) varfree=$(kv "$base" VARFREE)K"
I "note: respawn/thrash/upstart counters are read PER BOOT (messages rotates ~2MB)"
echo

for i in $(seq 1 "$CYCLES"); do
    echo "───────────────────────────── CYCLE $i / $CYCLES ─────────────────────────────"
    say "rebooting…"
    echo 'reboot' | timeout 30 novacom run file://bin/sh >/dev/null 2>&1

    # Wait for it to actually go away first, or we will "detect" the pre-reboot
    # shell and soak a device that never rebooted.
    t=0; while dev_present && [ $t -lt 90 ]; do sleep 3; t=$((t+3)); done
    say "device dropped off the bus after ${t}s"

    if ! wait_for_device $BOOT_TIMEOUT; then
        F "cycle $i: device never came back within ${BOOT_TIMEOUT}s — SOAK ABORTED"
        echo; echo "===== ABORTED at cycle $i ====="; exit 1
    fi
    say "device back on the bus"

    if ! wait_for_luna $LUNA_TIMEOUT; then
        F "cycle $i: LunaSysMgr never started within ${LUNA_TIMEOUT}s"
    else
        say "LunaSysMgr up; soaking ${SOAK}s"
    fi

    sleep "$SOAK"

    r=$(check_block | on_dev)
    if [ -z "$r" ]; then
        F "cycle $i: device stopped answering after the soak"
        continue
    fi

    bm=$(kv "$r" BUILDMARK); up=$(kv "$r" UPTIME)
    repairs=$(kv "$r" REPAIRS); thrash=$(kv "$r" THRASH); rdxd=$(kv "$r" RDXD)
    respawn=$(kv "$r" RESPAWN); ucrash=$(kv "$r" UPSTARTCRASH)
    I "cycle $i: uptime=${up}s apps=$(kv "$r" APPS) repairs=$repairs thrash=$thrash rdxd=$rdxd segv=$(kv "$r" SEGV) msgsize=$(kv "$r" MSGSIZE) varfree=$(kv "$r" VARFREE)K slice=$(kv "$r" BOOTSLICE)"

    # It really rebooted: uptime must be short, and the boot counter must rise.
    [ "${up:-99999}" -lt $((SOAK + 400)) ] \
      && P "cycle $i: really rebooted (uptime ${up}s)" \
      || F "cycle $i: uptime ${up}s — device did NOT reboot"
    [ "$bm" = "$EXPECT" ] && P "cycle $i: BUILDMARK=$bm" || F "cycle $i: BUILDMARK=$bm expected $EXPECT"

    # The assertions the soak exists for.
    [ "$(kv "$r" IPKG)" = "resident" ] \
      && P "cycle $i: ipkgservice resident" || F "cycle $i: ipkgservice $(kv "$r" IPKG)"
    [ "$(kv "$r" IPKG_JOB)" = "present" ] \
      && P "cycle $i: ipkgservice job file intact" || F "cycle $i: ipkgservice job file MISSING"
    [ "${repairs:-0}" = "$base_repairs" ] \
      && P "cycle $i: no new ipkgservice repair (total $repairs)" \
      || F "cycle $i: ipkgservice race FIRED — repairs $base_repairs -> $repairs"
    [ "${thrash:-0}" = "0" ] \
      && P "cycle $i: 0 respawn thrash this boot" || F "cycle $i: $thrash respawn thrash this boot"
    [ "${respawn:-0}" = "0" ] \
      && P "cycle $i: 0 ipkgservice respawn events this boot" || F "cycle $i: $respawn respawn event(s) this boot"
    [ "${ucrash:-0}" = "0" ] \
      && P "cycle $i: upstart never crashed/re-exec'd this boot" || F "cycle $i: upstart crashed x$ucrash"
    [ "$(kv "$r" SEGV)" = "0" ] \
      && P "cycle $i: no SEGV this boot" || F "cycle $i: $(kv "$r" SEGV) SEGV this boot"
    [ "${rdxd:-0}" = "$base_rdxd" ] \
      && P "cycle $i: no new rdxd report (total $rdxd)" \
      || F "cycle $i: rdxd reports rose $base_rdxd -> $rdxd [$(kv "$r" RDXDCOMPS)]"
    [ "$(kv "$r" CRASHART)" = "0" ] \
      && P "cycle $i: no crash artifacts" || F "cycle $i: $(kv "$r" CRASHART) crash artifact(s)"
    [ "$(kv "$r" STOREREPAIRS)" = "0" ] \
      && P "cycle $i: no store repair" || F "cycle $i: store was REPAIRED"

    # Things a reboot has broken before.
    [ "$(kv "$r" IMT)" = "running" ] && P "cycle $i: imtransport running" || F "cycle $i: imtransport $(kv "$r" IMT)"
    [ "$(kv "$r" BIND)" = "live" ] && P "cycle $i: synergy bind mount live" || F "cycle $i: synergy bind mount $(kv "$r" BIND)"
    [ "$(kv "$r" DLMGR)" = "running" ] && P "cycle $i: LunaDownloadMgr running" || F "cycle $i: LunaDownloadMgr $(kv "$r" DLMGR)"
    [ "$(kv "$r" OTAKEY)" = "present" ] && [ "$(kv "$r" OTAVER)" = "present" ] \
      && P "cycle $i: OTA anchor survived the reboot" || F "cycle $i: OTA anchor MISSING after reboot"
    echo
done

echo "═════════════════════════════════════════════════════════════════════"
echo "SOAK COMPLETE — $CYCLES cycles — $pass PASS / $fail FAIL"
fin=$(check_block | on_dev)
echo "final:    repairs=$(kv "$fin" REPAIRS) rdxd=$(kv "$fin" RDXD) apps=$(kv "$fin" APPS) varfree=$(kv "$fin" VARFREE)K"
echo "baseline: repairs=$base_repairs rdxd=$base_rdxd apps=$(kv "$base" APPS) varfree=$(kv "$base" VARFREE)K"
echo "(repairs and rdxd are totals since the flash and do not rotate; a rise at any"
echo " point above is a real fault. respawn/thrash/SEGV were asserted per boot.)"
echo "===== done $(date) ====="
[ "$fail" = "0" ]
