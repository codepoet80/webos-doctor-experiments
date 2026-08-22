/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * Service wrappers. BackupService now points at our own service instead of
 * palm://com.palm.service.backup — the method names are deliberately the same,
 * which is what lets the rest of this UI stay a close port of the stock app.
 */

enyo.kind({
    name: "BackupService",
    kind: "PalmService",
    service: "palm://com.palm.app.backup.service/"
});

enyo.kind({
    name: "ApplicationManagerService",
    kind: "PalmService",
    service: "palm://com.palm.applicationManager/"
});

enyo.kind({
    name: "SystemPrefsService",
    kind: "PalmService",
    service: "palm://com.palm.systemservice/"
});
