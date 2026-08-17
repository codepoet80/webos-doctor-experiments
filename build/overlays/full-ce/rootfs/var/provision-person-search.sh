#!/bin/sh
# provision-person-search.sh
#
# Part 1 of "search Contacts by IM service" (Telegram, WhatsApp, Facebook, ...).
#
# The Contacts search box runs one db8 full-text query (`?`) against the `searchProperty`
# multi-index on com.palm.person:1. Stock, that index does NOT tokenize `ims.type`, which is
# where the service lives ("type_telegram", "type_whatsapp", ...). This registers the patched
# kind whose search index also tokenizes `ims.type`; the kind itself ships from app-services
# (com.palm.service.contacts.linker/db/kinds/com.palm.person), which owns it.
#
# Verified on device (topaz):
#   - db8's tokenizer keeps the "type_" prefix as ONE token, so a bare "telegram" never matches
#     "type_telegram". Part 2 (app/patches.js in com.palm.app.contacts) rewrites a typed service
#     name to the stored token, so the search actually works. This kind patch alone is not enough.
#   - The contacts linker builds person.searchTerms from NAMES only and ignores a contact's own
#     searchTerms field, so seeding searchTerms on the buddy contact does NOT work (dead end).
#   - putKind is permission-denied for the default caller; it must run as the kind's owner
#     (com.palm.service.contacts.linker) via `luna-send -a`.
#   - db8 only rebuilds an index when its NAME changes, so the patched kind renames the index
#     (favorite_searchProperty_sortKey -> favorite_searchPropertySvc_sortKey) to force a reindex
#     of existing person records. No data migration: the ims.type values already exist.
#
# The patched kind ships as /etc/palm/db/kinds/com.palm.person (vendored next to this script), so
# boot provisioning keeps it durable. This script applies it now. Idempotent. A reflash reverts to
# stock -> re-run the Install in README-device-launch.md.

KIND=/etc/palm/db/kinds/com.palm.person
OWNER=com.palm.service.contacts.linker

if [ ! -f "$KIND" ]; then
    echo "provision-person-search: $KIND not found (is the patched kind installed?)" >&2
    exit 1
fi

# Refuse to register the stock (unpatched) kind.
if ! grep -q '"ims.type"' "$KIND"; then
    echo "provision-person-search: $KIND has no ims.type -- refusing to register the unpatched kind" >&2
    exit 1
fi

echo "provision-person-search: registering patched com.palm.person:1 as $OWNER (adds ims.type; renames index to force reindex)..."
luna-send -i -n 1 -a "$OWNER" -f palm://com.palm.db/putKind "$(cat "$KIND")" </dev/null
rc=$?
if [ $rc -ne 0 ]; then
    echo "provision-person-search: putKind failed (rc=$rc)" >&2
    exit $rc
fi

echo "provision-person-search: done. db8 is reindexing person records."
echo
echo "Verify the RAW token is now indexed (should return your Telegram contacts):"
echo "  luna-send -i -n 1 -a com.palm.app.contacts -f palm://com.palm.db/search \\"
echo "    '{\"query\":{\"from\":\"com.palm.person:1\",\"where\":[{\"prop\":\"searchProperty\",\"op\":\"?\",\"val\":\"type_telegram\",\"collate\":\"primary\"},{\"prop\":\"favorite\",\"op\":\"=\",\"val\":[true,false]}]}}' </dev/null"
echo
echo "Then deploy Part 2 (app/patches.js) so typing the plain service name works in the UI:"
echo "  cp <repo>/core-apps/com.palm.app.contacts/app/patches.js \\"
echo "     /media/cryptofs/apps/usr/palm/applications/com.palm.app.contacts/app/patches.js"
echo "  stop LunaSysMgr; start LunaSysMgr"
exit 0
