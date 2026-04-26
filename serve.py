"""
No-cache HTTP server for NeuroSense AI frontend.
Serves files from the 'frontend' directory with cache-control headers
to ensure browsers always get fresh content.
"""
import http.server
import os

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(__file__), 'frontend')

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[Frontend] {self.address_string()} - {format % args}")

if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), NoCacheHandler) as httpd:
        print(f"NeuroSense Frontend Server: http://localhost:{PORT}")
        print(f"Serving from: {DIRECTORY}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()
