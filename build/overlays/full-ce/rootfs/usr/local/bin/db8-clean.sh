#!/bin/sh
# db8-clean.sh — reliable, ONLINE db8 (MojoDB) maintenance for webOS 3.0.5 (TouchPad).
#
# Fixes "Application database full" and reclaims fragmented space using db8's OWN maintenance
# methods — the same ones mojodb runs periodically on its own. It NEVER stops mojodb, never
# dumps/wipes/reloads the store, and never risks a factory reset. (Contrast: a manual
# dump -> rm /var/db/main -> load over live novacom wedged the device into an "Erase Apps &
# Data" reset on 2026-07-24 — do NOT do that. See memory db8-defrag-danger.)
#
# How db8 space works here:
#   * Backend = BerkeleyDB (objects.db / indexes.db + log.* WAL in /var/db/main).
#   * Deleting a record does NOT free space immediately: db8 keeps a tombstone (_del:true) for
#     `purgeWindow` days (7 on topaz) so deletions can sync. Those tombstones — visible as
#     "delmisses" in `stats` — are the fragmentation/quota bloat.
#   * `purge`  physically removes tombstones older than a window -> reclaims quota + space. SAFE.
#   * `compact` asks the storage engine to defrag in place. SAFE (no-op on some builds; harmless).
#   * `del {query,purge:true}` HARD-deletes matching LIVE records with no tombstone — used only by
#     the explicit, destructive `prune-messages` mode below.
#
# All calls go through luna-send impersonating com.palm.configurator (the maintenance caller).
#
# Usage (run on device):  sh /media/internal/db8-clean.sh [command]
#   measure                 (default) read-only: quota usage, db size, tombstone/fragmentation count
#   clean                   SAFE reclaim: purge tombstones >7d, then compact. Non-destructive.
#   deep                    purge ALL tombstones (window 0) + compact. Safe on a personal device.
#   prune-messages <days>   DESTRUCTIVE: hard-delete IM messages older than <days> (chat history!),
#                           then deep-clean. Use when LIVE message volume — not tombstones — is the
#                           bloat. Asks nothing; the <days> arg is the safety gate.
set -u
LS="luna-send -a com.palm.configurator -i -n 1 -f"
DB="palm://com.palm.db"

emit() { printf '%s\n' "$*"; }
call() { $LS "$DB/$1" "$2" </dev/null 2>&1; }

measure() {
  emit "== quota usage (bytes used / quota) =="
  call quotaStats '{}' | grep -E '"\*"|"com\.palm|size|used' | sed 's/^/  /'
  emit "== on-disk store size =="
  du -sh /var/db/main /var/db 2>/dev/null | sed 's/^/  /'
  emit "== purge status (last purged revision; -1 = never) =="
  call purgeStatus '{}' | grep -E '"rev"' | sed 's/^/  /'
  emit "== fragmentation: total tombstones (delmisses) across all indexes =="
  # sum every "delmisses": N from stats; a large number => run 'clean'
  call stats '{}' | awk -F: '/delmisses/ { gsub(/[ ,]/,"",$2); s+=$2 } END { printf "  total delmisses = %d\n", s }'
  emit "== top kinds by object bytes (biggest = prune candidate) =="
  # pair each top-level kind name with its objects.size; number-only so sort -rn is correct
  call stats '{}' | awk '
    /^        "[A-Za-z].*:[0-9]+": \{/ { k=$1; gsub(/["{ ]/,"",k); sub(/:$/,"",k) }
    /"objects"/ { ino=1 }
    ino && /"size"/ { s=$0; gsub(/[^0-9]/,"",s); if (s!="") printf "%10d  %s\n", s, k; ino=0 }
  ' 2>/dev/null | sort -rn | head -12 | sed 's/^/  /'
}

do_purge() { # $1 = window days
  emit "-- purge (window=$1 days): removing tombstones older than the window --"
  call purge "{\"window\":$1}" | grep -E '"count"|returnValue|error' | sed 's/^/  /'
}
do_compact() {
  emit "-- compact: defragment the storage engine in place --"
  call compact '{}' | grep -E 'returnValue|error' | sed 's/^/  /'
}

prune_messages() { # $1 = days
  days="$1"
  now=$(date +%s 2>/dev/null || echo 0)
  [ "$now" = 0 ] && { emit "!! date +%s unavailable; cannot compute cutoff"; return 1; }
  cutoff_ms=$(( (now - days*86400) * 1000 ))
  emit "== prune-messages: HARD-deleting IM records older than $days days (cutoff ${cutoff_ms}ms) =="
  for kind in com.palm.immessage.libpurple:1 com.palm.imcommand.libpurple:1; do
    emit "-- $kind --"
    n=1; total=0
    # delete in batches of 500 (purge:true = no tombstone) until a batch removes nothing
    while [ "$n" -gt 0 ]; do
      out=$(call del "{\"query\":{\"from\":\"$kind\",\"where\":[{\"prop\":\"timestamp\",\"op\":\"<\",\"val\":$cutoff_ms}],\"limit\":500},\"purge\":true}")
      n=$(printf '%s' "$out" | sed -n 's/.*"count":[ ]*\([0-9]*\).*/\1/p'); n=${n:-0}
      case "$out" in *error*|*Error*) emit "  $out"; break;; esac
      total=$((total + n)); emit "  deleted batch: $n (running $total)"
      [ "$n" -lt 500 ] && break
    done
  done
}

cmd="${1:-measure}"
case "$cmd" in
  measure) measure ;;
  clean)   emit "### BEFORE ###"; measure; echo; do_purge 7; do_compact; echo; emit "### AFTER ###"; measure ;;
  deep)    emit "### BEFORE ###"; measure; echo; do_purge 0; do_compact; echo; emit "### AFTER ###"; measure ;;
  prune-messages)
           [ $# -ge 2 ] || { emit "usage: db8-clean.sh prune-messages <days>"; exit 2; }
           emit "### BEFORE ###"; measure; echo
           prune_messages "$2"; echo
           do_purge 0; do_compact; echo
           emit "### AFTER ###"; measure ;;
  *) emit "usage: db8-clean.sh [measure|clean|deep|prune-messages <days>]"; exit 2 ;;
esac
