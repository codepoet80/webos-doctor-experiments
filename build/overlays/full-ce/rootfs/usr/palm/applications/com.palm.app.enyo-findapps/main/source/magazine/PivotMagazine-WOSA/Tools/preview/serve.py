#!/usr/bin/env python3
"""
Static file server for PivotMagazine preview.

Serves the webos-appcatalog/ parent directory so both repos are reachable:
  /PivotMagazine-WOSA/          <- magazine content
  /com.palm.app.enyo-findapps/  <- app source (build.js, UserSession.js)

Two virtual mounts handle assets outside the repo tree:
  /PivotMagazine-WOSA/Tools/preview/vendor/palm/
      -> SDK build/palm/ (Onyx theme images, g11n data, etc.)
  /usr/palm/*
      -> returns "{}" -- stub for webOS device paths the Enyo g11n module
         requests at startup (e.g. tellurium_config.json).

Run from the webos-appcatalog/ directory:
    python3 PivotMagazine-WOSA/Tools/preview/serve.py

Then open:
    http://localhost:8080/PivotMagazine-WOSA/Tools/preview/
"""
import http.server
import mimetypes
import pathlib
import sys
import webbrowser

PORT = 8080
SCRIPT_DIR = pathlib.Path(__file__).parent.resolve()
ROOT = (SCRIPT_DIR / '../../..').resolve()          # …/webos-appcatalog/
PREVIEW_URL = f'http://localhost:{PORT}/PivotMagazine-WOSA/Tools/preview/'

SDK_PALM = pathlib.Path(
    '/opt/PalmSDK/Current/share/framework/enyo/1.0/framework/build/palm'
)
VENDOR_PALM_PREFIX = '/PivotMagazine-WOSA/Tools/preview/vendor/palm/'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0]

        # webOS device paths -- Enyo g11n requests these at startup from the
        # actual device (/usr/palm/...).  Return an empty JSON stub so the
        # browser console stays clean.
        if path.startswith('/usr/palm/'):
            self._send_stub_json()
            return

        # vendor/palm/ -- Onyx theme images, g11n data, etc.  Serve from the
        # Palm SDK build directory so they don't need to be copied into the
        # repo (vendor/ is gitignored anyway).
        if path.startswith(VENDOR_PALM_PREFIX):
            rel = path[len(VENDOR_PALM_PREFIX):]
            sdk_file = SDK_PALM / rel
            if sdk_file.exists() and sdk_file.is_file():
                self._send_file(sdk_file)
            else:
                self.send_error(404, f'Not found in SDK palm/: {rel}')
            return

        super().do_GET()

    def _send_stub_json(self):
        body = b'{}'
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: pathlib.Path):
        mime, _ = mimetypes.guess_type(str(path))
        mime = mime or 'application/octet-stream'
        data = path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        # Suppress 200/304 noise; only log errors.
        code = args[1] if len(args) > 1 else '-'
        if code not in ('200', '304'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    if not SDK_PALM.exists():
        print(f'Warning: Palm SDK not found at {SDK_PALM}')
        print('Theme images and g11n data will 404 (non-fatal for preview).')

    try:
        with http.server.HTTPServer(('', PORT), Handler) as httpd:
            print(f'Serving {ROOT}')
            print(f'Preview: {PREVIEW_URL}')
            webbrowser.open(PREVIEW_URL)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
        sys.exit(0)
    except OSError as e:
        print(f'Error: {e}')
        print(f'Is port {PORT} already in use? Try: lsof -i :{PORT}')
        sys.exit(1)
