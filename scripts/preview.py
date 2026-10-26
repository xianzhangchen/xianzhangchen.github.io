#!/usr/bin/env python3
"""Serve a local preview bound only to this computer."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if any(part.startswith('.') for part in Path(unquote(urlsplit(self.path).path)).parts if part not in ('/', '')):
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if any(part.startswith('.') for part in Path(unquote(urlsplit(self.path).path)).parts if part not in ('/', '')):
            self.send_error(404)
            return
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=str(root)))
    print(f'Local preview: http://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
