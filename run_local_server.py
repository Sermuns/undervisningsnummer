#!/usr/bin/python3

import os
from http.server import HTTPServer, CGIHTTPRequestHandler
from bs4 import BeautifulSoup
import subprocess

from urllib.parse import urlparse, parse_qs

def replace_cgi_tags(soup, path):
    """
    Replace all CGI tags in the soup with the output of the corresponding script."""
    cgi_tags = soup.find_all('cgi')
    for cgi_tag in cgi_tags:
        if not cgi_tag:
            return  
        script_name = cgi_tag.get('script')
        process = subprocess.run([f'./{script_name}'] + [path], stdout=subprocess.PIPE)
        output = process.stdout.decode('utf-8')
        # Split the output on the first blank line
        content = output.split('\n\n')[1]
        cgi_tag.replace_with(BeautifulSoup(content, 'html.parser'))

class Handler(CGIHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.last_path = None
        self.last_queries = None
        super().__init__(*args, **kwargs)

    def do_GET(self):
        with open('index.html', 'r') as file:
            soup = BeautifulSoup(file, 'html.parser')
            replace_cgi_tags(soup, self.path)

        # Send the HTTP response headers
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

        # Send the modified HTML as the response body
        self.wfile.write(str(soup).encode('utf-8'))


port = 8000
httpd = HTTPServer(('localhost', port), Handler)
print(f"Server started on {port}")
httpd.serve_forever()