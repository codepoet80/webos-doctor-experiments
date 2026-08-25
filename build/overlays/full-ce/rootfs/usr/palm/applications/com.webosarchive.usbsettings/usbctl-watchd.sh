#!/bin/sh
#
# usbctl-watchd - USB control watch daemon for com.webosarchive.usbsettings
#
# Runs as ROOT outside the webOS app jail (via upstart). The jailed app can't
# touch /sys or mount, so its JS service writes one-word commands to the control
# file and this daemon performs them, writing current state back to the status
# file. IPC lives in /media/internal (the only path shared by jail + system).
#
#   control : /media/internal/.usbctl-control   (app -> daemon, consumed once)
#   status  : /media/internal/.usbctl-status    (daemon -> app, JSON, ~1s fresh)
#   state   : /media/internal/.usbctl-state     (daemon's own persisted flags)
#
# Commands: otg-host otg-peripheral power-on power-off mount unmount refresh
#
CONTROL=/media/internal/.usbctl-control
STATUS=/media/internal/.usbctl-status
STATE=/media/internal/.usbctl-state
WATCH=/media/internal/.usbctl-watch          # app keepalive: run the device monitor while fresh
DEVICES=/media/internal/.usbctl-devices      # device monitor -> app (JSON list)
USBDEVMON=/usr/bin/usbdevmon
OTG=/sys/kernel/debug/otg/mode
# Mountpoint. Prefer /media/usb -- OUTSIDE /media/internal.
#
# WHY NOT /media/internal/usbdrive, the obvious choice (cost a full debug
# session 2026-08-24): Internalz Pro's backend, FileMgr-Service, lists ANY path
# under /media/internal with MTOOLS -- `mdir` against mtools.conf's
# `drive A: file="/dev/mapper/store-media"` -- whenever the caller asks to hide
# hidden files, which is that app's default. mtools parses the internal
# partition's FAT directly and is therefore blind to the kernel mount table: a
# stick mounted at a subdirectory of that volume lists as an EMPTY folder, while
# writes into it silently land on internal storage underneath the mountpoint.
# Mounting anywhere else takes FileMgr's plain readdir path and it all works.
# Any file manager that special-cases the media partition will have this bug.
# Don't use a name like /media/internal-usb either -- the check is a bare
# startsWith("/media/internal"), no trailing slash.
#
# The catch the old comment was right about: the root fs (and thus /media) is
# READ-ONLY on a stock device, so we can only create a mountpoint there once
# rootfs has been opened for writing (which Preware/webOS Internals users have
# done). Fall back to the in-partition path when we cannot, so a locked-down
# device still gets a working -- if Internalz-blind -- mount.
MNT=/media/usb
if [ ! -d "$MNT" ] && ! mkdir -p "$MNT" 2>/dev/null; then
    MNT=/media/internal/usbdrive
fi
LOG=/tmp/usbctl-watchd.log

log() { echo "$(date '+%H:%M:%S') usbctl: $*" >> "$LOG" 2>&1; }

# debugfs holds the OTG mode knob; mount it if it isn't already (idempotent).
ensure_debugfs() { [ -e "$OTG" ] || mount -t debugfs none /sys/kernel/debug 2>/dev/null; }

# --- persisted flags (otg + power mode; storage/present are probed live) ------
#
# PERFORMANCE, and why this file is written the way it is (measured 2026-07-29):
# every `$(...)` command substitution forks a subshell -- even around a pure
# shell function -- and busybox `cat`/`grep`/`cut`/`dirname`/`date` each fork and
# exec. The original helpers used those on the 1 Hz loop path, so this idle
# daemon forked ~20 processes EVERY SECOND: measured at 114 jiffies of CPU per
# 10 s (~11% of a core) arriving as a ~110 ms burst once a second. That is
# invisible on the desktop but it stole frames from games -- SDL Quake went from
# a steady 50 ms frame time to a 200-450 ms stall every single second, and the
# stutter tracked this daemon exactly (stopping it made the stall vanish).
# So: the idle path below uses SHELL BUILTINS ONLY -- `read` instead of `cat`,
# parameter expansion instead of `dirname`/`basename`, cached variables instead
# of re-reading the state file. Forks are allowed only on paths that run when
# something actually changed. Keep it that way.
F_otg=""; F_power="off"; F_armed=""

state_load() {
    F_otg=""; F_power="off"; F_armed=""
    while IFS='=' read -r k v; do
        case "$k" in
            otg)   F_otg="$v" ;;
            power) F_power="$v" ;;
            armed) F_armed="$v" ;;
        esac
    done < "$STATE" 2>/dev/null
    [ -n "$F_power" ] || F_power="off"
}

