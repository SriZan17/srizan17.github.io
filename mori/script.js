// Default values
const DEFAULT_BIRTHDAY = '2004-04-29';
const DEFAULT_YEARS = 77;
const WEEKS_PER_YEAR = 52;

let birthDate = new Date(DEFAULT_BIRTHDAY);
let yearsOfLife = DEFAULT_YEARS;

// DOM elements
const birthdayInput = document.getElementById('birthday');
const yearsInput = document.getElementById('yearsOfLife');
const updateBtn = document.getElementById('updateBtn');
const weeksGrid = document.getElementById('weeksGrid');

// Initialize
birthdayInput.value = DEFAULT_BIRTHDAY;
yearsInput.value = DEFAULT_YEARS;

// Calculate total weeks in lifespan
function calculateTotalWeeks(years) {
  return years * WEEKS_PER_YEAR;
}

// Get current week number since birth
function getCurrentWeek() {
  const today = new Date();
  const diffTime = today - birthDate;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}

// Generate the years header
function generateYearsHeader() {
  const yearsHeader = document.getElementById('yearsHeader');
  yearsHeader.innerHTML = '';

  // Show every 5th year for readability
  for (let year = 0; year < yearsOfLife; year++) {
    const yearLabel = document.createElement('div');
    yearLabel.className = 'year-header-cell';
    if (year % 5 === 0 || year === yearsOfLife - 1) {
      yearLabel.textContent = year + 1;
    }
    yearsHeader.appendChild(yearLabel);
  }
}

// Generate the grid
function generateGrid() {
  weeksGrid.innerHTML = '';

  const totalWeeks = calculateTotalWeeks(yearsOfLife);
  const currentWeek = getCurrentWeek();
  const totalYears = yearsOfLife;

  // Generate years header
  generateYearsHeader();

  // Generate rows for each week (52 weeks per year)
  for (let week = 0; week < WEEKS_PER_YEAR; week++) {
    const row = document.createElement('div');
    row.className = 'week-row';

    // Week label
    const weekLabel = document.createElement('div');
    weekLabel.className = 'week-label-cell';
    if (week % 13 === 0 || week === WEEKS_PER_YEAR - 1) {
      weekLabel.textContent = week + 1;
    }
    row.appendChild(weekLabel);

    // Year boxes container (one box per year for this week)
    const yearBoxes = document.createElement('div');
    yearBoxes.className = 'year-boxes';

    for (let year = 0; year < totalYears; year++) {
      const yearBox = document.createElement('div');
      yearBox.className = 'week-box';

      const weekNumber = year * WEEKS_PER_YEAR + week;

      // Mark as lived if this week has passed
      if (weekNumber < currentWeek) {
        yearBox.classList.add('lived');
      }

      // Add tooltip
      const weekDate = new Date(birthDate);
      weekDate.setDate(weekDate.getDate() + weekNumber * 7);
      yearBox.title = `Week ${weekNumber + 1} (Year ${year + 1}, Week ${week + 1}) - ${weekDate.toLocaleDateString()}`;

      yearBox.addEventListener('click', () => handleWeekClick(weekDate));

      yearBoxes.appendChild(yearBox);
    }

    row.appendChild(yearBoxes);
    weeksGrid.appendChild(row);
  }
}

// Update button handler
updateBtn.addEventListener('click', () => {
  const newBirthday = new Date(birthdayInput.value);
  const newYears = parseInt(yearsInput.value, 10);

  if (isNaN(newBirthday.getTime())) {
    alert('Please enter a valid birthday.');
    return;
  }

  if (isNaN(newYears) || newYears < 1 || newYears > 120) {
    alert('Please enter a valid number of years (1-120).');
    return;
  }

  birthDate = newBirthday;
  yearsOfLife = newYears;
  generateGrid();
});

// Initial grid generation
let memories = [];

// Fetch memories manifest
fetch('memories.json')
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    return [];
  })
  .then(data => {
    memories = data;
    generateGrid();
  })
  .catch(err => {
    console.error('Error loading memories:', err);
    generateGrid();
  });

function findClosestMemory(targetDateStr) {
  if (!memories.length) return null;

  const targetDate = new Date(targetDateStr);
  let closestDate = memories[0];
  let minDiff = Math.abs(targetDate - new Date(closestDate));

  for (let i = 1; i < memories.length; i++) {
    const currentDate = memories[i];
    const diff = Math.abs(targetDate - new Date(currentDate));
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = currentDate;
    }
  }

  return closestDate;
}

function handleWeekClick(weekDate) {
  const dateStr = weekDate.toISOString().split('T')[0];

  // Check if exact date exists (not strictly necessary if we always want closest, but good for optimization)
  if (memories.includes(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    window.location.href = `memories/${y}/${m}/${d}/index.html`;
    return;
  }

  // Find closest date
  const closest = findClosestMemory(dateStr);
  if (closest) {
    const [y, m, d] = closest.split('-');
    window.location.href = `memories/${y}/${m}/${d}/index.html`;
  } else {
    console.log('No memories found');
  }
}

generateGrid();