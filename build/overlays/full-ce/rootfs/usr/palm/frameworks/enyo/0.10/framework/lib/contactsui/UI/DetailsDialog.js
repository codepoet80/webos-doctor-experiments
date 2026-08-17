/*jslint white: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, 
regexp: true, newcap: true, immed: true, nomen: false, maxerr: 500 */
/*global ContactsLib, document, enyo, console, $L, crb */

enyo.kind({
	name		: "com.palm.library.contactsui.detailsDialog",
	kind		: "ModalDialog",
	layoutKind	: "VFlexLayout",
	scrim		: true,
	//height		: "500px",
	caption		: crb.$L("Contact Detail"),
	
	events:
	{	
		onEdit: "",
		onAddToExisting: "",
		onAddToNew: "",
		onDoneCreatingPersonObjects: "",
		onCancelClicked: "" //This is the "Done" button event
	},

	published:
	{
		autoClose: true
	},

	components: [
		// webOS: 520px is only a safe default. DetailsInDialog.adaptHeight() overrides this height to
		// (header + min(rows, MAX)) after render and re-centers the dialog, so it sizes to its content.
		{name: "contentBox", kind: "Control", height: "520px", layoutKind: "VFlexLayout", className: "", components: [
			{name: "detailsWrapper", flex: 1, kind: "VFlexBox", components: []}
		]},
		{kind: "Control", layoutKind: "VFlexLayout", components: [
			// webOS: "Edit Contact" lives here in the dialog chrome (its own full-width row above the
			// Close button, same size as Close) instead of inline at the bottom of the scrollable rows.
			{kind: "Button", name: "contactsDialogEdit", caption: crb.$L("Edit Contact"), onclick: "editClicked", showing: false},
			{kind: "Control", layoutKind: "HFlexLayout", components: [
				{kind: "Button", name: "contactsDialogBack", flex: 1, caption: crb.$L("Back"), onclick: "backClicked", showing: false}, //multi-scene button
				{kind: "Button", name: "contactsDialogCancel", flex: 1, caption: crb.$L("Close"), onclick: "cancelClicked"}
			]}
		]}
	], //VFlexBox container for personListWidget did not work out; add components dynamically to component list in create() only!

	componentsReady: function () {
		this.inherited(arguments);
		this.$.detailsWrapper.createComponent({kind: "com.palm.library.contactsui.detailsInDialog", 
			name: "detailsInDialog", 
			//width: "320px", 
			//height: "100%",
			flex: 1,
			showButtonsHideBar: true,
			owner: this,
			onEdit: this.edit,
			onAddToExisting: this.addToExisting,
			onAddToNew: this.addToNew,
			onDoneCreatingPersonObjects: "doDoneCreatingPersonObjects"
		});
	},
	
	addToExisting: function() {
		this.doAddToExisting();
		if (this.autoClose) {
			this.$.close();
		}	
	},
	edit: function () {
		this.doEdit();
		if (this.autoClose) {
			this.$.close();
		}	
	},
	addToNew: function () {
		this.doAddToNew();
		if (this.autoClose) {
			this.$.close();
		}
	},
	open: function () {
		this.inherited(arguments);
	},	
	cancelClicked: function () {
		this.doCancelClicked();
	},
	editClicked: function () {
		// webOS: chrome "Edit Contact" triggers the same edit as the (now hidden) inline button.
		if (this.$.detailsInDialog && this.$.detailsInDialog.editPerson) {
			this.$.detailsInDialog.editPerson();
		}
	},
	setPersonId: function (personId) {
		this.$.detailsInDialog.setPersonId(personId);
		if (this.$.contactsDialogEdit) { this.$.contactsDialogEdit.show(); }   // existing contact -> offer Edit
	},
	setContact: function (rawContact) {
		this.$.detailsInDialog.setContact(rawContact);
		if (this.$.contactsDialogEdit) { this.$.contactsDialogEdit.hide(); }   // raw address -> no Edit
	}
	
});		
