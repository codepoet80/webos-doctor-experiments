enyo.kind({
	name: "PlacesSearchService",
	kind: enyo.WebService,
	url: "http://maps.webosarchive.org/json.aspx",
	params: {
		Version: "2.0",
		Market: enyo.g11n.currentLocale().toISOString().replace("_","-"),
		c: enyo.g11n.currentLocale().toISOString().replace("_","-"),
		Options: "EnableHighlighting",
		Sources: "PhoneBook",
		"Phonebook.Count": 20
	},
	makeRequestProps: function(inProps) {
		inProps.params = enyo.mixin(this.params, inProps.params);
		return this.inherited(arguments);
	}
});