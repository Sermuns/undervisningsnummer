// Global variables
const now = new Date()
let urlQueries
let resultDiv
let urlDiv
let courseInput
let groupInput
let commentInput
let loading

function showLoading() {
  // disable inputs
  courseInput.disabled = true
  groupInput.disabled = true

  // start loading animation
  let lineCount = 0;
  loading = setInterval(() => {
    lineCount = (lineCount + 1) % 4;
    let line = "";
    switch (lineCount) {
      case 0:
        line = "|";
        break;
      case 1:
        line = "/";
        break;
      case 2:
        line = "—";
        break;
      case 3:
        line = "\\";
        break;
    }
    resultDiv.innerHTML = `${line} Vänta lite, söker på TimeEdit ${line}`;
  }, 200);
}

function hideLoading() {
  clearInterval(loading);
  resultDiv.innerHTML = "";
  courseInput.disabled = false
  groupInput.disabled = false
}

/**
 * Get queries from the URL.
 * Returns an object with the queries as keys and their values as values.
 * @returns {Object}
 */
function getURLQueries() {
  const search = window.location.search;

  if (search.length === 0) return false;

  const queryStrings = new URLSearchParams(search);
  const queries = Object.fromEntries(queryStrings.entries());

  return queries;
}

/**
 * Fetch from the urls in the DOM, parse the responses and create a table.
 */
async function generateTable() {

  // Get url queries
  const studentGroup = urlQueries.group
  const comment = urlQueries.comment

  // Get the urls
  const scheduleUrl = urlDiv.children[0].textContent.replace(/\s+/g, ',')
  const response = await fetch(scheduleUrl)
  const responseText = await response.text()

  const parser = new DOMParser()
  const timeEditDocument = parser.parseFromString(responseText, 'text/html')


  // Loop through the rows in the TimeEdit document, count every occurence of an activity in the semesterCount, and store only the future occurences in futureCount
  const semesterMap = new Map()
  const futureMap = new Map()
  const nextOccurencesMap = new Map()
  const rows = timeEditDocument.querySelectorAll('tr')

  let latestDateString = ''
  let totalNumRows = 0
  let numGroupRows = 0

  for (const tr of rows) {

    totalNumRows++

    // Uninteresting rows such as headers
    if (tr.childElementCount < 3 || tr.className == 'columnHeaders') continue

    // Capture the latest date row
    if (tr.childElementCount == 3) {
      latestDateString = tr.children[1].textContent.trim(' ')
      continue
    }
    // If the row does not contain the student group, skip it
    if (getIfContainsGroup(tr, studentGroup) == false) continue

    // If the row does not contain the comment, skip it
    if (comment && tr.textContent.toUpperCase().includes(comment.toUpperCase()) == false) continue

    numGroupRows++
    const latestDate = Date.parse(latestDateString.split(' ')[1])
    // Get attributes from the row
    const timespan = tr.children[1].textContent.trim()
    const activity = tr.children[3].textContent.trim()

    // Create exact startMoment from starttime and latestDate
    const [startHour, startMinute] = timespan.split(' ')[0].split(':')
    const startMoment = new Date(latestDate)
    startMoment.setHours(startHour, startMinute)

    // Create exact endMoment from endTime and latestDate
    const [endHour, endMinute] = timespan.split(' ')[2].split(':')
    const endMoment = new Date(latestDate)
    endMoment.setHours(endHour, endMinute)

    // Count the total occurences of the activity
    semesterMap.set(activity, (semesterMap.get(activity) || 0) + 1)


    // If the activity is in the future, count it
    if (endMoment > now) {
      futureMap.set(activity, (futureMap.get(activity) || 0) + 1)
      if (!nextOccurencesMap.has(activity)) {
        const ongoing = startMoment < now && now < endMoment
        const formattedLatestDateString = latestDateString.split(' ').slice(0, 2).join(' ')
        const formattedTimespan = timespan.replace(/\s/g, '')
        nextOccurencesMap.set(activity, `${formattedLatestDateString}, ${formattedTimespan}${ongoing ? ' (nu)' : ''}`);
      }
    }
  }

  if (numGroupRows == 0) {
    const errorP = document.createElement('p')
    errorP.className = 'error'
    errorP.id = 'group-or-comment-not-found'
    resultDiv.appendChild(errorP)
    return
  }

  // Add table to the DOM
  resultDiv.append(createTable(futureMap, semesterMap, nextOccurencesMap))
}

function createTable(futureMap, semesterMap, nextOccurencesMap) {
  const resultTable = document.createElement('table')
  resultTable.id = 'resultTable'

  const headers = ['Aktivitet', 'Tidigare / totalt', 'Nästa']

  headers.forEach(headerText => {
    const header = document.createElement('div')
    header.classList.add('header')
    header.textContent = headerText
    resultTable.appendChild(header)
  })


  // Loop through the futureCountMap and add a row for each key-value pair
  for (const [activity, count] of semesterMap) {
    // create row
    const row = document.createElement('div')
    row.className = 'row'

    //cell for key
    const keyCell = document.createElement('div')
    keyCell.textContent = activity
    row.appendChild(keyCell)

    // cell for value
    const valueCell = document.createElement('div')
    const passedCount = count - (futureMap.get(activity) || 0)
    valueCell.textContent = `${passedCount}/${count}`;
    row.appendChild(valueCell)

    // cell for next occurence
    const nextOccurenceCell = document.createElement('div')
    const nextOccurenceString = nextOccurencesMap.get(activity)
    // now?
    if (nextOccurenceString && nextOccurenceString.endsWith('(nu)')) {
      nextOccurenceCell.classList.add('bold')
    }
    nextOccurenceCell.innerHTML = nextOccurenceString || '-' // also handle if not found
    row.appendChild(nextOccurenceCell)
    
    resultTable.appendChild(row)
  }
  return resultTable
}

