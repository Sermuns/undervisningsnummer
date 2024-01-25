#!/bin/bash

# Set the language environment variable to Swedish
export LANG=sv_SE.UTF-8

# Extract the course argument from an environment variable
course="$VAR_course"

# Base URL for the web service
baseUrl="https://cloud.timeedit.net/liu/web/schema"

# Construct the URL to fetch JSON data, including the course code in the query parameters
jsonUrl="$baseUrl/objects.json?l=sv_SE&search_text=${course}&types=219&fe=132.0&sid=3&ox=0"

# Use curl to fetch the JSON data from the web service, and jq to extract the object IDs
objectIds=($(curl -s "$jsonUrl" | jq -r '.records[].identVirtual'))

# Join the array elements with a comma
IFS=,
objectIdString="${objectIds[*]}"

# If the string is empty, no matches were found
if [ -z "$objectIdString" ]; then
    # Output an error message in HTML format and exit the script
    echo "Content-type: text/html; charset=utf-8"
    echo
    echo "<p class=\"error\">Inga treffar</p>"
    exit 1
fi

# Construct the URLs for the current semester and future semesters, including the object IDs in the query parameters
semesterUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=20240101%2C20241231&objects=${objectIdString}"
futureUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=0.d%2C20241231.x&objects=${objectIdString}"

# Output the URLs in HTML format
echo "Content-Type: text/html"
echo
echo "<div class=\"hidden\" id=\"semesterUrlDiv\"><a href=\"$semesterUrl\">$semesterUrl</a></div>"
echo "<div class=\"hidden\" id=\"futureUrlDiv\"><a href=\"$futureUrl\">$futureUrl</a></div>"