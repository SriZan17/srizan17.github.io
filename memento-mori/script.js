// Birth date and death date
const birthDate = new Date('2004-04-29');
const deathDate = new Date('2087-04-29');

// Today's date
const today = new Date();

// Total lifespan in milliseconds
const totalLifeSpan = deathDate - birthDate;

// Life passed in milliseconds
const lifePassed = today - birthDate;

// Percentage of life passed
const percentagePassed = (((lifePassed) / totalLifeSpan) * 100)+1.2;

// Days passed and days remaining
const daysPassed = Math.floor(lifePassed / (1000 * 60 * 60 * 24));
const daysRemaining = Math.floor((deathDate - today) / (1000 * 60 * 60 * 24));

// Update circle percentage and text content
document.documentElement.style.setProperty('--percentage', percentagePassed.toFixed(2));
document.getElementById('percentage').innerText = percentagePassed.toFixed(2) + "%";
document.getElementById('daysPassed').innerText = `Days passed: ${daysPassed}`;
document.getElementById('daysRemaining').innerText = `Days remaining: ${daysRemaining}`;
