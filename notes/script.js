let notesData = {};
let allNotebooks = [];
let isSearchMode = false;
let currentFolder = null;
let localNotesData = null; // Store the loaded JSON data

async function fetchData(url) {
  // Load local notes.json file instead of making API calls
  if (!localNotesData) {
    try {
      const response = await fetch('./notes.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      localNotesData = await response.json();
    } catch (error) {
      console.error("Error loading notes.json:", error);
      throw error;
    }
  }

  // Simulate different API endpoints based on the URL
  if (url.startsWith('/folders/')) {
    return getFoldersData(url);
  } else if (url.includes('/search/')) {
    return getSearchData(url);
  } else if (url.includes('/random/')) {
    return getRandomData();
  } else if (url.startsWith('/notes/')) {
    return getNotesData(url);
  }
  
  throw new Error(`Unknown endpoint: ${url}`);
}

function getFoldersData(url) {
  if (!localNotesData || !Array.isArray(localNotesData)) return { data: [] };
  
  // Extract unique folders from notes
  const folders = [...new Set(localNotesData.map(note => note.folder).filter(Boolean))];
  
  if (url.includes('/search/')) {
    // Filter folders based on search query
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const query = urlParams.get('q')?.toLowerCase() || '';
    const filteredFolders = folders.filter(folder => 
      folder.toLowerCase().includes(query)
    );
    return { data: filteredFolders.map(name => ({ name })) };
  }
  
  return { data: folders.map(name => ({ name })) };
}

function getNotesData(url) {
  if (!localNotesData || !Array.isArray(localNotesData)) return { results: [], count: 0 };
  
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const limit = parseInt(urlParams.get('limit')) || 100;
  
  const results = localNotesData.slice(0, limit);
  return {
    results: results,
    count: localNotesData.length
  };
}

function getSearchData(url) {
  if (!localNotesData || !Array.isArray(localNotesData)) return { data: [] };
  
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const query = urlParams.get('q')?.toLowerCase() || '';
  const folder = urlParams.get('folder');
  
  let filteredNotes = localNotesData;
  
  // Filter by folder if specified
  if (folder) {
    filteredNotes = filteredNotes.filter(note => note.folder === folder);
  }
  
  // Filter by search query if not just a space (used for folder-only searches)
  if (query && query.trim() !== '') {
    filteredNotes = filteredNotes.filter(note => {
      const title = (note.title || '').toLowerCase();
      const body = (note.body || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      return title.includes(query) || body.includes(query) || content.includes(query);
    });
  }
  
  return { data: filteredNotes };
}

function getRandomData() {
  if (!localNotesData || !Array.isArray(localNotesData) || localNotesData.length === 0) {
    throw new Error("No notes available");
  }
  
  const randomIndex = Math.floor(Math.random() * localNotesData.length);
  const randomNote = localNotesData[randomIndex];
  
  return { data: randomNote };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function displayNotes() {
  const notesContainer = document.getElementById("notes-container");
  // Handle different response structures consistently
  let notes;
  let totalCount;
  
  if (isSearchMode) {
    // Search endpoints return {data: [...]}
    notes = notesData.data || [];
    totalCount = notes.length;
  } else {
    // Regular notes endpoint returns {results: [...], count: number}
    notes = notesData.results || [];
    totalCount = notesData.count || notes.length;
  }

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
            Showing all ${notes.length} notes from "${escapeHtml(currentFolder)}"
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
            Showing ${notes.length} of ${totalCount} notes
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
                    ${escapeHtml(folderName)}
                </div>
            </div>
            <div class="note-content">${escapeHtml(noteContent)}</div>
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
    option.textContent = folder.name; // textContent automatically escapes HTML
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
    if (selectedNotebook || query) {
      if (selectedNotebook && !query) {
        // Get all notes from a specific folder using search with a space character
        // This works because most notes contain spaces
        isSearchMode = true;
        currentFolder = selectedNotebook;
        let searchUrl = "/notes/search/?q=" + encodeURIComponent(" ");
        searchUrl += `&folder=${encodeURIComponent(selectedNotebook)}`;
        response = await fetchData(searchUrl);
      } else {
        // Search notes with query and optional folder filter
        isSearchMode = true;
        currentFolder = selectedNotebook || null;
        let searchUrl = "/notes/search/?q=" + encodeURIComponent(query);
        if (selectedNotebook) {
          searchUrl += `&folder=${encodeURIComponent(selectedNotebook)}`;
        }
        response = await fetchData(searchUrl);
      }
      
      if (response) {
        notesData = response;
      } else {
        throw new Error("No response received from search endpoint");
      }
    } else {
      // No search criteria - get all notes
      isSearchMode = false;
      currentFolder = null;
      response = await fetchData("/notes/?limit=100");
      
      if (response) {
        notesData = response;
      } else {
        throw new Error("No response received from notes endpoint");
      }
    }

    displayNotes();
  } catch (error) {
    console.error("Search error:", error);
    notesContainer.innerHTML = `
              <div class="note" style="color: var(--error-color)">
                  <i class="fas fa-exclamation-circle"></i>
                  Error performing search. Please try again later.
                  <br><small>Details: ${escapeHtml(error.message)}</small>
              </div>
          `;
  }
}

async function filterNotebooks() {
  const notebookDropdown = document.getElementById("search-notebook");
  const notebookQuery = document.getElementById("notebook-query").value.trim();

  notebookDropdown.innerHTML = '<option value="">Loading...</option>';

  try {
    let response;
    if (notebookQuery) {
      response = await fetchData(
        `/folders/search/?q=${encodeURIComponent(notebookQuery)}`
      );
    } else {
      response = await fetchData("/folders/");
    }
    
    if (response && response.data && Array.isArray(response.data)) {
      allNotebooks = response.data.map((folder) => ({
        id: folder.name,
        name: folder.name,
      }));
    } else {
      console.warn("Unexpected response structure:", response);
      allNotebooks = [];
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
    
    if (response && response.data) {
      notesData = { data: [response.data] };
    } else {
      throw new Error("No random note received from API");
    }
    
    displayNotes();
  } catch (error) {
    console.error("Random note error:", error);
    notesContainer.innerHTML = `
            <div class="note" style="color: var(--error-color)">
                <i class="fas fa-exclamation-circle"></i>
                Error fetching random note. Please try again later.
                <br><small>Details: ${escapeHtml(error.message)}</small>
            </div>
        `;
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
    
    // Load and process local data
    await fetchData("/notes/"); // This will load the JSON file
    
    // Fetch folders
    const foldersResponse = await fetchData("/folders/");
    if (foldersResponse && foldersResponse.data && Array.isArray(foldersResponse.data)) {
      allNotebooks = foldersResponse.data.map((folder) => ({
        id: folder.name,
        name: folder.name,
      }));
    } else {
      console.warn("Unexpected folders response structure:", foldersResponse);
      allNotebooks = [];
    }

    // Fetch initial notes - get all notes without pagination
    const notesResponse = await fetchData("/notes/?limit=100");
    if (notesResponse) {
      notesData = notesResponse;
    } else {
      throw new Error("No response received from notes endpoint");
    }

    // Update UI
    populateNotebooksDropdown();
    displayNotes();
  } catch (error) {
    console.error("Initialization error:", error);
    notesContainer.innerHTML = `
            <div class="note" style="color: var(--error-color)">
                <i class="fas fa-exclamation-circle"></i>
                Error loading notes. Please check if notes.json exists in the directory.
                <br><small>Details: ${escapeHtml(error.message)}</small>
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
