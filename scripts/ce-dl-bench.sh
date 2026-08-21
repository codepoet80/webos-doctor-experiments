#!/bin/sh
# Measure whether lifting LunaDownloadMgr's I/O class + CPU cgroup actually
# speeds up downloads. Both levers are settable on the RUNNING process, so this
# needs no reflash and no reboot -- run it on a booted 3.1 device.
#
#   sh ce-dl-bench.sh show
#   sh ce-dl-bench.sh fast | stock          (flip the live process, then use it normally)
#   sh ce-dl-bench.sh bench <url> [secs]    (single timed run, current settings)
#   sh ce-dl-bench.sh matrix <url> [secs]   (stock/fast x idle/loaded, the real answer)
#
# Copy to the device and run over novaterm as root:
#   novacom put file:///tmp/ce-dl-bench.sh < scripts/ce-dl-bench.sh
#   novacom run file://bin/sh -- /tmp/ce-dl-bench.sh matrix <url>
#
# Pick a URL big enough to outlast the WHOLE matrix (>= 500MB): matrix takes all
# four windows inside ONE continuous download, so the same TCP/TLS connection is
# used throughout and per-connection variance drops out. Serve your own file:
#   fallocate -l 500M /var/www/html/bigfile.bin
# Run it twice, once https:// and once http:// if you can -- the CPU-share
# hypothesis predicts a much bigger gap on TLS, which is what CE downloads use.
#
# WARNING: cancelDownload on an in-flight transfer SIGSEGVs LunaDownloadMgr on
# 3.1 (reproduced deterministically, 2/2). Upstart respawns it, which SILENTLY
# RESETS the priority -- which is why every window here re-checks that the pid
# did not change and prints INVALID if it did. The single cancel is deliberately
# left to the very end, after all data is collected.
#
# luna-send needs </dev/null under novacom.

IF=${IF:-eth0}
WARM=${WARM:-4}
LOADPIDS=/tmp/ce-dl-load.pids
IOLOAD=/media/internal/.ce-io-load

die() { echo "ERROR: $*" >&2; exit 1; }

dlpid() { pidof LunaDownloadMgr | cut -d' ' -f1; }

# Every thread, not just the main one. cgroup v1 "tasks" and ionice -p both take
# a TID, and the transfer runs on a worker thread -- re-nicing only the main pid
# would measure nothing and look like the change had no effect.
tids() { ls /proc/"$1"/task 2>/dev/null; }

rx() { sed -n "s/.*$IF://p" /proc/net/dev | awk '{print $1}'; }

show() {
  p=$(dlpid); [ -n "$p" ] || die "LunaDownloadMgr not running"
  echo "  pid      : $p ($(tids "$p" | wc -l) threads)"
  echo "  io class : $(ionice -p "$p" 2>&1)"
  echo "  cgroup   : $(sed -n 's/^[0-9]*:cpuacct,cpu://p' /proc/"$p"/cgroup)"
  echo "  shares   : REST/BG=$(cat /dev/cpuacct/REST/BG/cpu.shares 2>/dev/null)" \
       "REST/DAEMONS=$(cat /dev/cpuacct/REST/DAEMONS/cpu.shares 2>/dev/null)" \
       "UX=$(cat /dev/cpuacct/UX/cpu.shares 2>/dev/null)" \
       "REST=$(cat /dev/cpuacct/REST/cpu.shares 2>/dev/null)"
}

# $1 = ionice args, $2 = cgroup dir under /dev/cpuacct
setprio() {
  p=$(dlpid); [ -n "$p" ] || die "LunaDownloadMgr not running"
  for t in $(tids "$p"); do
    ionice $1 -p "$t" >/dev/null 2>&1
    [ -f "/dev/cpuacct/$2/tasks" ] && echo "$t" > "/dev/cpuacct/$2/tasks" 2>/dev/null
  done
  return 0
}

fast()  { setprio "-c 2 -n 4" REST/DAEMONS; }
stock() { setprio "-c 3"      REST/BG; }

# Reproducible contention. cpu.shares only bind when something else wants the
# CPU, and ionice idle class only bites when something else wants the disk --
# an idle-device test will show nothing from either change.
loadon() {
  rm -f "$LOADPIDS"
  i=1
  while [ $i -le 2 ]; do
    ( while : ; do : ; done ) &
    lp=$!                          # $$ in a subshell is the PARENT's pid -- use $!
    echo "$lp" > /dev/cpuacct/UX/APP/tasks 2>/dev/null
    echo "$lp" >> "$LOADPIDS"
    i=$((i + 1))
  done
  ( while : ; do dd if=/dev/zero of="$IOLOAD" bs=64k count=160 2>/dev/null; sync; done ) &
  echo $! >> "$LOADPIDS"
  sleep 2
}

