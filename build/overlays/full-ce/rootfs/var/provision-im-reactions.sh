#!/bin/sh
# provision-im-reactions.sh
#
# Registers the "serviceMessageId" index on com.palm.immessage.libpurple:1, required for message
# REACTIONS. ReactionHandler finds a reaction's target message by
# (serviceName == , username == , serviceMessageId == ); without a matching index every reaction
# find fails "db: no index for query" (-3965) and no reaction badge ever attaches.
#
# The index ships in etc/palm/db/kinds/com.palm.immessage.libpurple, but db8 does NOT add a NEW index
# to an already-registered kind from a file update alone -- an explicit putKind is required (db8 only
# rebuilds indexes on a putKind, or when an index name changes). putKind must run as the kind's OWNER
# (com.palm.imlibpurple) with -i -f, or it silently no-ops. Idempotent.
#
# A reflash reverts the on-device kind to the stock (index-less) version -> re-run the Install in
# README-device-launch.md (this script). luna-send in a novacom shell never prints the reply -- check
# the side effect (a reaction find no longer returns -3965), not stdout. Mirrors provision-person-search.sh.

KIND=/etc/palm/db/kinds/com.palm.immessage.libpurple
OWNER=com.palm.imlibpurple

if [ ! -f "$KIND" ]; then
    echo "provision-im-reactions: $KIND not found (is the transport package installed?)" >&2
    exit 1
fi

# Refuse to register a stale/stock kind that lacks the reaction index.
if ! grep -q '"serviceMessageId"' "$KIND"; then
    echo "provision-im-reactions: $KIND has no serviceMessageId index -- refusing to register the stale kind" >&2
    exit 1
fi

echo "provision-im-reactions: registering com.palm.immessage.libpurple:1 as $OWNER (adds the serviceMessageId index for reactions)..."
luna-send -i -n 1 -a "$OWNER" -f palm://com.palm.db/putKind "$(cat "$KIND")" </dev/null
rc=$?
if [ $rc -ne 0 ]; then
    echo "provision-im-reactions: putKind failed (rc=$rc)" >&2
    exit $rc
fi

echo "provision-im-reactions: done. Reactions can now resolve their target message."
echo
echo "Verify (should return returnValue:true, NOT error -3965 'no index for query'):"
echo "  luna-send -i -n 1 -a com.palm.imlibpurple -f palm://com.palm.db/find \\"
echo "    '{\"query\":{\"from\":\"com.palm.immessage.libpurple:1\",\"where\":[{\"prop\":\"serviceName\",\"op\":\"=\",\"val\":\"type_discord\"},{\"prop\":\"username\",\"op\":\"=\",\"val\":\"<account>\"},{\"prop\":\"serviceMessageId\",\"op\":\"=\",\"val\":\"<id>\"}],\"limit\":1}}' </dev/null"
exit 0
