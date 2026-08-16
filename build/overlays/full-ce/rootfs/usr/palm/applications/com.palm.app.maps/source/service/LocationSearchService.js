enyo.kind({
	name: "LocationSearchService",
	kind: enyo.WebService,
	url: "http://maps.webosarchive.org/REST/v1/Locations",
	params: {
		output: "json",
		c: enyo.g11n.currentLocale().toISOString().replace("_","-")
	},
	makeRequestProps: function(inProps) {
		var params = inProps.params;
		if (params.latitude && params.longitude) {
			inProps.url = this.url + "/" + params.latitude + "," + params.longitude;
			delete params.latitude;
			delete params.longitude;
		}
		inProps.params = enyo.mixin(this.params, inProps.params);
		return this.inherited(arguments);
	},
	responseSuccess: function(inRequest) {
		var response = inRequest.response;
		if (response &&
			response.resourceSets &&
			response.resourceSets.length > 0 &&
			response.resourceSets[0].resources &&
			response.resourceSets[0].resources.length > 0) {
			response = response.resourceSets[0].resources[0];
		}
		this.doSuccess(response, inRequest);
	},
});