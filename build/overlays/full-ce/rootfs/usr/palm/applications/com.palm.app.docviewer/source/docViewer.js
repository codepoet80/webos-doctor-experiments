/*global enyo, window, document, XMLHttpRequest */
/*
 * DocViewer - a format-dispatching document viewer for the Synergy revival, built to
 * cover the file types the frozen native QuickOffice `arxservice` engine cannot.
 *
 * WHY THIS EXISTS
 *   arxservice is a closed, feature-frozen 2012 ARM/NPAPI binary (Office ~2010 OOXML +
 *   an old PDF viewer). It can't be extended and there is no newer build for webOS. But
 *   the QuickOffice/file-picker reroute we already built lands the file BYTES on local
 *   disk first - so anything that can read a local file can render it. This app is that
 *   "anything": leave arx to the legacy formats it handles, route everything else here.
 *
 * THE HARD CONSTRAINT (shapes the whole design)
 *   A webOS 3.0.5 web-app CARD runs in the STOCK system webview - WebKit ~2009. That is
 *   perfectly fine for plain text and <img>, but it CANNOT run modern PDF.js / mammoth /
 *   SheetJS. So this card does two different things depending on format:
 *
 *     txt / md / log / csv / json / xml ...  -> render IN-CARD (XHR the file:// text)   [zero-dep]
 *     png / jpg / jpeg / gif / bmp / svg     -> render IN-CARD (<img src=file://...>)   [zero-dep]
 *     pdf / docx / xlsx / pptx ...           -> HAND OFF to Atlas (WPE, modern JS)      [needs vendored lib]
 *     (anything)                             -> "Open raw in Atlas" fallback           [zero-dep]
 *
 *   Atlas ("org.webosports.app.atlas", simple mode) is modern WPE WebKit - the same
 *   engine the OAuth logins use. We launch it at the render/ harness (see render/harness.html),
 *   which loads the vendored library and the document. This is VIEW-ONLY: no editing, no
 *   on-device format conversion (LibreOffice-headless is far too heavy for a TouchPad).
 *
 * HOW IT IS INVOKED
 *   Another app (the file-picker / QuickOffice reroute) launches us with params:
 *     { target: "/media/internal/.qo/123-report.pdf", name: "report.pdf", mime: "application/pdf" }
 *   For standalone testing there is also a manual path box, so the PoC is exercisable
 *   without wiring a caller. See source/launcher.js for the exact launch call a caller makes.
 */
