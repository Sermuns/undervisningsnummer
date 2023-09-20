#!/bin/bash

# Extract the course argument
course="$VAR_course"

if [ -z "$course" ]; then
    exit 1
fi

baseUrl="https://cloud.timeedit.net/liu/web/schema"

# URL to fetch JSON data
jsonUrl="$baseUrl/objects.json?l=sv_SE&search_text=${course}&types=219&fe=132.0&sid=3&ox=0"

# Use curl to fetch the JSON data containing object ids for coursename
objectIds=$(curl -s "$jsonUrl" | jq -r '.records[].identVirtual')

semesterUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=20230801%2C20231231&objects=$(IFS=,; echo "${objectIds[*]}")&ox=0&types=0"
futureUrl="https://cloud.timeedit.net/liu/web/schema/ri.html?h=t&sid=3&p=0.d%2C20231231.x&objects=$(IFS=,; echo "${objectIds[*]}")&ox=0&types=0"

echo "Content-type: text/html"
echo
echo "<div id="semesterUrlDiv" style="display:none">$semesterUrl</div>"
echo "<div id="futureUrlDiv" style="display:none">$futureUrl</div>"