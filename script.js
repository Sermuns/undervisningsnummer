/**
 * Fetch from the urls in the DOM, parse the responses and create a table.
 */
function makeTable () {
  // Get the div element with id="resultDiv"
  const resultDiv = document.getElementById('resultDiv')

  // Wait for urls to be added to the DOM
  function waitForChildren () {
    const semesterUrlDiv = document.getElementById('semesterUrlDiv')
    const futureUrlDiv = document.getElementById('futureUrlDiv')
    if (semesterUrlDiv && futureUrlDiv) {
      return true
    } else {
      setTimeout(waitForChildren, 100) // Check again in 100 milliseconds
    }
  }
  // Call the checkForChildNodes function to start checking for child nodes
  waitForChildren()

  // Extract the value of the "group" parameter
  const urlQueries = window.location.search.match(/group=([^&]*)/)
  // If the group parameter is not present, return
  if (!urlQueries) {
    return
  }
  const studentGroup = urlQueries[1].toUpperCase()

  // Urls will be in the children div of resultDiv
  const nextOccurences = new Map()
  const scheduleUrls = Array.from(resultDiv.children, child =>
    child.textContent.replace(/\s+/g, ',')
  )
  if (scheduleUrls.length < 2) {
    resultDiv.innerHTML = '<p>Inga träffar</p>'
    return
  }
  const promises = scheduleUrls.map(url =>
    fetch(url).then(response => response.text())
  ) // Map the URLs to an array of fetch promises
  Promise.all(promises).then(responseTexts => {
    const parser = new DOMParser()
    const documents = responseTexts.map(responseText =>
      parser.parseFromString(responseText, 'text/html')
    ) // Parse each response text into a Document object

    const semesterCountMap = getActivityCountMap(
      documents[0].querySelectorAll('tr.rr.clickable2'),
      studentGroup
    )

    // No results!
    if (semesterCountMap.size === 0) {
      return
    }

    const futureTrs = documents[1].querySelectorAll('tr.rr.clickable2')
    // get the first date
    for (const tr of futureTrs) {
      const activity = tr.children[3].textContent.trim()
      const isFirstOccurence = !nextOccurences.has(activity)
      if (isFirstOccurence) {
        let prevSibling = tr.previousElementSibling
        while (prevSibling && prevSibling.classList.contains('clickable2')) {
          prevSibling = prevSibling.previousElementSibling
        }
        const time = tr.children[1].textContent.trim().replace(/\s+/g, '')
        const day = prevSibling.children[1].textContent
          .trim()
          .split(' ')
          .slice(0, 2)
          .join(' ')
        const date = prevSibling ? day + ', ' + time + '' : ''

        nextOccurences.set(activity, date)
      }
    }

    const futureCountMap = getActivityCountMap(futureTrs, studentGroup)

    // Create a table element
    const table = document.createElement('table')
    table.id = 'resultTable'
    const headersRow = document.createElement('tr')
    headersRow.innerHTML =
      '<th>Aktivitet</th><th>Tidigare / totalt</th><th>Nästa</th>'
    table.appendChild(headersRow)

    // Loop through the futureCountMap and add a row for each key-value pair
    for (const [course, semesterCount] of semesterCountMap) {
      // Create a row element
      const row = document.createElement('tr')

      // Create a cell element for the key
      const keyCell = document.createElement('td')
      keyCell.textContent = course
      row.appendChild(keyCell)

      // Create a cell element for the value
      const valueCell = document.createElement('td')
      const previousCount = semesterCount - (futureCountMap.get(course) || 0)
      valueCell.textContent = previousCount + '/' + semesterCount
      row.appendChild(valueCell)

      const nextCell = document.createElement('td')
      nextCell.innerHTML = nextOccurences.get(course) || '-'
      row.appendChild(nextCell)

      // Add the row to the table
      table.appendChild(row)
    }

    // Add the table to the beginning of the resultDiv
    resultDiv.insertBefore(table, resultDiv.firstChild)
  })
}

/**
 * Return true if the given tr contains the given group OR supergroup
 * Eg. D2.C or D2
 */
function getIfContainsGroup (tr, group) {
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

/**
 * Count the occurrences of <UndervisningsTyp> in the given elements
 * for the given student group.
 * e.g. 'Föreläsning' or 'Laboration'.
 * @param {HTMLCollection} tableRowElements - The table row elements to search for activities.
 * @param {string} inputGroup - The student group to filter by (optional).
 * @returns {Map} - A map of activity names to their counts.
 */
function getActivityCountMap (tableRowElements, inputGroup) {
  const countMap = new Map()

  // Increment the count of the given activity
  function incrementActivity (activity) {
    countMap.set(activity, (countMap.get(activity) || 0) + 1)
  }

  let previousTr = null
  for (const tr of tableRowElements) {
    const currentActivity = tr.children[3].textContent.trim()
    // Skip empty rows
    if (!currentActivity) {
      continue
    }
    // Skip rows that don't contain the given group
    if (inputGroup && !getIfContainsGroup(tr, inputGroup)) {
      continue
    }

    const previousGroup = previousTr?.children[7]?.textContent ?? ''
    const currentGroup = tr.children[7].textContent
    const sameGroup = currentGroup === previousGroup

    const previousActivity = previousTr?.children[3]?.textContent.trim() ?? ''
    const currentTime = tr.children[1].textContent.trim()
    const previousTime = previousTr?.children[1]?.textContent.trim() ?? ''
    const sameDay = tr.previousElementSibling === previousTr

    // Skip overlapping activites when group is defined
    if (
      inputGroup &&
      sameDay &&
      currentTime === previousTime &&
      currentActivity === previousActivity &&
      sameGroup
    ) {
      continue
    }

    incrementActivity(currentActivity)
    previousTr = tr
  }

  return countMap
}

/**
 * Toggle the visibility of the urls.
 */
function toggleUrls () {
  document.getElementById('semesterUrlDiv').classList.toggle('hidden')
  document.getElementById('futureUrlDiv').classList.toggle('hidden')
}

function storeHistory (courseInput, groupInput) {
  const searchHistory = JSON.parse(
    localStorage.getItem('searchHistory') || '[]'
  )

  // Add the current search to the search history
  const currentSearch = {
    course: courseInput.value.toUpperCase(),
    group: groupInput.value.toUpperCase()
  }

  // Check if the current search already exists in the history
  const alreadyExists = searchHistory.some(
    search =>
      search.course === currentSearch.course &&
      search.group === currentSearch.group
  )

  // If no results were found, don't add the search to the history
  const table = document.querySelector('#resultDiv > table')

  if (alreadyExists || !table) {
    return
  }

  searchHistory.unshift(currentSearch)

  // Store only the three latest searches in localStorage
  localStorage.setItem(
    'searchHistory',
    JSON.stringify(searchHistory.slice(0, 3))
  )
}

function showHistory (courseInput, groupInput) {
  const searchHistory = JSON.parse(
    localStorage.getItem('searchHistory') || '[]'
  )
  const suggestionsDiv = document.getElementById('suggestions')
  suggestionsDiv.innerHTML = ''
  searchHistory.forEach((search, index) => {
    const suggestion = document.createElement('a')
    const groupText = search.group ? `(${search.group})` : ''
    suggestion.textContent = `${search.course}` + groupText
    suggestion.style.cursor = 'pointer' // add pointer cursor on hover
    suggestion.addEventListener('click', () => {
      courseInput.value = search.course
      groupInput.value = search.group
    })
    suggestionsDiv.appendChild(suggestion)
  })
}
