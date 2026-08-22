/* Copyright 2025 woce-backup contributors.
 *
 * "What to back up" — the user file categories.
 *
 * Accounts, contacts, calendar, settings and application data always travel:
 * they come from the registered-service protocol and are what backup means.
 * The toggles here are for media, which is optional because a local backup is
 * written to the same volume the media lives on. Each row carries a live file
 * count and size so the cost of switching one on is visible before it is paid.
 *
 * The category set is fixed and known (it mirrors prefs.DEFAULT_USER_DATA in
 * the service), so the rows are declared statically rather than built at
 * runtime. Dynamically created components are owned by whoever is named as
 * `owner`, not by the container they sit in, so `container.destroyComponents()`
 * does not remove them and rebuilding the list trips Enyo's
 * unique-name-under-owner rule. Static rows sidestep that completely.
 */

enyo.kind({
    name: "UserDataPage",
    kind: enyo.VFlexBox,

    // Must match the ids the service reports; a category it does not return is
    // hidden rather than shown empty.
    CATEGORY_IDS: ["photos", "videos", "music", "documents", "downloads", "ringtones"],

    events: {
        onDone: ""
    },

    components: [
        { kind: "Scroller", flex: 1, components: [
            { kind: "Control", className: "box-center", components: [

                { kind: "RowGroup", caption: $L("Always included"), components: [
                    { kind: "Item", layoutKind: "HFlexLayout", tapHighlight: false, components: [
                        { flex: 1, className: "enyo-label",
                          content: $L("Accounts, contacts and calendar") }
                    ]},
                    { kind: "Item", layoutKind: "HFlexLayout", tapHighlight: false, components: [
                        { flex: 1, className: "enyo-label",
                          content: $L("System settings and preferences") }
                    ]},
                    { kind: "Item", layoutKind: "HFlexLayout", tapHighlight: false, components: [
                        { flex: 1, className: "enyo-label",
                          content: $L("Application data") }
                    ]}
                ]},

                { className: "backup-info-text box",
                  content: $L("Media files are not included by default. Backups are written to this device, so including them uses storage twice over.") },

                { name: "categoryGroup", kind: "RowGroup", caption: $L("Media"), components: [
                    { name: "row_photos", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_photos", className: "enyo-label" },
                            { name: "detail_photos", className: "category-detail" }
                        ]},
                        { name: "toggle_photos", kind: "ToggleButton",
                          categoryId: "photos", onChange: "categoryToggled" }
                    ]},
                    { name: "row_videos", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_videos", className: "enyo-label" },
                            { name: "detail_videos", className: "category-detail" }
                        ]},
                        { name: "toggle_videos", kind: "ToggleButton",
                          categoryId: "videos", onChange: "categoryToggled" }
                    ]},
                    { name: "row_music", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_music", className: "enyo-label" },
                            { name: "detail_music", className: "category-detail" }
                        ]},
                        { name: "toggle_music", kind: "ToggleButton",
                          categoryId: "music", onChange: "categoryToggled" }
                    ]},
                    { name: "row_documents", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_documents", className: "enyo-label" },
                            { name: "detail_documents", className: "category-detail" }
                        ]},
                        { name: "toggle_documents", kind: "ToggleButton",
                          categoryId: "documents", onChange: "categoryToggled" }
                    ]},
                    { name: "row_downloads", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_downloads", className: "enyo-label" },
                            { name: "detail_downloads", className: "category-detail" }
                        ]},
                        { name: "toggle_downloads", kind: "ToggleButton",
                          categoryId: "downloads", onChange: "categoryToggled" }
                    ]},
                    { name: "row_ringtones", kind: "Item", layoutKind: "HFlexLayout",
                      align: "center", tapHighlight: false, showing: false, components: [
                        { kind: "Control", flex: 1, components: [
                            { name: "catLabel_ringtones", className: "enyo-label" },
                            { name: "detail_ringtones", className: "category-detail" }
                        ]},
                        { name: "toggle_ringtones", kind: "ToggleButton",
                          categoryId: "ringtones", onChange: "categoryToggled" }
                    ]}
                ]},

                { name: "emptyLabel", className: "list-empty", showing: false,
                  content: $L("No media found on this device.") },

                { name: "totalLabel", className: "list-location", content: "" }
            ]}
        ]},

        { kind: "Toolbar", className: "enyo-toolbar-light", components: [
            { kind: "Button", className: "enyo-button-affirmative", style: "width: 300px;",
              caption: $L("Done"), onclick: "doneClick" }
        ]},

        { name: "errorDialog", className: "box-center", kind: "enyo.DialogPrompt",
          title: $L("Couldn't save"),
          message: $L("That change could not be saved and has been undone."),
          acceptButtonCaption: $L("OK"),
          cancelButtonCaption: ""
        },

        { kind: "BackupService", components: [
            { name: "saveCategories", method: "setUserDataCategories",
              onSuccess: "saveSuccess", onFailure: "saveFailure" }
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        this.categories = [];
        // Guard against reacting to setState() while populating the rows.
        this.populating = false;
        // id -> the value before the in-flight write, so a failure can put the
        // toggle back. Keyed rather than a single field because the requests
        // share one component and the user can flip several rows before the
        // first reply lands.
        this.pendingToggles = {};
    },

    doneClick: function () {
        this.doDone();
    },

    setCategories: function (categories) {
        this.categories = categories || [];
        this.populate();
    },

    refresh: function () {
        this.populate();
    },

    populate: function () {
        this.populating = true;

        var byId = {};
        this.categories.forEach(function (category) {
            byId[category.id] = category;
        });

        var anyShown = false;
        var self = this;

        this.CATEGORY_IDS.forEach(function (id) {
            var category = byId[id];
            var row = self.$["row_" + id];
            if (!row) {
                return;
            }
            if (!category) {
                row.setShowing(false);
                return;
            }

            // A category with no files cannot be usefully enabled, so it is
            // hidden rather than shown as a dead toggle.
            var visible = category.count > 0;
            row.setShowing(visible);
            if (!visible) {
                return;
            }
            anyShown = true;

            self.$["catLabel_" + id].setContent(category.label);
            self.$["detail_" + id].setContent(enyo.macroize(
                $L("{$count} files · {$size}"),
                { count: category.count, size: self.formatSize(category.bytes) }));
            self.$["toggle_" + id].setState(category.enabled === true);
        });

        this.$.categoryGroup.setShowing(anyShown);
        this.$.emptyLabel.setShowing(!anyShown);
        this.updateTotal();

        this.populating = false;
    },

    categoryToggled: function (inSender) {
        if (this.populating) {
            return;
        }

        var id = inSender.categoryId;
        var enabled = inSender.getState();

        this.categories.forEach(function (category) {
            if (category.id === id) {
                // Remember what it was *before* this change. populate() reads
                // this.categories, so without capturing it here the "revert"
                // on failure just re-applied the value that failed to save.
                if (this.pendingToggles[id] === undefined) {
                    this.pendingToggles[id] = category.enabled === true;
                }
                category.enabled = enabled;
            }
        }, this);

        var categories = {};
        categories[id] = enabled;
        this.$.saveCategories.call({ categories: categories });
        this.updateTotal();
    },

    updateTotal: function () {
        var selectedBytes = 0;
        this.categories.forEach(function (category) {
            if (category.enabled) {
                selectedBytes += category.bytes;
            }
        });
        this.$.totalLabel.setContent(selectedBytes === 0
            ? ""
            : enyo.macroize($L("Media selected: {$size}"), { size: this.formatSize(selectedBytes) }));
    },

    formatSize: function (bytes) {
        if (!bytes) {
            return "0 B";
        }
        var units = ["B", "KB", "MB", "GB"];
        var value = bytes;
        var unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value = value / 1024;
            unit++;
        }
        return (unit === 0 ? value : value.toFixed(unit > 1 ? 1 : 0)) + " " + units[unit];
    },

    saveSuccess: function () {
        this.pendingToggles = {};
    },

    saveFailure: function (inSender, inResponse) {
        this.error("Unable to save category selection", inResponse);

        // Put every unacknowledged change back before repainting. Reverting all
        // of them rather than just the one that failed is deliberate: the
        // requests share one component, so a failure cannot be attributed to a
        // particular row with any confidence, and leaving a toggle showing a
        // selection the service never stored is the outcome worth avoiding.
        var pending = this.pendingToggles;
        this.categories.forEach(function (category) {
            if (pending[category.id] !== undefined) {
                category.enabled = pending[category.id];
            }
        });
        this.pendingToggles = {};

        this.populate();
        if (inResponse && inResponse.errorText) {
            this.$.errorDialog.setMessage(inResponse.errorText);
        }
        this.$.errorDialog.open();
    }
});
