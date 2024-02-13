#!/usr/bin/python3

import http.server
import os
import subprocess
from bs4 import BeautifulSoup

class UnRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Split the path and the query parameters
        path, _, query = self.path.partition("?")

        # Serve index.html if path is root ("/")
        path = "/index.html" if path == "/" else path

        # Reassemble the path and the query parameters
        self.path = "?".join(part for part in (path, query) if part)

        # Translate the path to the corresponding file path
        file_path = self.translate_path(self.path)

        # Serve the file if it exists, else send a 404 error
        self.serve_file(file_path) if os.path.isfile(file_path) else self.send_error(404, "File not found")

    def serve_file(self, path):
        try:
            # Open the file in binary mode and read its content
            with open(path, 'rb') as file:
                content = file.read()

            # Process <cgi> tags if the file is an HTML file
            if path.endswith('.html'):
                content = self.process_cgi_tags(content)

            # Send response with the file content
            self.send_response(200)
            self.send_header("Content-type", self.guess_type(path))
            self.end_headers()
            self.wfile.write(content)
        except IOError:
            self.send_error(404, "File not found")

    def process_cgi_tags(self, content):
        soup = BeautifulSoup(content, 'html.parser')

        # Find all <cgi> tags and replace them with the output of the specified script
        for cgi_tag in soup.find_all('cgi'):
            script_name = cgi_tag.get('script')
            process = subprocess.run(['python3', script_name, self.path], capture_output=True, text=True)
            output = str(process.stdout.split('\n\n')[1])
            cgi_tag.replace_with(BeautifulSoup(output, 'html.parser'))

        return str(soup).encode()

if __name__ == '__main__':
    # Start the server on port 3000
    http.server.test(HandlerClass=UnRequestHandler, port=3000)