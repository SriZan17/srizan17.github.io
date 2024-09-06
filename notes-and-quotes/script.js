let notesData = {}; // To store notes data
let allNotebooks = []; // To store all notebook names

// Fetch the notes from the JSON file
fetch('notes.json')
    .then(response => response.json())
    .then(data => {
        notesData = data;
        allNotebooks = Object.keys(data).sort(); // Sort notebooks alphabetically
        populateNotebooksDropdown();
        displayNotes(data);
    });

// Function to display all notes
function displayNotes(notes) {
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = '';

    Object.keys(notes).forEach(notebook => {
        notes[notebook].forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `
                <h3>Notebook: ${notebook}</h3>
                <p><strong>Note:</strong> ${note}</p>
            `;
            notesContainer.appendChild(noteElement);
        });
    });
}

// Populate the dropdown with the available notebooks
function populateNotebooksDropdown() {
    const notebookDropdown = document.getElementById('search-notebook');
    notebookDropdown.innerHTML = `<option value="">All Notebooks</option>`; // Default option for all notebooks

    allNotebooks.forEach(notebook => {
        const option = document.createElement('option');
        option.value = notebook;
        option.textContent = notebook;
        notebookDropdown.appendChild(option);
    });
}

// Function to handle search
function searchNotes() {
    const query = document.getElementById('search-query').value.toLowerCase();
    const selectedNotebook = document.getElementById('search-notebook').value;

    let filteredNotes = {};

    if (selectedNotebook) {
        // Search within a selected notebook
        filteredNotes[selectedNotebook] = notesData[selectedNotebook].filter(note => note.toLowerCase().includes(query));
    } else {
        // Search across all notebooks
        Object.keys(notesData).forEach(notebook => {
            filteredNotes[notebook] = notesData[notebook].filter(note => note.toLowerCase().includes(query));
        });
    }

    displayNotes(filteredNotes);
}

// Function to filter notebooks in the dropdown
function filterNotebooks() {
    const notebookQuery = document.getElementById('notebook-query').value.toLowerCase();
    const notebookDropdown = document.getElementById('search-notebook');
    
    notebookDropdown.innerHTML = `<option value="">All Notebooks</option>`; // Reset dropdown

    allNotebooks
        .filter(notebook => notebook.toLowerCase().includes(notebookQuery))
        .forEach(notebook => {
            const option = document.createElement('option');
            option.value = notebook;
            option.textContent = notebook;
            notebookDropdown.appendChild(option);
        });
}

// Fetch all notes on page load
window.onload = () => {
    fetchNotes();
};
