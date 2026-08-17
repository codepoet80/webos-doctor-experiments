/*global enyo */
/*
 * DocViewerLauncher - copy/paste helper showing EXACTLY how another app (the file-picker,
 * or the QuickOffice reroute's "open" action) hands a already-downloaded local file to the
 * Document Viewer. This is not used by the viewer itself; it lives here as the reference
 * caller so the integration is unambiguous.
 *
 * USAGE (from any Enyo app):
 *   this.createComponent({ name: "dvLauncher", kind: "DocViewerLauncher" });
 *   ...
 *   this.$.dvLauncher.open("/media/internal/.qo/123-report.pdf",
 *                          { name: "report.pdf", mime: "application/pdf" });
 *
 * The viewer decides per-format whether to render in-card or hand off to Atlas; the caller
 * does not need to know which. The caller's ONLY job is to pass the LOCAL path (the bytes
 * must already be on disk - that is what our downloadFile / QuickOffice reroute guarantees).
 */
enyo.kind({
	name: "DocViewerLauncher",
	kind: enyo.Component,

	components: [
		{ name: "svc", kind: "PalmService", service: "palm://com.palm.applicationManager/",
			method: "launch", onFailure: "launchFailed" }
	],

	// path: absolute local path to the file. opts: { name, mime } (both optional).
	open: function (path, opts) {
		opts = opts || {};
		this.log("DocViewerLauncher: open " + path);
		this.$.svc.call({
			id: "com.palm.app.docviewer",
			params: {
				target: path,
				name:   opts.name || (path ? path.split("/").pop() : ""),
				mime:   opts.mime || ""
			}
		});
	},

	launchFailed: function (inSender, inResponse) {
		this.log("DocViewerLauncher: launch failed " +
			(inResponse && inResponse.errorText ? inResponse.errorText : "unknown"));
	}
});
