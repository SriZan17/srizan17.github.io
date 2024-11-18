let notesData = {};
let allNotebooks = [];
let currentPage = 1;
let totalPages = 1;
let currentNextUrl = null;
let currentPrevUrl = null;
let notesPerPage = 50;
let isSearchMode = false;

async function fetchData(url) {
  const baseUrl = "https://notesandquotes.0xss.us";
  try {
    const response = await fetch(baseUrl + url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

async function initializeData() {
  const notesContainer = document.getElementById("notes-container");
  notesContainer.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i>Loading notes...</div>';

  try {
    // Fetch notebooks
    const notebooksResponse = await fetchData("/notebooks/");
    allNotebooks = notebooksResponse.data.map((notebook) => ({
      id: notebook.id,
      name: notebook.name,
    }));

    // Fetch initial notes
    const notesResponse = await fetchData("/notes/");
    updateNotesData(notesResponse);

    // Update UI
    populateNotebooksDropdown();
    displayNotes();
    updatePaginationControls();
  } catch (error) {
    console.error("Initialization error:", error);
    notesContainer.innerHTML = `
            <div class="note" style="color: var(--error-color)">
                <i class="fas fa-exclamation-circle"></i>
                Error loading notes. Please try again later.
            </div>
        `;
  }
}

function updateNotesData(response) {
  notesData = response;
  if (!isSearchMode) {
    totalPages = Math.ceil(response.count / notesPerPage);
    currentNextUrl = response.next
      ? new URL(response.next).pathname + new URL(response.next).search
      : null;
    currentPrevUrl = response.previous
      ? new URL(response.previous).pathname + new URL(response.previous).search
      : null;
  } else {
    // For search results
    totalPages = 1;
    currentNextUrl = null;
    currentPrevUrl = null;
  }
}

async function changePage(direction) {
  if (isSearchMode) return;

  const notesContainer = document.getElementById("notes-container");
  notesContainer.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i>Loading notes...</div>';

  try {
    let url;
    if (direction === "next" && currentNextUrl) {
      url = currentNextUrl;
      currentPage++;
    } else if (direction === "prev" && currentPrevUrl) {
      url = currentPrevUrl;
      currentPage--;
    } else {
      return;
    }

    const response = await fetchData(url);
    updateNotesData(response);
    displayNotes();
    updatePaginationControls();
  } catch (error) {
    console.error("Pagination error:", error);
    notesContainer.innerHTML = `
            <div class="note" style="color: var(--error-color)">
                <i class="fas fa-exclamation-circle"></i>
                Error loading notes. Please try again later.
            </div>
        `;
  }
}

function updatePaginationControls() {
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");

  prevButton.disabled = !currentPrevUrl || isSearchMode;
  nextButton.disabled = !currentNextUrl || isSearchMode;

  if (isSearchMode) {
    pageInfo.textContent = "Search Results";
  } else {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

function displayNotes() {
  const notesContainer = document.getElementById("notes-container");
  const notes = isSearchMode ? notesData.data : notesData.results;

  if (!notes || notes.length === 0) {
    notesContainer.innerHTML = `
            <div class="note">
                <div class="note-content">
                    <i class="fas fa-search"></i>
                    No notes found. Try adjusting your search criteria.
                </div>
            </div>
        `;
    return;
  }

  notesContainer.innerHTML = "";
  if (!isSearchMode) {
    notesContainer.innerHTML = `
        <div class="note-count">
            Showing ${(currentPage - 1) * notesPerPage + 1} - ${Math.min(
      currentPage * notesPerPage,
      notesData.count
    )} 
            of ${notesData.count} notes
        </div>
    `;
  }

  notes.forEach((note) => {
    const noteElement = document.createElement("div");
    noteElement.className = "note";
    noteElement.innerHTML = `
            <div class="note-header">
                <div class="notebook-name">
                    <i class="fas fa-book"></i>
                    ${note.notebook_name}
                </div>
            </div>
            <div class="note-content">${note.content}</div>
        `;
    notesContainer.appendChild(noteElement);
  });
}

function populateNotebooksDropdown() {
  const notebookDropdown = document.getElementById("search-notebook");
  notebookDropdown.innerHTML = '<option value="">All Notebooks</option>';

  allNotebooks.forEach((notebook) => {
    const option = document.createElement("option");
    option.value = notebook.id;
    option.textContent = notebook.name;
    notebookDropdown.appendChild(option);
  });
}

async function searchNotes() {
  const notesContainer = document.getElementById("notes-container");
  const query = document.getElementById("search-query").value.trim();
  const selectedNotebook = document.getElementById("search-notebook").value;

  notesContainer.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i>Searching...</div>';
  currentPage = 1;

  try {
    let response;
    if (query || selectedNotebook) {
      isSearchMode = true;
      if (selectedNotebook && !query) {
        response = await fetchData(`/notebooks/${selectedNotebook}`);
        const notebookName = response.data.name;
        const notesWithNotebook = response.data.notes.map((note) => ({
          ...note,
          notebook_name: notebookName,
        }));
        notesData = { data: notesWithNotebook };
      } else {
        let searchUrl = "/notes/search/?q=" + encodeURIComponent(query || "");
        if (selectedNotebook) {
          searchUrl += `&notebook=${selectedNotebook}`;
        }
        response = await fetchData(searchUrl);
        notesData = response;
      }
    } else {
      isSearchMode = false;
      response = await fetchData("/notes/");
      updateNotesData(response);
    }

    displayNotes();
    updatePaginationControls();
  } catch (error) {
    console.error("Search error:", error);
    notesContainer.innerHTML = `
              <div class="note" style="color: var(--error-color)">
                  <i class="fas fa-exclamation-circle"></i>
                  Error performing search. Please try again later.
              </div>
          `;
  }
}

async function filterNotebooks() {
  const notebookDropdown = document.getElementById("search-notebook");
  const notebookQuery = document.getElementById("notebook-query").value.trim();

  notebookDropdown.innerHTML = '<option value="">Loading...</option>';

  try {
    if (notebookQuery) {
      const response = await fetchData(
        `/notebooks/search/?q=${encodeURIComponent(notebookQuery)}`
      );
      allNotebooks = response.data.map((notebook) => ({
        id: notebook.id,
        name: notebook.name,
      }));
    } else {
      const response = await fetchData("/notebooks/");
      allNotebooks = response.data.map((notebook) => ({
        id: notebook.id,
        name: notebook.name,
      }));
    }
    populateNotebooksDropdown();
  } catch (error) {
    console.error("Notebook filter error:", error);
    notebookDropdown.innerHTML =
      '<option value="">Error loading notebooks</option>';
  }
}

async function getRandomNote() {
  const notesContainer = document.getElementById("notes-container");
  notesContainer.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i>Finding a random note...</div>';

  try {
    isSearchMode = true;
    const response = await fetchData("/notes/random/");
    notesData = { data: [response.data] };
    displayNotes();
    updatePaginationControls();
  } catch (error) {
    console.error("Random note error:", error);
    notesContainer.innerHTML = `
            <div class="note" style="color: var(--error-color)">
                <i class="fas fa-exclamation-circle"></i>
                Error fetching random note. Please try again later.
            </div>
        `;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.onload = () => {
  initializeData();
};

document
  .getElementById("search-query")
  .addEventListener("input", debounce(searchNotes, 300));
document
  .getElementById("notebook-query")
  .addEventListener("input", debounce(filterNotebooks, 300));
document
  .getElementById("search-notebook")
  .addEventListener("change", searchNotes);
