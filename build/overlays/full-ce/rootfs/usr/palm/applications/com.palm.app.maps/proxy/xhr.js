if (!window.PalmSystem) {
	enyo.xhr._request = enyo.xhr.request;
	enyo.xhr.request = function(inParams) {
		if (inParams.url.indexOf("mock/") != 0 && inParams.url.indexOf("http://localhost") != 0 && inParams.url.indexOf("file://") != 0) {
			inParams.url = "proxy/proxy.php?" + inParams.url;
		}
		return enyo.xhr._request(inParams);
	}
}