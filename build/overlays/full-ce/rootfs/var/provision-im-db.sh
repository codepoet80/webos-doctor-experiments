#!/bin/sh
# provision-im-db.sh
#
# Re-register ALL messaging db8 kinds + permissions from /etc/palm/db. A device REFLASH (and some
# db8 resets) reverts the on-device kind/permission registrations to whatever the stock/older
# package shipped, which drops the grants the IM transport needs -- e.g. find(com.palm.imserver)
# then fails "-3963" (permission denied) and Discord/Telegram SERVERS & CHANNELS never sync (the
# app shows no channels), and message queries lose their newer indexes (reactions, etc.).
#
# This registers each kind as its declared OWNER (putKind is owner-scoped) and (re)applies each
# permission set (putPermissions). Idempotent -- safe to re-run. luna-send in a novacom shell never
# prints the reply; check the side effect (find no longer returns -3963). Mirrors
# provision-person-search.sh / provision-im-reactions.sh; person is handled by provision-person-search.
#
# After running this, RESTART the transport so it re-enumerates servers/channels:
#   stop imtransport ; start imtransport      (NEVER kill -9 -- corrupts the PmLog sem)

DBK=/etc/palm/db/kinds
DBP=/etc/palm/db/permissions
FAIL=0

for k in "$DBK"/com.palm.im* "$DBK"/com.palm.config.libpurple "$DBK"/com.palm.contact.libpurple; do
    [ -f "$k" ] || continue
    owner=$(grep '"owner"' "$k" | head -1 | sed 's/.*: *"//; s/".*//')
    [ -n "$owner" ] || owner=com.palm.app.messaging
    echo "putKind $(basename "$k") (owner $owner)"
    luna-send -i -n 1 -a "$owner" -f palm://com.palm.db/putKind "$(cat "$k")" </dev/null || FAIL=1
done

for p in "$DBP"/com.palm.im* "$DBP"/com.palm.config.libpurple "$DBP"/com.palm.contact.libpurple; do
    [ -f "$p" ] || continue
    # putPermissions is owner-scoped: call it as the kind's declared owner, or db8 returns -3963.
    n=$(basename "$p")
    owner=$(grep '"owner"' "$DBK/$n" 2>/dev/null | head -1 | sed 's/.*: *"//; s/".*//')
    [ -n "$owner" ] || owner=com.palm.app.messaging
    echo "putPermissions $n (owner $owner)"
    luna-send -i -n 1 -a "$owner" -f palm://com.palm.db/putPermissions "{\"permissions\":$(cat "$p")}" </dev/null || FAIL=1
done

echo "provision-im-db: done (FAIL=$FAIL). Now: stop imtransport ; start imtransport"
exit $FAIL