loadoff() {
  [ -f "$LOADPIDS" ] && for pid in $(cat "$LOADPIDS"); do kill -9 "$pid" 2>/dev/null; done
  rm -f "$LOADPIDS" "$IOLOAD"
  sleep 1
}

cancel_all() {
  # by ticket is the reliable one; cancelAllDownloads matches on owner, which a
  # luna-send-initiated download doesn't set -- keep it only as a net.
  [ -n "$TICKET" ] && luna-send -n 1 palm://com.palm.downloadmanager/cancelDownload \
    "{\"ticket\":$TICKET}" </dev/null >/dev/null 2>&1
  luna-send -n 1 palm://com.palm.downloadmanager/cancelAllDownloads \
    '{"owner":"ce-dl-bench"}' </dev/null >/dev/null 2>&1
  TICKET=
}

pending_count() {
  luna-send -n 1 palm://com.palm.downloadmanager/listPending '{}' </dev/null 2>&1 \
    | sed -n 's/.*"count":*\([0-9]*\).*/\1/p'
}

start_download() {
  rm -f /media/internal/downloads/* 2>/dev/null
  out=$(luna-send -n 1 palm://com.palm.downloadmanager/download \
        "{\"target\":\"$1\"}" </dev/null 2>&1)
  TICKET=$(echo "$out" | sed -n 's/.*"ticket": *\([0-9]*\).*/\1/p')
  [ -n "$TICKET" ] || { echo "  FAILED to start -- $out"; return 1; }
  sleep "$WARM"                      # let DNS + TCP + TLS handshake settle
  return 0
}

# $1 = label, $2 = seconds. Measures a window of the ALREADY-RUNNING download.
# A pid change means upstart respawned it at stock priority mid-window, so the
# sample says nothing -- report that rather than a misleading number.
window() {
  label=$1; secs=$2
  p0=$(dlpid)
  r0=$(rx); t0=$(date +%s)
  sleep "$secs"
  r1=$(rx); t1=$(date +%s)
  p1=$(dlpid)

  if [ "$p0" != "$p1" ]; then
    printf '  %-22s INVALID -- LunaDownloadMgr respawned (%s -> %s)\n' "$label" "$p0" "$p1"
    return 1
  fi
  if [ "$(pending_count)" = "0" ]; then
    printf '  %-22s INVALID -- transfer ended mid-window\n' "$label"
    return 1
  fi
  echo "$r0 $r1 $t0 $t1" | awk -v l="$label" \
    '{d=$2-$1; s=$4-$3; if(s<=0||d<=0){printf "  %-22s no data\n",l} \
      else {printf "  %-22s %8.1f KB/s\n",l,d/s/1024}}'
}

URL=$2
SECS=${3:-20}

case "$1" in
  show)  show ;;
  fast)  fast;  echo "lifted:"; show ;;
  stock) stock; echo "restored to stock:"; show ;;

  bench)
    [ -n "$URL" ] || die "need a URL"
    show; echo
    start_download "$URL" || exit 1
    window "current" "$SECS"
    cancel_all ;;

  matrix)
    [ -n "$URL" ] || die "need a URL"
    trap 'loadoff; stock; exit 130' INT TERM
    echo "===== LunaDownloadMgr priority A/B -- $SECS s windows, $(date) ====="
    echo "url: $URL"; echo; echo "before:"; show; echo

    # ONE continuous download for all four windows: same TCP/TLS connection
    # throughout, so per-connection variance drops out, and no cancel is needed
    # until the very end.
    stock
    start_download "$URL" || { echo "===== aborted ====="; exit 1; }
    echo "  (one continuous download, ticket $TICKET)"
    # Discard a full window first: TCP slow-start would otherwise depress
    # whichever condition happens to run first and fake a difference.
    window "warm-up (discarded)" "$SECS" >/dev/null 2>&1
    # ORDER=reverse runs lifted before stock. If a condition wins in BOTH
    # orders the effect is real; if the FIRST one always loses, it is ordering.
    if [ "${ORDER:-}" = reverse ]; then
      fast;   window "lifted / idle"   "$SECS"
      stock;  window "stock  / idle"   "$SECS"
      echo "  -- adding CPU + disk contention --"
      loadon
      fast;   window "lifted / loaded" "$SECS"
      stock;  window "stock  / loaded" "$SECS"
    else
      stock;  window "stock  / idle"   "$SECS"
      fast;   window "lifted / idle"   "$SECS"
      echo "  -- adding CPU + disk contention --"
      loadon
      stock;  window "stock  / loaded" "$SECS"
      fast;   window "lifted / loaded" "$SECS"
    fi
    loadoff
    cancel_all

    stock
    echo; echo "restored to stock:"; show
    echo "===== done ====="
    echo "Note: RX is measured on $IF, so background traffic counts. Run on an"
    echo "otherwise-quiet device, and repeat -- wifi alone varies run to run." ;;

  *)
    sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
