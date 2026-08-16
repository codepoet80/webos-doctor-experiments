/**
 * UrlManager is the component in charge of generating the proper URL
 * for the different topics in the Help application.
 * 
 * Copyright 2011 HP, Inc.  All rights reserved.
 */
enyo.kind({
	name: "help.UrlManager",
	kind: "Component",
	published: {
		/**
		 * Help URL
		 */
		helpUrl: "http://help.webosarchive.org"
	},
	/**
	 * Returns the Base URL given including locale, device and carrier
	 */
	getBaseUrl: function() {
		var baseUrl = this.helpUrl;
		if (this.locale) {
			baseUrl += "/" + this.locale;
			
			// Remove device code from URL
			/* 
			if (this.carrier && this.device) {
				baseUrl += "/" + this.carrier + "/" + this.device;
			}
			*/	
			
			if (this.carrier) {
				baseUrl += "/" + this.carrier;
			}
			
		}
		return baseUrl;
	},
	/**
	 * Log when the Help URL is changed
	 */
	helpUrlChanged: function() {
		this.log("Help URL changed to " + this.helpUrl);
	},
	//@ public
	/**
	 * Return the Tips URL
	 */
	getTipsUrl: function() {
		return this.getBaseUrl() + "/index.json";
	},
	/**
	 * Return the Clips URL
	 */
	getClipsUrl: function() {
		return this.getBaseUrl() + "/clips/index.json";
	},
	/**
	 * Returns the Featured URL
	 */
	getFeaturedUrl: function() {
		return this.getBaseUrl() + "/index_features.json";
	},
	/**
	 * Returns the Search URL with the added search terms
	 */
	getSearchUrl: function(terms) {
		// TODO: escapeHTML maybe?? Could be fun to hack the search code...
		terms = terms.trim().replace(/\s+/g, '+');
		return this.helpUrl + "/search/results.cgi?q=" + terms;
	},
	/**
	 * Set the device model
	 */
	setModel: function(model) {
		this.model = model;
	},
	/**
	 * Set the device ID
	 */
	setDeviceId: function(device) {
		this.device = device;
	},
	/**
	 * Set the locale
	 */
	setLocale: function(locale) {
		this.locale = locale; 
	},
	/**
	 * Set the carrier
	 */
	setCarrier: function(carrier) {
		this.carrier = carrier;
	},
	/**
	 * Returns the Chat Base URL given including locale, device and carrier
	 */
	getChatBaseUrl: function() {
		var baseUrl = this.helpUrl + "/HelpSiteViewer/chat";
		if (this.locale) {
			baseUrl += "/" + this.locale;
			
			// Remove device code from URL
			/*
			if (this.carrier && this.device) {
				baseUrl += "/" + this.carrier + "/" + this.device;
			}
			*/
			
			if (this.carrier) {
				baseUrl += "/" + this.carrier;
			}			
		}
		return baseUrl;
	},
	/**
	 * Returns the URL of the JSON info file for Chat 
	 */
	getChatInfoUrl: function(application) {
		return this.getChatBaseUrl() + "/chat.do" + (application ? "?application=" + application : "");
	},
	/**
	 * Returns the URL of the JSON file for Hours of Operation 
	 */
	getChatHoursUrl: function(application) {
		return this.getChatBaseUrl() + "/chatHoursOfOperation.do";
	}
});

