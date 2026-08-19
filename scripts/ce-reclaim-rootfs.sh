#!/bin/sh
# ce-reclaim-rootfs.sh — reclaim ~30MB on the webOS CE 3.1 root filesystem.
#
# CE 3.1 (BUILDMARK 600024) ships / at 95% full. ~30MB of that is an unreachable
# duplicate of the App Catalog magazine content: main/source/magazine/PivotMagazine-WOSA/
# holds two ~14MB copies of the same magazine that no code path can reach (the copy the
# app actually loads is main/source/magazine/defaultEdition/, which this does NOT touch).
#
# Permanent fix lands in the App Catalog project; this is the interim field workaround.
#
# Run on the device:  sh ce-reclaim-rootfs.sh
# or paste the body into a novaterm session as root.
#
# Reversible only by re-flashing, so it takes a backup first unless you pass --no-backup.

set -e

APP=/usr/palm/applications/com.palm.app.enyo-findapps
DEAD="$APP/main/source/magazine/PivotMagazine-WOSA"
KEEP="$APP/main/source/magazine/defaultEdition"
BACKUP=/media/internal/ce-reclaim-backup-PivotMagazine-WOSA.tar

do_backup=1
[ "$1" = "--no-backup" ] && do_backup=0

echo "== before =="
df -h / | tail -1

# ---- guard 1: is there anything to do? (idempotent) -------------------------
if [ ! -d "$DEAD" ]; then
    echo "Nothing to do: $DEAD is already gone."
    exit 0
fi

# ---- guard 2: the copy the app DOES use must be present --------------------
if [ ! -f "$KEEP/en/manifest.json" ]; then
    echo "ABORT: expected magazine content missing at $KEEP -- not a stock CE 3.1 layout."
    exit 1
fi

# ---- guard 3: re-prove nothing references the tree on THIS device -----------
# (checked live rather than trusted, in case a future build starts using it)
refs=$(grep -rl "PivotMagazine-WOSA" "$APP" --exclude-dir=PivotMagazine-WOSA 2>/dev/null || true)
if [ -n "$refs" ]; then
    echo "ABORT: something references PivotMagazine-WOSA on this device:"
    echo "$refs"
    exit 1
fi
echo "Verified: no file outside the tree references it."

# ---- do it -----------------------------------------------------------------
mount -o remount,rw /

if [ "$do_backup" = "1" ] && [ ! -f "$BACKUP" ]; then
    echo "Backing up to $BACKUP (delete it once you are happy) ..."
    # /media/internal has ~27GB free; 30MB is noise there
    tar cf "$BACKUP" -C "$APP/main/source/magazine" PivotMagazine-WOSA || {
        echo "ABORT: backup failed, nothing deleted."
        mount -o remount,ro / || true
        exit 1
    }
fi

rm -rf "$DEAD"
sync

# Restore the read-only mount. If something holds / open for write this can fail;
# it is not fatal (the next reboot remounts ro anyway) but say so plainly.
mount -o remount,ro / || echo "WARNING: could not remount / read-only; reboot to restore it."

echo "== after =="
df -h / | tail -1
echo "Done. Reclaimed roughly 30MB."
echo "The App Catalog magazine still works: it loads $KEEP, which was not touched."
