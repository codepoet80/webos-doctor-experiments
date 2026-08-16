enyo.kind({
	name: "Contacts",
	kind: enyo.VFlexBox,
	events: {
		onSelect: ""
	},
	components: [
		{name: "input", kind: "RoundedInput", changeOnKeypress: true, keypressChangeDelay: 300, onchange: "showContacts"},
		{name: "list", kind: "AddressingList", flex: 1, addressTypes: ["addresses"], onSelect: "listSelect"},
	],
	showContacts: function() {
		this.$.input.forceFocus();
		this.$.list.search();
	},
	listSelect: function(inSender, inSelected) {
		var a = inSelected.address;
		this.doSelect(a.formattedValue);
	}
});