# Called only when a flag actually changes, so the one `mv` fork is fine.
state_save() {
    { echo "otg=$F_otg"; echo "power=$F_power"; echo "armed=$F_armed"; } \
        > "$STATE.tmp" 2>/dev/null && mv -f "$STATE.tmp" "$STATE" 2>/dev/null
}

# --- operations ---------------------------------------------------------------
otg_set() {   # $1 = host | peripheral
    ensure_debugfs
    if echo "$1" > "$OTG" 2>/dev/null; then F_otg="$1"; state_save; log "otg -> $1"
    else log "otg write failed ($1)"; fi
}

# One-shot ARM of the OTG controller (validated 2026-07-29 on a stock device):
# writing "host" ONCE flips a persistent controller state -- from then on (even
# across reboots) the port follows the ID pin: OTG cable in -> host mode +
# enumerate (~0.6s), cable out -> peripheral/gadget. A NEVER-armed device, by
# contrast, hard-hangs its USB port on OTG cable insert until reboot. So arming
# early is a safety fix, not just convenience. We arm only when the port is
# IDLE (no PC/charger gadget connection) because the write force-switches to
# host and would kill an active novacom/charge session mid-use.
# Once armed this costs a single builtin test per loop -- keep that fast path.
arm_otg_once() {
    [ "$F_armed" = "yes" ] && return
    hc=""
    read -r hc < /sys/devices/platform/usb_gadget/host_connected 2>/dev/null
    [ "$hc" = "1" ] && return                   # PC connected: try again later
    [ -d /sys/bus/usb/devices/usb1 ] && { F_armed=yes; state_save; return; }  # already host
    ensure_debugfs
    if echo host > "$OTG" 2>/dev/null; then
        F_armed=yes; state_save
        log "OTG armed (one-shot, persists across reboots)"
    fi
}

# High-power mode: the root hub budgets ~390mA and rejects a config that asks
# for more. Force config 1 on any attached-but-unconfigured device. While the
# flag is on, we re-apply it each loop so freshly-plugged devices get configured
# too. An unconfigured device reads bConfigurationValue as "0" (e.g. a DS4) OR as
# EMPTY (e.g. a DragonRise pad the kernel rejected outright) -- handle both, and
# skip anything already configured ("1"+).
# Runs every second while high-power is on, so it is entirely builtins: the glob
# is shell-expanded, values come from `read`, and the paths from parameter
# expansion. Only the rare successful write forks (via log).
power_apply() {
    for cv in /sys/bus/usb/devices/*/bConfigurationValue; do
        [ -e "$cv" ] || continue
        cur=""
        read -r cur < "$cv" 2>/dev/null
        [ "$cur" = "0" ] || [ -z "$cur" ] || continue
        d="${cv%/bConfigurationValue}"
        nc=""
        read -r nc < "$d/bNumConfigurations" 2>/dev/null
        [ -n "$nc" ] && [ "$nc" -ge 1 ] 2>/dev/null || continue
        echo 1 > "$cv" 2>/dev/null && log "high-power: configured ${d##*/}"
    done
}

# Probes set variables instead of echoing, because `dev=$(storage_probe)` would
# fork a subshell on every status refresh. S_dev / S_mounted are the outputs.
#
# Measured on device E (busybox ash, per call): this presence check is 0.4 ms,
# but ANY scan of /proc/mounts is expensive -- 26 ms via a `while read` loop
# (71 lines, and ash's `read` issues one syscall PER BYTE) or 14 ms via a `grep`
# fork. So the mount state is CACHED and re-probed only when it can actually
# have changed: when the set of block devices changes, or right after we mount
# or unmount something ourselves. With no USB drive attached -- the normal case,
# and the one that matters while a game is running -- the per-second cost is
# just the 0.4 ms presence check.
S_dev=""; S_mounted="no"; S_dev_seen="__init__"
storage_probe() {
    S_dev=""
    for d in /dev/sda1 /dev/sda /dev/sdb1 /dev/sdb; do
        [ -b "$d" ] && { S_dev="$d"; return; }
    done
}
mount_probe() {
    if grep -q " $MNT " /proc/mounts 2>/dev/null; then S_mounted="yes"; else S_mounted="no"; fi
}
# What the 1 Hz path calls: cheap presence check, mount scan only on a change.
storage_refresh() {
    storage_probe
    [ "$S_dev" = "$S_dev_seen" ] && return
    S_dev_seen="$S_dev"
    mount_probe
}
storage_mount() {
    storage_probe
    [ -n "$S_dev" ] || { log "mount: no block device"; return; }
    mount_probe
    [ "$S_mounted" = "yes" ] && { log "mount: already mounted"; return; }
    mkdir -p "$MNT" 2>>"$LOG" || { log "mount: cannot create mountpoint $MNT"; return; }
    if mount -t vfat -o utf8 "$S_dev" "$MNT" 2>>"$LOG" || mount "$S_dev" "$MNT" 2>>"$LOG"
    then log "mounted $S_dev at $MNT"; else log "mount $S_dev failed"; fi
    mount_probe                       # our own action changed it -- resync
}
storage_unmount() {
    mount_probe
    [ "$S_mounted" = "yes" ] || { log "unmount: not mounted"; return; }
    sync; umount "$MNT" 2>>"$LOG" && log "unmounted $MNT" || { umount -l "$MNT" 2>>"$LOG"; log "lazy-unmounted $MNT"; }
    mount_probe                       # our own action changed it -- resync
}

