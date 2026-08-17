/*global window, document, XMLHttpRequest */
/*
 * harness.js - the modern-JS render logic that runs INSIDE Atlas (WPE WebKit), not in the
 * app card. Reads ?type=&file=&name= from the URL, XHRs the local file as an ArrayBuffer,
 * dynamically loads the one vendored library it needs from ../lib, and renders. Everything
 * degrades to a readable message if a library or the file is missing. VIEW-ONLY.
 *
 * Vendored libraries expected (drop them in per lib/README.md):
 *   pdf   -> ../lib/pdfjs/pdf.js         (+ pdf.worker.js)   window.pdfjsLib
 *   docx  -> ../lib/mammoth/mammoth.browser.min.js           window.mammoth
 *   xlsx  -> ../lib/sheetjs/xlsx.full.min.js                 window.XLSX
 */
(function () {
	"use strict";

	var stage  = document.getElementById("stage");
	var statusEl = document.getElementById("status");
	var titleEl  = document.getElementById("title");

	function setStatus(t) { statusEl.textContent = t || ""; }
	function notice(cls, msg) {
		var d = document.createElement("div");
		d.className = cls;
		d.textContent = msg;
		stage.appendChild(d);
		return d;
	}
	function clearStage() { while (stage.firstChild) { stage.removeChild(stage.firstChild); } }

	function qp(name) {
		var m = window.location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
		return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
	}

	function fileUrl(path) {
		if (/^file:\/\//.test(path)) { return path; }
		return "file://" + (path.charAt(0) === "/" ? path : "/" + path);
	}

	// XHR a local file as an ArrayBuffer. Handles the file:// status===0 success case.
	function fetchBuffer(path, ok, fail) {
		var xhr = new XMLHttpRequest();
		try {
			xhr.open("GET", fileUrl(path), true);
			xhr.responseType = "arraybuffer";
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) { return; }
				if ((xhr.status === 0 || xhr.status === 200) && xhr.response) { ok(xhr.response); }
				else { fail("Could not read the file (status " + xhr.status + "). If this is a " +
					"file:// same-origin block, see lib/README.md for the WPE file-access note."); }
			};
			xhr.send(null);
		} catch (e) {
			fail("Read failed: " + (e && e.message ? e.message : e));
		}
	}

	// Load a script once; call ok() when ready, fail() if it 404s / errors.
	function loadScript(src, ok, fail) {
		var s = document.createElement("script");
		s.src = src;
		s.onload = function () { ok(); };
		s.onerror = function () { fail(); };
		document.body.appendChild(s);
	}

	function missingLib(libLabel, dropPath) {
		clearStage();
		notice("dv-error",
			libLabel + " is not vendored. Drop it into " + dropPath +
			" on the device (see lib/README.md), then reopen. This viewer is view-only.");
		setStatus("");
	}

	// ---- renderers ----------------------------------------------------------
	function renderText(path) {
		fetchBuffer(path, function (buf) {
			var text = "";
			try { text = bufToUtf8(buf); } catch (e) { text = ""; }
			clearStage();
			var pre = document.createElement("pre");
			pre.className = "dv-text";
			pre.textContent = text;
			stage.appendChild(pre);
			setStatus("");
		}, function (msg) { clearStage(); notice("dv-error", msg); });
	}

	function renderImage(path) {
		clearStage();
		var img = document.createElement("img");
		img.className = "dv-image";
		img.onerror = function () { clearStage(); notice("dv-error", "Could not load image."); };
		img.onload  = function () { setStatus(""); };
		img.src = fileUrl(path);
		stage.appendChild(img);
	}

	function renderPdf(path) {
		loadScript("../lib/pdfjs/pdf.js", function () {
			if (!window.pdfjsLib) { return missingLib("PDF.js", "../lib/pdfjs/"); }
			try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "../lib/pdfjs/pdf.worker.js"; }
			catch (e) { /* some builds expose it differently; render still attempts */ }
			fetchBuffer(path, function (buf) {
				window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise.then(function (pdf) {
					clearStage();
					setStatus(pdf.numPages + " page(s)");
					renderPdfPage(pdf, 1);
				}, function (err) {
					clearStage(); notice("dv-error", "PDF parse failed: " + err);
				});
			}, function (msg) { clearStage(); notice("dv-error", msg); });
		}, function () { missingLib("PDF.js", "../lib/pdfjs/"); });
	}

	function renderPdfPage(pdf, n) {
		if (n > pdf.numPages) { return; }
		pdf.getPage(n).then(function (page) {
			var viewport = page.getViewport({ scale: 1.3 });
			var canvas = document.createElement("canvas");
			canvas.className = "dv-page";
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			stage.appendChild(canvas);
			page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport })
				.promise.then(function () { renderPdfPage(pdf, n + 1); });
		});
	}

	function renderDocx(path) {
		loadScript("../lib/mammoth/mammoth.browser.min.js", function () {
			if (!window.mammoth) { return missingLib("mammoth", "../lib/mammoth/"); }
			fetchBuffer(path, function (buf) {
				window.mammoth.convertToHtml({ arrayBuffer: buf }).then(function (res) {
					clearStage();
					var box = document.createElement("div");
					box.className = "dv-doc";
					box.innerHTML = res.value;   // mammoth emits sanitized structural HTML
					stage.appendChild(box);
					setStatus("");
				}, function (err) { clearStage(); notice("dv-error", "DOCX parse failed: " + err); });
			}, function (msg) { clearStage(); notice("dv-error", msg); });
		}, function () { missingLib("mammoth", "../lib/mammoth/"); });
	}

	function renderXlsx(path) {
		loadScript("../lib/sheetjs/xlsx.full.min.js", function () {
			if (!window.XLSX) { return missingLib("SheetJS", "../lib/sheetjs/"); }
			fetchBuffer(path, function (buf) {
				try {
					var wb = window.XLSX.read(new Uint8Array(buf), { type: "array" });
					clearStage();
					wb.SheetNames.forEach(function (nm) {
						var h = document.createElement("h3");
						h.className = "dv-sheet-name";
						h.textContent = nm;
						stage.appendChild(h);
						var div = document.createElement("div");
						div.className = "dv-sheet";
						div.innerHTML = window.XLSX.utils.sheet_to_html(wb.Sheets[nm]);
						stage.appendChild(div);
					});
					setStatus(wb.SheetNames.length + " sheet(s)");
				} catch (e) {
					clearStage(); notice("dv-error", "XLSX parse failed: " + (e && e.message ? e.message : e));
				}
			}, function (msg) { clearStage(); notice("dv-error", msg); });
		}, function () { missingLib("SheetJS", "../lib/sheetjs/"); });
	}

	function renderUnsupported(type) {
		clearStage();
		notice("dv-notice", "No renderer wired for '" + type + "' yet. To add one, vendor a " +
			"JS library and extend harness.js (see docviewer/README.md).");
		setStatus("");
	}

	// Minimal UTF-8 decoder (TextDecoder may be absent on older WPE builds).
	function bufToUtf8(buf) {
		var bytes = new Uint8Array(buf), out = "", i = 0, c, c2, c3;
		while (i < bytes.length) {
			c = bytes[i++];
			if (c < 0x80) { out += String.fromCharCode(c); }
			else if (c < 0xE0) { c2 = bytes[i++]; out += String.fromCharCode(((c & 0x1F) << 6) | (c2 & 0x3F)); }
			else { c2 = bytes[i++]; c3 = bytes[i++];
				out += String.fromCharCode(((c & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F)); }
		}
		return out;
	}

	// ---- entry --------------------------------------------------------------
	var type = (qp("type") || "").toLowerCase();
	var file = qp("file");
	var name = qp("name") || (file ? file.split("/").pop() : "");
	titleEl.textContent = name || "Document Viewer";

	if (!file) {
		notice("dv-error", "No file passed. Expected harness.html?type=…&file=/abs/path");
		return;
	}
	setStatus("Loading " + name + " …");

	switch (type) {
	case "pdf":   renderPdf(file);   break;
	case "docx":  renderDocx(file);  break;
	case "xlsx":  renderXlsx(file);  break;
	case "text":  renderText(file);  break;
	case "image": renderImage(file); break;
	default:      renderUnsupported(type); break;
	}
}());
