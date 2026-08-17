/*globals enyo */

// Desktop/dev-only mock db for the Servers tab (used only when !window.PalmSystem, exactly like the
// MockDb fallbacks in ThreadService/FavoriteService). Plain enyo.MockDb is unusable for a
// server->channel hierarchy because it (a) overwrites every record's _id with a random value -
// breaking the imchannel.serverId -> imserver._id link - and (b) ignores query.where, so a channel
// list can't filter to one server. This subclass keeps explicit _id values from the mock JSON and
// applies where/orderBy (and adds get-by-id), so the UNCHANGED production ServerList/ChannelList
// query paths behave in the browser just as they do against db8 on device.
enyo.kind({
	name: "ServersMockDb",
	kind: "enyo.MockDb",
	methodHandlers: {
		find: "query",
		get: "getByIds",
		del: "del",
		put: "put",
		merge: "merge"
	},
	// Keep the mock JSON's own _id instead of randomising it, so parent/child id links survive.
	gotData: function(inSender, inResponse, inRequest) {
		this.data = enyo.MockDb.dataSets[this.file] = inResponse.results || [];
		for (var i = 0, r; r = this.data[i]; i++) {
			if (r._id === undefined) {
				r._id = this.generateId();
			}
		}
	},
	matchWhere: function(record, where) {
		if (!where || !where.length) {
			return true;
		}
		for (var i = 0, c; c = where[i]; i++) {
			var v = record;
			var parts = String(c.prop).split(".");
			for (var p = 0; p < parts.length; p++) {
				v = (v === undefined || v === null) ? undefined : v[parts[p]];
			}
			var val = c.val;
			var ok;
			if (enyo.isArray(val)) {
				ok = (val.indexOf(v) !== -1);
			} else if (c.op === "%") {
				ok = (typeof v === "string" && v.indexOf(val) === 0);
			} else {
				ok = (v === val);
			}
			if (!ok) {
				return false;
			}
		}
		return true;
	},
	filteredSorted: function(query) {
		var out = [];
		for (var i = 0, r; r = this.data[i]; i++) {
			if (this.matchWhere(r, query.where)) {
				out.push(r);
			}
		}
		var key = query.orderBy;
		if (key) {
			out.sort(function(a, b) {
				var av = a[key], bv = b[key];
				return (av < bv) ? -1 : (av > bv) ? 1 : 0;
			});
		}
		return out;
	},
	// Page the where/orderBy-filtered set (mirrors enyo.MockDb.query's cursor/paging shape).
	query: function(inProps) {
		var query = (inProps.params && inProps.params.query) || {};
		if (query.page === undefined) {
			this.cursors = {};
		}
		var rows = this.filteredSorted(query);
		var start = this.cursors[query.page] || (query.desc ? rows.length - 1 : 0);
		var end = query.limit ? start + query.limit : -1;
		var next = end;
		if (query.desc) {
			end = start;
			start = Math.max(0, start - query.limit);
			next = start;
		}
		var results = query.limit ? rows.slice(start, end) : rows.slice(start);
		if (query.desc) {
			results.reverse();
		}
		var response = {returnValue: true, results: results};
		if (query.limit && results.length === query.limit) {
			var handle;
			do {
				handle = enyo.irand(10000) + 10000;
			} while (this.cursors[handle] !== undefined);
			this.cursors[handle] = next;
			response.next = handle;
		}
		var destroyed = false;
		var request = {
			index: 0,
			params: {query: query},
			destroy: function() { destroyed = true; },
			isWatch: enyo.nop
		};
		setTimeout(enyo.bind(this, function() {
			if (!destroyed) {
				this.doSuccess(response, request);
			}
		}), this.latency());
		return request;
	},
	// DbService.get({ids:[...]}) -> the matching records (used to resolve a channel's chatthread).
	getByIds: function(inProps) {
		var ids = (inProps.params && inProps.params.ids) || [];
		var results = [];
		for (var i = 0, r; r = this.data[i]; i++) {
			if (ids.indexOf(r._id) !== -1) {
				results.push(r);
			}
		}
		var request = {index: 0, params: inProps.params, destroy: enyo.nop, isWatch: enyo.nop};
		setTimeout(enyo.bind(this, function() {
			this.doSuccess({returnValue: true, results: results}, request);
		}), this.latency());
		return request;
	}
});
