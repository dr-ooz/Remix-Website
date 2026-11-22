"""Local preview server for the Remix DoozDex site (localhost only).

    python tools/dev_server.py [port]        (default 8769)

Serves dist/ like `python -m http.server`, plus one extra: the site's dev editors can POST /__save to write
their data file straight into the website folder (src/ AND dist/), so "Save" no longer goes to Downloads.
Only the files listed in SAVABLE can be written, and only from this computer.
"""
import json, os, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DIST = os.path.join(ROOT, "dist")
SAVABLE = {"moveguide/move_guide.json"}  # add future editable pages' data files here


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIST, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_POST(self):
        if self.path.split("?")[0] != "/__save" or self.client_address[0] not in ("127.0.0.1", "::1"):
            return self.send_error(404)
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf8"))
            rel = body["path"]
            if rel not in SAVABLE:
                return self.send_error(403, "not a savable file")
            text = body["content"]
            json.loads(text)  # must be valid JSON
            for base in (os.path.join(ROOT, "src"), DIST):
                dest = os.path.join(base, *rel.split("/"))
                tmp = dest + ".tmp"
                with open(tmp, "w", encoding="utf8") as f:
                    f.write(text)
                os.replace(tmp, dest)
            out = json.dumps({"ok": True, "saved": rel, "bytes": len(text.encode("utf8"))}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
        except Exception as e:  # noqa
            self.send_error(500, str(e))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8769
    print("Remix DoozDex dev server: http://localhost:%d  (serving %s)" % (port, DIST))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
