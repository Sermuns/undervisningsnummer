#!/bin/bash

export LANG=sv_SE.UTF-8

# Extract the course argument
course="$VAR_course"

if [ ${#course} -lt 5 ]; then
    echo "Content-type: text/html; charset=utf-8"
    echo
    echo "<p class="error">Kurskod måste bestå av minst 4 karaktärer!</p>"
    exit 1
fi

baseUrl="https://cloud.timeedit.net/liu/web/schema"

# URL to fetch JSON data
jsonUrl="$baseUrl/objects.json?l=sv_SE&search_text=${course}&types=219&fe=132.0&sid=3&ox=0"

# Use curl to fetch the JSON data containing object ids for coursename
objectIds=($(curl -s "$jsonUrl" | jq -r '.records[].identVirtual'))

# Join the array elements with a delimiter
IFS=,
objectIdString="${objectIds[*]}"

# If the string is empty, no matches were found
if [ -z "$objectIdString" ]; then
    echo "Content-type: text/html; charset=utf-8"
    echo
    echo "<p class="error">Inga träffar</p>"
    exit 1
fi

 # Set the IFS variable to a space character
semesterUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=20240101%2C20241231&objects=${objectIdString}"
futureUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=0.d%2C20241231.x&objects=${objectIdString}"

echo "Content-type: text/html"
echo
echo "<div class="hidden" id="semesterUrlDiv"><a href=\"$semesterUrl\">$semesterUrl</a></div>"
echo "<div class="hidden" id="futureUrlDiv"><a href=\"$futureUrl\">$futureUrl</a></div>"
