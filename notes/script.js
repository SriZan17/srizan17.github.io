let notesData = {};
let allNotebooks = [];
let isSearchMode = false;
let currentFolder = null;

async function fetchData(url) {
  const baseUrl = "http://34.171.46.200:8000";
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
    // Reset state
    currentFolder = null;
    isSearchMode = false;
    
    // Fetch folders
    const foldersResponse = await fetchData("/folders/");
    allNotebooks = foldersResponse.data.map((folder) => ({
      id: folder.name,
      name: folder.name,
    }));

    // Fetch initial notes - get all notes without pagination
    const notesResponse = await fetchData("/notes/?limit=100");
    notesData = notesResponse;

    // Update UI
    populateNotebooksDropdown();
    displayNotes();
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
  
  // Show count information
  if (isSearchMode && currentFolder) {
    notesContainer.innerHTML = `
        <div class="note-count">
            Showing all ${notes.length} notes from "${currentFolder}"
        </div>
    `;
  } else if (isSearchMode) {
    notesContainer.innerHTML = `
        <div class="note-count">
            Found ${notes.length} notes
        </div>
    `;
  } else {
    notesContainer.innerHTML = `
        <div class="note-count">
            Showing ${notes.length} of ${notesData.count} notes
        </div>
    `;
  }

  notes.forEach((note) => {
    const noteElement = document.createElement("div");
    noteElement.className = "note";
    
    // Handle the backend structure: title contains the quote/content, body is usually empty
    const noteContent = note.title || note.body || note.content || '';
    const folderName = note.folder || note.notebook_name || 'Unknown';
    
    noteElement.innerHTML = `
            <div class="note-header">
                <div class="notebook-name">
                    <i class="fas fa-folder"></i>
                    ${folderName}
                </div>
            </div>
            <div class="note-content">${noteContent}</div>
        `;
    notesContainer.appendChild(noteElement);
  });
}

function populateNotebooksDropdown() {
  const notebookDropdown = document.getElementById("search-notebook");
  notebookDropdown.innerHTML = '<option value="">All Folders</option>';

  allNotebooks.forEach((folder) => {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = folder.name;
    notebookDropdown.appendChild(option);
  });
}

async function searchNotes() {
  const notesContainer = document.getElementById("notes-container");
  const query = document.getElementById("search-query").value.trim();
  const selectedNotebook = document.getElementById("search-notebook").value;

  notesContainer.innerHTML =
    '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i>Searching...</div>';

  try {
    let response;
    if (query || selectedNotebook) {
      if (selectedNotebook && !query) {
        // Get all notes from a specific folder
        isSearchMode = true;
        currentFolder = selectedNotebook;
        response = await fetchData(`/folders/${encodeURIComponent(selectedNotebook)}`);
        const folderData = response.data;
        const notesWithFolder = folderData.notes.map((note) => ({
          ...note,
          folder: folderData.folder_name,
        }));
        notesData = { data: notesWithFolder };
      } else {
        // Search notes with query and optional folder filter
        isSearchMode = true;
        currentFolder = null;
        let searchUrl = "/notes/search/?q=" + encodeURIComponent(query || "");
        if (selectedNotebook) {
          searchUrl += `&folder=${encodeURIComponent(selectedNotebook)}`;
        }
        response = await fetchData(searchUrl);
        notesData = response;
      }
    } else {
      isSearchMode = false;
      currentFolder = null;
      response = await fetchData("/notes/?limit=100");
      notesData = response;
    }

    displayNotes();
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
        `/folders/search/?q=${encodeURIComponent(notebookQuery)}`
      );
      allNotebooks = response.data.map((folder) => ({
        id: folder.name,
        name: folder.name,
      }));
    } else {
      const response = await fetchData("/folders/");
      allNotebooks = response.data.map((folder) => ({
        id: folder.name,
        name: folder.name,
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
