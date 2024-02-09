// Global variables
const now = new Date()
const urlQueries = getURLQueries()
var resultDiv
var urlDiv

/**
 * Get queries from the URL.
 * Returns an object with the queries as keys and their values as values.
 * @returns {Object}
 */
function getURLQueries() {
  const search = window.location.search
  if (search.length === 0) {
    return false
  }
  const queryStrings = search.substring(1).split('&')
  const queries = {}
  for (const queryString of queryStrings) {
    const [key, value] = queryString.split('=')
    queries[key] = value
  }
  return queries
}

/**
 * Fetch from the urls in the DOM, parse the responses and create a table.
 */
async function generateTable() {

  const studentGroup = urlQueries.group

  // Get the urls
  const nextOccurencesMap = new Map()
  const scheduleUrl = urlDiv.children[0].textContent.replace(/\s+/g, ',')
  const response = await fetch(scheduleUrl)
  const responseText = await response.text()

  const parser = new DOMParser()
  const timeEditDocument = parser.parseFromString(responseText, 'text/html')

  // Loop through the rows in the TimeEdit document, count every occurence of an activity in the semesterCount, and store only the future occurences in futureCount
  const semesterMap = new Map()
  const futureMap = new Map()
  const rows = timeEditDocument.querySelectorAll('tr')


  let latestDateString = ''

  for (const tr of rows) {
    if (tr.childElementCount < 3 || tr.className == 'columnHeaders') continue
    // Capture the latest date row
    if (tr.childElementCount == 3) {
      latestDateString = tr.children[1].textContent.trim(' ')
      continue
    }
    // If the row does not contain the student group, skip it
    if (getIfContainsGroup(tr, studentGroup) == false) {
      continue
    }
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
        nextOccurencesMap.set(activity, formattedLatestDateString + ', ' + formattedTimespan + (ongoing ? ' (nu)' : ''))
      }
    }
  }

  // Create a table element
  const table = document.createElement('table')
  table.id = 'resultTable'
  const headersRow = document.createElement('tr')
  headersRow.innerHTML =
    '<th>Aktivitet</th><th>Tidigare / totalt</th><th>Nästa</th>'
  table.appendChild(headersRow)

  // Loop through the futureCountMap and add a row for each key-value pair
  for (const [activity, count] of semesterMap) {
    // Create a row element
    const row = document.createElement('tr')

    // Create a cell element for the key
    const keyCell = document.createElement('td')
    keyCell.textContent = activity
    row.appendChild(keyCell)

    // Create a cell element for the value
    const valueCell = document.createElement('td')
    const passedCount = count - (futureMap.get(activity) || 0)
    valueCell.textContent = passedCount + '/' + count
    row.appendChild(valueCell)

    const nextOccurenceCell = document.createElement('td')
    const nextOccurenceString = nextOccurencesMap.get(activity)
    if (nextOccurenceString && nextOccurenceString.endsWith('(nu)')) {
      nextOccurenceCell.classList.add('bold')
    }

    nextOccurenceCell.innerHTML = nextOccurenceString || '-'
    row.appendChild(nextOccurenceCell)

    // Add the row to the table
    table.appendChild(row)
  }

  // Add table to the DOM
  resultDiv.append(table)
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

/** Toggle the class .hidden on all IDs */
function toggleHiddenOnIDs(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden');
    }
  }
}

function storeHistory(courseInput, groupInput) {
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
 * Show the search history in the DOM.
 */
function showHistory(courseInput, groupInput) {
  const searchHistory = JSON.parse(
    localStorage.getItem('searchHistory') || '[]'
  )
  const historyDiv = document.getElementById('history')
  if (searchHistory.length === 0) {
    const historyLabel = document.querySelector('label[for="history"]')
    historyLabel.style.display = 'none'
    historyDiv.style.display = 'none'
  }
  historyDiv.innerHTML = ''
  searchHistory.forEach((search, index) => {
    const history = document.createElement('a')
    const groupText = search.group ? `(${search.group})` : ''
    history.textContent = `${search.course}` + groupText
    history.style.cursor = 'pointer' // add pointer cursor on hover
    history.addEventListener('click', () => {
      courseInput.value = search.course
      groupInput.value = search.group
    })
    historyDiv.appendChild(history)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  urlDiv = document.getElementById('urlDiv')
  resultDiv = document.getElementById('resultDiv')

  if (urlQueries && urlQueries.course.length > 0) {
    toggleHiddenOnIDs(['urlButton']);
    // Actual url present
    if (urlDiv.children[0].textContent.startsWith('https://'))
      generateTable();
  }

  // Show stored history
  const courseInput = document.querySelector('input[name="course"]');
  const groupInput = document.querySelector('input[name="group"]');
  showHistory(courseInput, groupInput);

  // Store history (when the table is generated)
  const observer = new MutationObserver((mutations) => {
    if (resultDiv.children.length > 0) {
      storeHistory(courseInput, groupInput);
      showHistory(courseInput, groupInput);
      observer.disconnect();
    }
  });
  observer.observe(resultDiv, { childList: true });
});