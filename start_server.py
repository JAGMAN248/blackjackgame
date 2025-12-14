"""
Simple HTTP server to serve the frontend
This solves CORS issues when opening index.html via file:// protocol
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 5500  # Standard port for Live Server compatibility

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"✅ Frontend server running on http://127.0.0.1:{PORT}")
        print(f"✅ Open http://127.0.0.1:{PORT}/index.html in your browser")
        print("✅ Press Ctrl+C to stop")
        
        # Auto-open browser
        webbrowser.open(f'http://127.0.0.1:{PORT}/index.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ Server stopped")