/**
 * Get the student groups in the given tr.
 * @param {*} tr 
 * @returns 
 */
function getPresentGroups(tr) {
  const studentGroupElement = tr.children[7]
  const studentGroupsInRow = studentGroupElement.textContent
    .toUpperCase()
    .trim()
    .split(' ')
  return studentGroupsInRow
}

/**
 * Return true if the given tr contains the given group OR supergroup
 * Eg. D2.C or D2
 */
function getIfContainsGroup(tr, group) {
  if (!group) {
    // If no group is given, default to true
    return true
  }
  const studentGroupElement = tr.children[7]
  const studentGroupsInRow = studentGroupElement.textContent
    .toUpperCase()
    .trim()
    .split(' ')
  const exactMatch = studentGroupsInRow.includes(group)
  const searchedSuperStudentGroup = group.trim().split('.')[0]
  const superGroupMatch = studentGroupsInRow.includes(searchedSuperStudentGroup)
  return exactMatch || superGroupMatch
}

/** Toggle the class .hidden on all given IDs */
function toggleHiddenOnIDs(ids) {
  ids.forEach((id) => {
    const element = document.getElementById(id)
    if (!element) return
    element.classList.toggle('hidden')
  })
}

function storeHistory() {
  const table = document.querySelector('#resultDiv > table')

  // If no results were found, don't add the search to the history
  if (!table) {
    return
  }

  const searchHistory = JSON.parse(
    localStorage.getItem('searchHistory') || '[]'
  )

  // Add the current search to the search history
  const currentSearch = {
    course: courseInput.value.toUpperCase(),
    group: groupInput.value.toUpperCase()
  }

  // Check if the current search already exists in the history
  const alreadyExistsIndex = searchHistory.findIndex(
    search =>
      search.course === currentSearch.course &&
      search.group === currentSearch.group
  )

  // If the search already exists, remove it from the history
  if (alreadyExistsIndex !== -1) {
    searchHistory.splice(alreadyExistsIndex, 1)
  }

  searchHistory.unshift(currentSearch)

  // Store only the three latest searches in localStorage
  localStorage.setItem(
    'searchHistory',
    JSON.stringify(searchHistory.slice(0, 5))
  )
}

/**
 * ONLY FOR DEBUGGING, NEVER USE IN PRODUCTION 
 * @param {number} ms
 */
function busyWait(ms) {
  const start = Date.now()
  let now = start
  while (now - start < ms) {
    now = Date.now()
  }
}

/**
 * Show the search history in the DOM.
 */
function showHistory() {
  const searchHistoryItem = localStorage.getItem('searchHistory')
  // If no search history exists, return
  if (!searchHistoryItem) return

  const searchHistory = JSON.parse(searchHistoryItem)
  const selectElement = document.getElementById('history')
  searchHistory.forEach((search) => {
    const history = document.createElement('option')
    const groupText = search.group ? ` (${search.group})` : ''
    history.textContent = `${search.course}${groupText}`;
    selectElement.appendChild(history)
  })
}

/**
 * Update the input fields with the selected history item.
 */
function updateInputs() {
  const selectElement = document.getElementById('history')
  const selectedOption = selectElement.options[selectElement.selectedIndex].text
  const [course, group] = selectedOption.split('(')
  courseInput.value = course.trim().toUpperCase()
  groupInput.value = group.slice(0, -1).trim().toUpperCase()
}

// Main code
window.onload = () => {
  // Get stuff
  urlDiv = document.getElementById('urlDiv')
  resultDiv = document.getElementById('resultDiv')
  courseInput = document.querySelector('input[name="course"]')
  groupInput = document.querySelector('input[name="group"]')
  commentInput = document.querySelector('input[name="comment"]')
  urlQueries = getURLQueries()

  if (urlQueries && urlQueries.course.length > 0) {
    showLoading()
    courseInput.value = urlQueries.course.trim().toUpperCase()
    groupInput.value = urlQueries.group.trim().toUpperCase()
    commentInput.value = urlQueries.comment.trim()
    toggleHiddenOnIDs(['urlButton']);
    // Actual url present
    if (urlDiv.children[0].textContent.startsWith('https://'))
      generateTable()

  }

  hideLoading()

  showHistory()

  // Store history (when the table is generated)
  const resultDivObserver = new MutationObserver((mutations) => {
    if (resultDiv.children.length > 0) {
      storeHistory();
      resultDivObserver.disconnect();
    }
  });
  resultDivObserver.observe(resultDiv, { childList: true });
};