enyo.kind({
	name: "DocViewer",
	kind: enyo.VFlexBox,
	className: "dv-body",

	// Instance fields set at open() time: target (path), docName, docMime. NOTE we do NOT
	// use "name"/"mime" as fields - "name" is Enyo's own component-identity property.
	TYPES: {
		txt: "text", md: "text", markdown: "text", log: "text", csv: "text",
		json: "text", xml: "text", ini: "text", conf: "text", yaml: "text", yml: "text",
		png: "image", jpg: "image", jpeg: "image", gif: "image", bmp: "image", svg: "image", webp: "image",
		pdf: "pdf", docx: "docx", xlsx: "xlsx", pptx: "pptx"
	},

	components: [
		{ kind: "Toolbar", className: "enyo-toolbar-light", pack: "center", components: [
			{ name: "header", kind: "Control", content: "Document Viewer" }
		]},
		{ name: "openbar", kind: "Toolbar", className: "dv-openbar", components: [
			{ name: "pathInput", kind: "Input", flex: 1, spellcheck: false,
				hint: "/media/internal/file-to-open" },
			{ kind: "Button", caption: "Open", onclick: "openTapped" }
		]},
		{ name: "status", className: "dv-status", content: "" },
		{ kind: "Scroller", flex: 1, components: [
			{ name: "stage", className: "dv-stage" }
		]},
		{ name: "actionbar", kind: "Toolbar", className: "dv-actionbar", showing: false, components: [
			{ name: "atlasBtn", kind: "Button", caption: "Open raw in Atlas", onclick: "openRawInAtlas" }
		]},

		{ name: "appLaunch", kind: "PalmService", service: "palm://com.palm.applicationManager/",
			method: "launch", onFailure: "atlasLaunchFailed" }
	],

	create: function () {
		this.inherited(arguments);
		this.params = enyo.windowParams || {};
		this.appBase = this._deriveAppBase();
		this.log("docviewer: create appBase=" + this.appBase +
			" params=" + enyo.json.stringify(this.params));
		// If launched with a target, open it immediately; otherwise wait for manual input.
		var t = this.params.target || this.params.file || this.params.path || "";
		if (t) {
			this.$.pathInput.setValue(t);
			this.open(t, this.params.name, this.params.mime);
		} else {
			this.setStatus("Enter a local file path and tap Open, or launch me with a target.");
		}
	},

	setStatus: function (t) { this.$.status.setContent(t || ""); },

	// --- open / dispatch -----------------------------------------------------
	openTapped: function () {
		var p = (this.$.pathInput.getValue() || "").replace(/^\s+|\s+$/g, "");
		if (p) { this.open(p); }
	},

	open: function (path, name, mime) {
		this.clearStage();
		this.target = path;
		this.docName = name || path.split("/").pop();
		this.docMime = mime || "";
		this.$.actionbar.setShowing(true);   // "Open raw in Atlas" is always available as a fallback
		var ext = this._ext(this.docName || path);
		var kind = this.TYPES[ext] || "unknown";
		this.log("docviewer: open " + path + " ext=" + ext + " -> " + kind);
		this.setStatus("Opening " + this.docName + " …");
		switch (kind) {
		case "text":  this.renderText(path); break;
		case "image": this.renderImage(path); break;
		case "pdf":   this.handOff(path, "pdf",  "PDF.js");   break;
		case "docx":  this.handOff(path, "docx", "mammoth");  break;
		case "xlsx":  this.handOff(path, "xlsx", "SheetJS");  break;
		case "pptx":  this.handOff(path, "pptx", "PPTX");     break;
		default:      this.renderUnsupported(ext); break;
		}
	},

	// --- IN-CARD zero-dependency renderers (work in the stock 2009 webview) ---
	// Plain text: XHR the file:// URL and drop it into a <pre>. webOS web apps are granted
	// local file access, so a file:// XHR from the card succeeds.
	renderText: function (path) {
		var self = this;
		var xhr = new XMLHttpRequest();
		try {
			xhr.open("GET", this._fileUrl(path), true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) { return; }
				// file:// success is status 0 with a body, or 200.
				if ((xhr.status === 0 || xhr.status === 200) && xhr.responseText != null) {
					var pre = self.$.stage.createComponent(
						{ kind: "Control", nodeTag: "pre", className: "dv-text" }, { owner: self });
					pre.setContent(self._escape(xhr.responseText));
					self.$.stage.render();
					self.setStatus("");
				} else {
					self.renderError("Could not read text file (status " + xhr.status + ").");
				}
			};
			xhr.send(null);
		} catch (e) {
			this.renderError("Text read failed: " + (e && e.message ? e.message : e));
		}
	},

	// Image: a plain <img> pointed at the file:// URL. No decoding lib needed.
	renderImage: function (path) {
		var img = this.$.stage.createComponent(
			{ kind: "Image", className: "dv-image", src: this._fileUrl(path) }, { owner: this });
		if (img && img.hasNode && img.hasNode()) { /* rendered below */ }
		this.$.stage.render();
		this.setStatus("");
	},

	// --- HAND-OFF to Atlas for modern-JS formats -----------------------------
	// Launch Atlas simple-mode at the render harness, passing the file path + renderer
	// via query string. The harness (modern WPE JS) loads the vendored lib and renders.
	handOff: function (path, type, libName) {
		var url = this.appBase + "render/harness.html" +
			"?type=" + encodeURIComponent(type) +
			"&file=" + encodeURIComponent(path) +
			"&name=" + encodeURIComponent(this.docName || "");
		this.log("docviewer: hand off " + type + " to Atlas: " + url);
		this.renderNotice(
			this.docName + " is a " + type.toUpperCase() + " file. Rendering needs " + libName +
			", which runs in Atlas (a modern browser engine) - the app card's own engine is too old. " +
			"Opening it in Atlas now…");
		this._launchAtlas(url);
	},

	openRawInAtlas: function () {
		if (!this.target) { return; }
		// Zero-dep proof of the open-local-file pipe: hand the bare file:// straight to
		// Atlas, whose modern engine natively renders images, text, html and often PDF.
		this._launchAtlas(this._fileUrl(this.target));
	},

	_launchAtlas: function (url) {
		this.$.appLaunch.call({
			id: "org.webosports.app.atlas",
			params: { mode: "simple", url: url }
		});
	},

	atlasLaunchFailed: function (inSender, inResponse) {
		this.renderError("Could not launch Atlas: " +
			(inResponse && inResponse.errorText ? inResponse.errorText : "unknown"));
	},

	// --- placeholder / error surfaces ----------------------------------------
	renderUnsupported: function (ext) {
		this.renderNotice("No renderer for ." + (ext || "?") +
			" files yet. You can still try \"Open raw in Atlas\" below.");
		this.setStatus("");
	},

	renderNotice: function (msg) {
		var c = this.$.stage.createComponent(
			{ kind: "Control", className: "dv-notice" }, { owner: this });
		c.setContent(this._escape(msg));
		this.$.stage.render();
	},

	renderError: function (msg) {
		this.log("docviewer: ERROR " + msg);
		var c = this.$.stage.createComponent(
			{ kind: "Control", className: "dv-error" }, { owner: this });
		c.setContent(this._escape(msg));
		this.$.stage.render();
		this.setStatus("");
	},

	clearStage: function () {
		var kids = this.$.stage.getComponents();
		for (var i = 0; i < kids.length; i++) { kids[i].destroy(); }
		this.$.stage.render();
	},

	// --- helpers -------------------------------------------------------------
	_ext: function (nameOrPath) {
		var m = (nameOrPath || "").toLowerCase().match(/\.([a-z0-9]+)\s*$/);
		return m ? m[1] : "";
	},

	// Build a file:// URL from an absolute local path (already absolute on device).
	_fileUrl: function (path) {
		if (/^file:\/\//.test(path)) { return path; }
		return "file://" + (path.charAt(0) === "/" ? path : "/" + path);
	},

	// Derive the app's own install dir (…/com.palm.app.docviewer/) from where index.html
	// loaded, so the harness URL is correct wherever the app is installed. Falls back to
	// the conventional cryptofs apps path.
	_deriveAppBase: function () {
		try {
			var href = document.location.href;             // file://…/com.palm.app.docviewer/index.html
			var i = href.lastIndexOf("/");
			if (i > 0) { return href.substring(0, i + 1); }
		} catch (e) { /* fall through */ }
		return "file:///media/cryptofs/apps/usr/palm/applications/com.palm.app.docviewer/";
	},

	_escape: function (s) {
		return String(s == null ? "" : s)
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
});
