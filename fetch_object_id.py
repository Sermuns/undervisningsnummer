#!/usr/bin/python3

import urllib.request
import json
import sys

BASE_URL = "https://cloud.timeedit.net/liu/web/schema"

def parse_arguments():
    if len(sys.argv) < 2:
        sys.exit(1)

    query = sys.argv[1].split('/')[-1]

    if not query:
        sys.exit(1)

    course = query.split('=')[1].split('&')[0]

    if not course or len(course) < 5:
        print('<p class="error" id="short-course"></p>')
        sys.exit(1)

    return course

def fetch_json_data(course):
    json_url = f"{BASE_URL}/objects.json?l=sv_SE&search_text={course}&types=219&fe=132.0&sid=3&ox=0"

    try:
        with urllib.request.urlopen(json_url) as url:
            data = json.loads(url.read().decode())
    except Exception as e:
        print(f"Error fetching data: {e}")
        sys.exit(1)

    return data

def generate_urls(data):
    object_ids = [record['identVirtual'] for record in data['records']]
    object_id_string = ','.join(object_ids)

    if not object_id_string:
        print('<p class="error" id="no-results"></p>')
        sys.exit(1)

    time_edit_url = f"{BASE_URL}/ri.html?part=t&sid=3&p=20240101%2C20241231&objects={object_id_string}"

    print(f'<div class="hidden" id="semesterUrlDiv"><a href="{time_edit_url}">{time_edit_url}</a></div>')

def main():
    print("Content-Type: text/html\n")

    course = parse_arguments()
    data = fetch_json_data(course)
    generate_urls(data)

if __name__ == "__main__":
    main()