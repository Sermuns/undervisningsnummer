#!/usr/bin/python3

print("Content-Type: text/html\n")

import urllib.request
import json
import sys


# Check if the script was called with an argument
if len(sys.argv) < 2:
    sys.exit(1)

query = sys.argv[1].split('/')[-1]

# Empty query
if not query:
    sys.exit(1)

# Parse the argument, which will be in the format "course=XXXXXX&group=XXXXXX"
# and extract the value of the course parameter
course = query.split('=')[1].split('&')[0]

# Check if the course argument is empty
if not course:
    sys.exit(1)

# Check if the length of the course is less than 5
if len(course) < 5:
    # Output an error message in HTML format and exit the script
    print('<p class="error" id="short-course"></p>')
    sys.exit(1)

# Base URL for the web service
baseUrl = "https://cloud.timeedit.net/liu/web/schema"

# Construct the URL to fetch JSON data, including the course code in the query parameters
jsonUrl = f"{baseUrl}/objects.json?l=sv_SE&search_text={course}&types=219&fe=132.0&sid=3&ox=0"

# Use urllib to fetch the JSON data from the web service, and extract the object IDs
with urllib.request.urlopen(jsonUrl) as url:
    data = json.loads(url.read().decode())

objectIds = [record['identVirtual'] for record in data['records']]

# Join the array elements with a comma
objectIdString = ','.join(objectIds)

# If the string is empty, no matches were found
if not objectIdString:
    # Output an error message in HTML format and exit the script
    print('<p class="error" id="no-results"></p>')
    sys.exit(1)

# Construct the URLs for the current semester and future semesters, including the object IDs in the query parameters
timeEditUrl = f"{baseUrl}/ri.html?part=t&sid=3&p=20240101%2C20241231&objects={objectIdString}"

# Output the URLs in HTML format
print(f'<div class="hidden" id="semesterUrlDiv"><a href="{timeEditUrl}">{timeEditUrl}</a></div>')