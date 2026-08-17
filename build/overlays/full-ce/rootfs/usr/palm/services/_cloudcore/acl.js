/*global console */
/* acl.js - caller allow-list enforcement for public service methods.
 *
 * The mojoservice framework does NOT enforce a command's allowedAppIds on its own;
 * every public method is reachable by any bus caller. Commands that want to restrict
 * callers must gate on it explicitly. We mirror exactly what the stock
 * com.palm.service.accounts does (utils.js hasPermission / publicwhitelist.js):
 *   caller id = message.applicationID() || message.senderServiceName()
 * with the "[appid processid]" space suffix stripped (DFISH-5527), matched against
 * the template glob syntax (* ? .).
 *
 * A card app calling through PalmServiceBridge carries its appId in applicationID(),
 * which is why the account-create path can be whitelisted by appId. A raw luna-send
 * from a shell carries no appId, so gated methods correctly reject it.
 */
var Acl = {
	// BRINGUP: when true, a caller with NO identity (a raw luna-send from a root shell)
	// is allowed through so gated methods can be exercised during integration testing.
	// MUST be set false before shipping (then only whitelisted appIds pass).
	BRINGUP: false,

	callerId: function (message) {
		if (!message) { return ""; }
		var id = "";
		try { id = message.applicationID() || message.senderServiceName() || ""; }
		catch (e) { id = ""; }
		var sp = id.indexOf(" ");
		return sp === -1 ? id : id.substr(0, sp);
	},

	_match: function (glob, id) {
		var out = "^", i, c;
		for (i = 0; i < glob.length; i++) {
			c = glob.charAt(i);
			if (c === "*") { out += ".*"; }
			else if (c === "?") { out += "."; }
			else if (c === ".") { out += "\\."; }
			else { out += c; }
		}
		out += "$";
		return new RegExp(out).test(id);
	},

	// Returns true if the caller is permitted (or the method is open). On denial it
	// sets the exception on `future` and returns false, so callers do:
	//   if (!Acl.enforce(this, future)) { return; }
	enforce: function (assistant, future) {
		var allowed = assistant.allowedAppIds;
		if (!allowed || !allowed.length) { return true; }   // open method
		var caller = Acl.callerId(assistant.controller && assistant.controller.message);
		if (Acl.BRINGUP && caller === "") {
			console.log((typeof Config !== "undefined" && Config.SERVICE_NAME || "cloud") +
				": ACL BRINGUP - allowing anonymous shell caller (testing only)");
			return true;
		}
		for (var i = 0; i < allowed.length; i++) {
			if (Acl._match(allowed[i], caller)) { return true; }
		}
		console.log((typeof Config !== "undefined" && Config.SERVICE_NAME || "cloud") +
			": ACL denied caller='" + caller + "'; method allows " + allowed.join(","));
		future.setException({ returnValue: false, errorCode: "PERMISSION_DENIED",
			errorText: "caller '" + caller + "' is not permitted to call this method" });
		return false;
	}
};
