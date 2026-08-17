/*global IMPORTS, Config, require, process, console */
/*
 * httpcurl.js - HTTPS transport for the Dropbox service, via the modern curl.
 *
 * WHY: the device node runtime is OpenSSL 0.9.8k (no TLS 1.2/1.3), so its built-in
 * HTTP stack (Foundations.Comms.AjaxCall) CANNOT complete a TLS handshake with
 * api.dropboxapi.com. This mirrors the Teams port's rule - "no modern HTTPS in the
 * webOS JS layer" - by shelling every request out to a modern curl. The JS layer is
 * pure orchestration; all TLS lives in curl.
 *
 * CURL SOURCE: Config.CURL. Now that the OpenSSL-11 update ships a modern SYSTEM curl
 * (/usr/bin/curl = curl 7.88.1 + OpenSSL 1.1.1w, verified doing TLS 1.2/1.3 to the cloud
 * APIs on-device), the connectors point Config.CURL at "/usr/bin/curl" with no
 * CURL_LD_LIBRARY_PATH - the old /var/dropbox-tls bundle is no longer required. (This code
 * is unchanged: it just runs whatever Config.CURL names, defaulting to /usr/bin/curl.)
 *
 * SECURITY: there is NO client_secret (public client + PKCE - see oauth2.js). Form
 * fields passed via --data-urlencode are the app key (public), the one-time auth
 * code, the short-lived PKCE code_verifier, and the refresh_token - all briefly
 * visible in `ps` argv. The refresh_token is the only durable one; on this single-
 * user rooted device that is acceptable. TODO harden via `curl --config -` (stdin).
 */
var Foundations = IMPORTS.foundations;
var Future = Foundations.Control.Future;

var reqf = (typeof require !== "undefined") ? require : (IMPORTS.require || null);
var cp = reqf ? reqf("child_process") : null;

var HttpCurl = {
	// request({ method, url, headers:{}, form:{k:v}, body:"", bearer:"" }) -> Future
	// resolves to { status: <int>, responseText: <string> }
	request: function (opts) {
		opts = opts || {};
		var f = new Future();

		if (!cp) {
			f.setException({ returnValue: false, errorCode: "NO_CHILD_PROCESS",
				detail: "child_process unavailable in this service context" });
			return f;
		}

		var method = opts.method || "GET";
		// Bound every request: without these a stalled connection hangs the whole command until
		// the framework's commandTimeout (30s), which surfaced as QuickOffice's eternal "Loading
		// files..." spinner. --connect-timeout caps the handshake; --max-time is a total backstop
		// (generous so large up/downloads still complete). A hard fail here becomes CURL_FAILED,
		// which the consumer can retry, instead of an indefinite hang.
		var args = ["-s", "-S", "--tlsv1.2", "--connect-timeout", "15", "--max-time", "90",
			"-w", "\n%{http_code}", "-X", method];

		// Point curl at the system CA store (/etc/ssl/certs/ca-certificates.crt). The
		// stock rootfs stub is from 2011; the deployment-bundle prerequisite refreshes
		// it to a current bundle so verify succeeds (verify=0) even on a reset device.
		if (Config.CURL_CAINFO) {
			args.push("--cacert", Config.CURL_CAINFO);
		}

		if (opts.bearer) {
			args.push("-H", "Authorization: Bearer " + opts.bearer);
		}
		if (opts.headers) {
			Object.keys(opts.headers).forEach(function (k) {
				args.push("-H", k + ": " + opts.headers[k]);
			});
		}
		// outFile: write the response BODY straight to a local file (Dropbox /files/download).
		// curl streams to disk, so big files don't hit node's maxBuffer; stdout keeps only the
		// -w "\n<http_code>" line.
		if (opts.follow) {
			args.push("-L");   // Box content endpoint 302-redirects to dl.boxcloud.com
		}
		if (opts.outFile) {
			args.push("--create-dirs", "-o", opts.outFile);
		}
		if (opts.multipart) {
			// [{name, value} | {name, file}] -> curl -F. Box wants an "attributes" JSON
			// part plus a "file" part reading the local file with @.
			opts.multipart.forEach(function (p) {
				args.push("-F", p.file ? (p.name + "=@" + p.file) : (p.name + "=" + p.value));
			});
		} else if (opts.form) {
			Object.keys(opts.form).forEach(function (k) {
				args.push("--data-urlencode", k + "=" + opts.form[k]);
			});
		} else if (opts.dataFile) {
			// Send a local file as the raw request body (Dropbox /files/upload). "@" makes curl
			// read the file directly - the request is NOT limited by node's maxBuffer.
			args.push("--data-binary", "@" + opts.dataFile);
		} else if (opts.body) {
			args.push("--data-binary", opts.body);
		}
		args.push(opts.url);

		// Inherit env; point the loader at the modern libssl/libcrypto if configured.
		var env = {};
		var src = (typeof process !== "undefined" && process.env) ? process.env : {};
		Object.keys(src).forEach(function (k) { env[k] = src[k]; });
		if (Config.CURL_LD_LIBRARY_PATH) {
			env.LD_LIBRARY_PATH = Config.CURL_LD_LIBRARY_PATH +
				(env.LD_LIBRARY_PATH ? ":" + env.LD_LIBRARY_PATH : "");
		}

		cp.execFile(Config.CURL || "/usr/bin/curl", args,
			{ env: env, maxBuffer: 8 * 1024 * 1024 },
			function (err, stdout, stderr) {
				stdout = stdout || "";
				if (err && !stdout) {
					f.setException({ returnValue: false, errorCode: "CURL_FAILED",
						detail: (stderr || String(err)) });
					return;
				}
				// -w appended "\n<http_code>" after the body; split on the LAST newline.
				var cut = stdout.lastIndexOf("\n");
				var head = (cut >= 0) ? stdout.substring(0, cut) : stdout;
				var tail = (cut >= 0) ? stdout.substring(cut + 1) : "";
				f.result = { status: parseInt(tail, 10) || 0, responseText: head };
			});

		return f;
	}
};

if (typeof exports !== "undefined") { exports.HttpCurl = HttpCurl; }
