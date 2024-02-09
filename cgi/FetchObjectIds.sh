#!/bin/bash

# Extract the course argument from an environment variable
course="$VAR_course"

# Check if the course argument is empty
if [ -z "$course" ]; then
    echo "Content-type: text/html; charset=UTF-8"
    echo
    echo "<p id="empty-course"></p>"
    exit 1
fi

# Check if the length of the course is less than 5
if [ ${#course} -lt 5 ]; then
    # Output an error message in HTML format and exit the script
    echo "Content-type: text/html; charset=UTF-8"
    echo
    echo "<p id="short-course"></p>"
    exit 1
fi

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
    echo "<p id="no-results"></p>"
    exit 1
fi

# Construct the URLs for the current semester and future semesters, including the object IDs in the query parameters
timeEditUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?part=t&sid=3&p=20240101%2C20241231&objects=${objectIdString}"

# Output the URLs in HTML format and log to a file
echo "Content-Type: text/html"
echo
echo "<div class=\"hidden\" id=\"semesterUrlDiv\"><a href=\"$timeEditUrl\">$timeEditUrl</a></div>"
