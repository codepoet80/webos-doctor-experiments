#!/bin/sh
# Capture the stock 3.0.5 cryptofs state BEFORE flashing a CE build over it.
#
# Why this matters: /media/cryptofs SURVIVES a Doctor flash. A stock-lineage
# device therefore arrives at the CE flash already carrying App Catalog 5.0.2900
# and Maps 3.0.1 -- installed, registered, with ipkg status stanzas. CE 600025+
# ships both as PRELOAD ipks instead of baking them, so first boot must UPGRADE
# those existing copies via plain `ipkg install` (LunaSysMgr passes no -force-*
# flags: upgrade on higher version, refuse downgrade). That path has never been
# tested, and once the CE flash happens this baseline is unrecoverable.
#
# Run after stock OOBE completes, before flashing CE.
I() { echo "[BASE] $*"; }

echo "===== stock baseline: $(date) ====="
I "build: $(grep -E 'PRODUCT_VERSION_STRING|BUILDMARK' /etc/palm-build-info | tr '\n' ' ')"
I "rootfs: $(df -k / | awk 'END{print $(NF-2)"K free, "$(NF-1)" used"}')"
I "/ device: $(awk '$2=="/"&&$1!="rootfs"{print $1}' /proc/mounts)"

C=/media/cryptofs/apps/usr/palm/applications
S=/media/cryptofs/apps/usr/lib/ipkg/status

echo "--- the two apps CE will replace ---"
for app in com.palm.app.enyo-findapps com.palm.app.maps; do
  if [ -d "$C/$app" ]; then
    ver=$(awk -v a="$app" '$0=="Package: "a{f=1} f&&/^Version:/{print $2; exit}' $S 2>/dev/null)
    sz=$(du -sm "$C/$app" 2>/dev/null | cut -f1)
    I "$app: PRESENT in cryptofs, version=${ver:-<no stanza>}, ${sz}MB"
  else
    I "$app: absent from cryptofs (unexpected on a stock-lineage device)"
  fi
done

echo "--- ipkg status stanzas (what an upgrade must supersede) ---"
for app in com.palm.app.enyo-findapps com.palm.app.maps; do
  echo "  [$app]"
  awk -v a="$app" '$0=="Package: "a{f=1} f{print "    "$0} f&&/^$/{exit}' $S 2>/dev/null \
    || echo "    <none>"
done

echo "--- staged preloads on the stock rootfs (CE replaces these) ---"
ls -la /usr/palm/ipkgs/ 2>/dev/null | grep -iE "findapps|maps" | awk '{print "  "$5" "$9}'
[ -d /usr/palm/ipkgs/com.palm.app.maps ] && ls -la /usr/palm/ipkgs/com.palm.app.maps/ | awk 'NR>3{print "  maps/ "$5" "$9}'

echo "--- media that survives the flash (wallpaper accumulation baseline) ---"
I "wallpapers: $(ls /media/internal/wallpapers 2>/dev/null | wc -l) files, $(du -sm /media/internal/wallpapers 2>/dev/null | cut -f1)MB"
I "ringtones:  $(ls /media/internal/ringtones 2>/dev/null | wc -l) files, $(du -sm /media/internal/ringtones 2>/dev/null | cut -f1)MB"
I "wallpaper names: $(ls /media/internal/wallpapers 2>/dev/null | tr '\n' ' ')"

echo "--- staged customization media on stock (what the reclaim job will free) ---"
du -sm /usr/lib/luna/customization/copy_binaries/media/internal/* 2>/dev/null | sed 's/^/  /'

echo "===== end baseline ====="
