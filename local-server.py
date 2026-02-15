#!/usr/bin/env python3

"""
Local Development Server with Mock API
Run with: python3 local-server.py
"""

import http.server
import socketserver
import json
import time
from urllib.parse import urlparse

PORT = 8000

class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Mock token endpoint
        if parsed_path.path == '/api/token':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            mock_token = f'mock_token_for_local_testing_{int(time.time())}'
            response = {
                'token': mock_token,
                'region': 'eastus'
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Mock stats endpoint
        if parsed_path.path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'success': True}
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Serve static files
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"{self.command} {args[0]}")

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), MockAPIHandler) as httpd:
        print('')
        print('🚀 Local Development Server Running!')
        print('')
        print(f'   URL: http://localhost:{PORT}')
        print('')
        print('📝 Features:')
        print('   ✅ Static file serving')
        print('   ✅ Mock /api/token endpoint')
        print('   ✅ Mock /api/stats endpoint')
        print('')
        print('⚠️  Note: Mock token won\'t work with real Azure Speech SDK')
        print('   For real speech recognition, deploy to Cloudflare Pages')
        print('')
        print('Press Ctrl+C to stop')
        print('')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n\n👋 Server stopped')
