#!/bin/bash

# Extract the course argument
course="$VAR_query"

if($course='') then
    echo "Content-type: text/html"
    echo
    echo "no course"
    exit 0
fi

# URL to fetch JSON data
url="https://cloud.timeedit.net/liu/web/schema/objects.json?l=sv_SE&search_text=${course}&types=219&fe=132.0&sid=3&ox=0"

# Use curl to fetch the JSON data
json_data=$(curl -s "$url" | jq -r '.records[].identVirtual')

echo "Content-type: application/json"
echo
echo $json_data