# Full OTG reset -- the "last resort" unwedge. A USB device can enumerate but
# stop delivering input (interrupt-endpoint wedge from suspend/power churn);
# cycling OTG peripheral->host tears the bus down and re-enumerates everything.
# REFUSED while storage is mounted (the cycle would yank the drive mid-use);
# the app also disables the button then, but guard here too.
reset_usb() {
    mount_probe
    [ "$S_mounted" = "yes" ] && { log "reset refused: storage mounted"; return; }
    ensure_debugfs
    log "USB reset: OTG cycle begin"
    echo peripheral > "$OTG" 2>/dev/null; F_otg=peripheral; state_save; write_status
    sleep 3
    echo host > "$OTG" 2>/dev/null;       F_otg=host;       state_save
    sleep 1
    [ "$F_power" = "on" ] && power_apply
    log "USB reset: done (host mode restored)"
}

# --- device monitor (usbdevmon) lifecycle ------------------------------------
# Runs only while the app panel is IN FRONT, gated on the WATCH keepalive the
# app refreshes each poll and DELETES as soon as it loses focus (watch-off).
#
# The monitor now reads input nodes shared -- no EVIOCGRAB. It did grab for a
# while, and that shipped: an exclusive grab starves every other reader silently,
# so a controller checked in this panel was then DEAD in any game launched
# afterwards, while still enumerating and identifying perfectly. Lifecycle gating
# alone could never make that safe (a missed teardown, an orphaned process or a
# lost focus event each leave a controller broken), so usbdevmon does not grab at
# all -- see the long comment at its scan_input(). Keeping the monitor off when
# unused also avoids needless USB churn, which is what wedges devices.
DEVMON_PID=""
devmon_running() { [ -n "$DEVMON_PID" ] && kill -0 "$DEVMON_PID" 2>/dev/null; }

# Stop a monitor we are NOT tracking. An install RESTARTS this daemon, which
# orphans any monitor that was running: the new daemon has an empty DEVMON_PID,
# so devmon_running is false and stopping would be a silent no-op while the
# orphan kept reading input nodes indefinitely.
#
# usbdevmon records its pid in tmpfs, so this costs ONE builtin `[ -f ]` on the
# idle path -- do not "improve" it into a /proc walk that forks per process.
# That is exactly the fork storm documented at the top of this file, and a first
# attempt at this function did precisely that, from inside devmon_stop, which
# runs every second.
DEVMON_PIDFILE=/tmp/usbdevmon.pid
devmon_sweep() {
    [ -f "$DEVMON_PIDFILE" ] || return 0
    _spid=""
    read -r _spid < "$DEVMON_PIDFILE" 2>/dev/null
    case "$_spid" in ''|*[!0-9]*) rm -f "$DEVMON_PIDFILE"; return 0 ;; esac
    # Confirm it really is a monitor before signalling: pids get reused, and a
    # stale file must never let us kill an unrelated process. This forks, but
    # only on the rare path where a pidfile actually exists.
    if [ -r "/proc/$_spid/cmdline" ] && \
       grep -q usbdevmon "/proc/$_spid/cmdline" 2>/dev/null
    then
        kill "$_spid" 2>/dev/null && log "devmon swept stray pid $_spid"
    fi
    rm -f "$DEVMON_PIDFILE"
    return 0
}
devmon_start() {
    devmon_running && return
    [ -x "$USBDEVMON" ] || { log "devmon: $USBDEVMON missing"; return; }
    "$USBDEVMON" >/dev/null 2>&1 &
    DEVMON_PID=$!
    log "devmon started (pid $DEVMON_PID)"
}
# Called every loop, so the common "monitor already stopped" case must not fork
# (it used to `rm -f` unconditionally, once a second, forever).
devmon_stop() {
    devmon_sweep                                # builtin test unless a pidfile exists
    if devmon_running; then
        kill "$DEVMON_PID" 2>/dev/null; log "devmon stopped"
    elif [ -z "$DEVMON_PID" ] && [ ! -e "$DEVICES" ]; then
        return                                  # already stopped and cleaned up
    fi
    DEVMON_PID=""
    rm -f "$DEVICES" 2>/dev/null
}
# App is "watching" if it refreshed the keepalive within the last few seconds.
# The `[ -f ]` test short-circuits to a builtin when no panel is open, and a
# keepalive found stale is DELETED so we stop paying for it on later loops --
# otherwise a panel opened once left this forking cat+date every second forever.
watch_fresh() {
    [ -f "$WATCH" ] || return 1
    WF_WT=""
    read -r WF_WT < "$WATCH" 2>/dev/null
    WF_NOW=$(date +%s 2>/dev/null)              # only while a panel IS open
    [ -n "$WF_WT" ] && [ -n "$WF_NOW" ] && \
        [ $((WF_NOW - WF_WT)) -ge 0 ] 2>/dev/null && \
        [ $((WF_NOW - WF_WT)) -lt 6 ] 2>/dev/null && return 0
    rm -f "$WATCH" 2>/dev/null
    return 1
}

