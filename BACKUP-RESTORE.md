# Moving a backup between devices

How to copy a woce-backup store off one device and restore it onto another —
and the one piece of stale state that will make a perfectly good backup fail
with errors that point nowhere near the cause.

## What a backup is on disk

```
/media/internal/webos-backups/
    manifests/000001-<nduId>      one JSON manifest per backup
    files/<md5>[.gz]              content-addressed file store
    receipts/<manifest>-restore-NN.json   what a restore did (written on restore)
```

`/media/internal` is the USB mass-storage volume, so a backup is ordinary files
you can drag off with a file manager. Two things follow from that:

- **`manifests/` and `files/` are one unit.** The manifest names every file by
  content hash; the store holds the bytes. Copy one without the other and the
  restore has nothing usable.
- **A file whose name ends `.gz` is stored compressed, and is named for the
  hash of its ORIGINAL contents**, not the compressed bytes. Do not rename,
  re-compress, or "tidy" anything in `files/`.

`receipts/` is a record for you; restore never reads it.

## Copying a backup off a device

**USB mass storage.** Connect, tap *USB Drive*, copy the whole
`webos-backups` folder. Eject properly; a half-finished copy is the most common
way to end up with a store that is missing files.

Backups are **not encrypted**. Anyone with the folder can read the accounts and
settings inside it. Keep it somewhere you would keep a password export.

## Restoring onto another device

1. Flash and complete first use on the target device.
2. Copy the whole `webos-backups` folder into `/media/internal/`.
3. **Clear the manifest cache** — see below. This is the step that is easy to
   miss and hard to diagnose.
4. Open Backup → *Manage Backups*, pick the backup, restore.
5. Reboot when it asks. Restored services only register at `ls-hubd` startup, so
   before that reboot an app can be present but its service silently absent.

## Clearing the manifest cache

The backup service keeps its own copy of every manifest it has seen:

```
/media/internal/.woce-backup/manifests/
```

**This cache survives a webOS Doctor flash**, because `/media/internal` is not
written by the flash. It also survives replacing the contents of
`webos-backups/`. And the service trusts it **by name**.

That matters because manifest names are not unique across backups. They are
`NNNNNN-<nduId>`, and the counter restarts when a store is cleared — so a device
that has had its backups deleted and a fresh backup taken produces
`000001-<nduId>` **again**, describing entirely different content.

If a manifest of that name is already cached, restore uses the cached one. Every
file it asks for is absent from the store actually in front of it.

**Before restoring a backup that replaced a previous one, delete the cache:**

```bash
novacom run file://bin/sh <<'EOF'
rm -f /media/internal/.woce-backup/manifests/*
EOF
```

Nothing is lost — the cache is rebuilt from the target on the next restore. Doing
this unnecessarily costs nothing, so when in doubt, clear it.

The same applies to the target itself: if you are putting a new backup onto a
device that already has one, remove the old `webos-backups` folder rather than
merging into it. Two manifests with the same name cannot coexist, and merged
`files/` directories accumulate blobs nothing references.

## Symptoms of a stale cache

All three of these come from the same cause, and none of them says so:

```
Error restoring data
palm://com.palm.db/internal/postRestore …: No such file or directory
Error: Not found in backup: files/48f64aa852cbeed3accfd0b657c2227f
com.palm.appDataBackup is not running
```

`Not found in backup` is the tell: the restore is asking for a hash the store
does not contain. Confirm it by comparing the two copies of the manifest —

```bash
novacom run file://bin/sh <<'EOF'
md5sum /media/internal/.woce-backup/manifests/* \
       /media/internal/webos-backups/manifests/*
EOF
```

Same name, different md5 means the cache is stale. Delete it and restore again.

The restore fails safely in this state — it refuses rather than writing wrong
data — so a failed attempt has not damaged the device or the backup.

## Verifying a copy is complete

Worth doing after any copy, and the only way to tell a truncated transfer from a
genuine problem. Against a copy on your computer:

```python
import json, os, hashlib, gzip
m = json.load(open("manifests/000001-XXX"))
refs = [f for s in m["services"] for f in s["files"]]
refs += [p[k] for p in m["packages"] for k in ("file", "dirFile") if p.get(k)]
store = set(os.listdir("files"))
need = {(f["origChecksum"] + ".gz") if f.get("compressed") else f["finalChecksum"]
        for f in refs}
print("referenced", len(need), "present", len(need & store),
      "missing", len(need - store))
```

`missing 0` means the copy is sound. If it is not zero, recopy — do not restore
a partial store.

## What restore will not bring back

Not faults; recorded in the receipt so you can see them:

- **Apps the system image provides** — anything CE bakes or preloads, and the
  patch packages whose effects are baked (the TLS updates, root certificates).
  They come back by reflashing, and restoring them would put an older copy on
  top of the image's own.
- **`com.palm.*` system apps.**
- **Anything the backup could not capture** — the receipt carries the reason,
  e.g. an app too large to archive in the time allowed.

Read `receipts/<manifest>-restore-01.json` after a restore: every package is
listed as `installed`, `failed`, `not-captured`, `already-present` or
`image-provided`, with a summary count.