# --- status (written only when it CHANGES, to avoid /media/internal flash wear
#     from a 1 Hz rewrite loop) ---------------------------------------------
LAST_STATUS=""
write_status() {
    # OTG state comes from the HARDWARE every time, not our saved flag: the
    # controller flips modes on its own on cable/ID-pin events (charger vs OTG
    # cable), so the flag goes stale. The mode knob is write-only (EINVAL on
    # read); the root hub /sys/bus/usb/devices/usb1 exists exactly while the
    # host controller is registered, i.e. host mode. Keep the flag synced so
    # toggles behave consistently.
    if [ -d /sys/bus/usb/devices/usb1 ]; then otg=host; else otg=peripheral; fi
    [ "$otg" = "$F_otg" ] || { F_otg="$otg"; state_save; }
    [ "$F_power" = "on" ] || F_power=off
    storage_refresh
    if [ -n "$S_dev" ];          then present=true; else present=false; fi
    if [ "$S_mounted" = "yes" ]; then mounted=true; else mounted=false; fi
    # Built by string concatenation, not printf + four command substitutions.
    s="{\"otg\":\"$otg\",\"power\":\"$F_power\",\"storage\":{\"present\":$present,\"mounted\":$mounted,\"dev\":\"$S_dev\",\"mountpoint\":\"$MNT\"}}"
    [ "$s" = "$LAST_STATUS" ] && return          # unchanged -> no write, no fork
    LAST_STATUS="$s"
    # Only reached when the state actually changed, so the mv fork is fine; keep
    # it for atomicity, since the app polls this file concurrently.
    echo "$s" > "$STATUS.tmp" 2>/dev/null && mv -f "$STATUS.tmp" "$STATUS" 2>/dev/null
}

# --- main loop ----------------------------------------------------------------
log "started (pid $$)"
rm -f "$WATCH" "$DEVICES" 2>/dev/null    # clear stale keepalive/monitor state
devmon_sweep                             # kill a monitor orphaned by a restart
ensure_debugfs
# OTG state is probed from the hardware inside write_status (the controller
# flips modes on its own on cable events, so a saved flag would lie). The power
# flag IS a persistent preference (the daemon keeps enforcing it), so leave it.
[ -f "$STATE" ] || echo "power=off" > "$STATE"
state_load
write_status

while true; do
    if [ -f "$CONTROL" ]; then
        # busybox tr has no POSIX classes -- use explicit whitespace chars.
        cmd=$(tr -d ' \t\r\n' < "$CONTROL" 2>/dev/null); rm -f "$CONTROL"
        case "$cmd" in
            otg-host)        otg_set host ;;
            otg-peripheral)  otg_set peripheral ;;
            power-on)        F_power=on;  state_save; power_apply ;;
            power-off)       F_power=off; state_save ;;
            mount)           storage_mount ;;
            unmount)         storage_unmount ;;
            reset)           reset_usb ;;
            refresh|"")      : ;;
            *)               log "unknown command: $cmd" ;;
        esac
        write_status
    fi
    # Arm the OTG controller once, at the first moment the port is idle.
    arm_otg_once
    # Keep high-power devices configured while that mode is on. (We do NOT
    # force-config while merely watching: the controller stall is the HID
    # interrupt endpoint failing to bind an input node, not a config problem --
    # config already reads 1. Forcing config fought the wrong layer; the device
    # monitor instead surfaces the detected-but-input-less device directly.)
    [ "$F_power" = "on" ] && power_apply
    # run the device monitor only while the app panel is open (keepalive fresh)
    if watch_fresh; then devmon_start; else devmon_stop; fi
    write_status
    sleep 1
done
