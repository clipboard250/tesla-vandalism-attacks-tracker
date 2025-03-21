// Load incidents from incidents.json
fetch('incidents.json')
    .then(response => response.json())
    .then(data => {
        window.incidents = data; // Store incidents globally
        displayIncidents(data); // Initial display
        updateTicker(data); // Update the latest incident ticker
        createChart(data); // Create the chart
    });

// Display incidents as cards
function displayIncidents(incidents) {
    const incidentsContainer = document.getElementById('incidents');
    incidentsContainer.innerHTML = ''; // Clear existing cards
    incidents.forEach(incident => {
        const card = document.createElement('div');
        card.className = 'incident-card';
        card.innerHTML = `
            <h3 class="text-lg font-archivo-black">${incident.date} - ${incident.type}</h3>
            <p class="font-montserrat"><strong>Location:</strong> ${incident.location}</p>
            <p class="font-montserrat">${incident.description}</p>
            <p class="font-montserrat"><strong>News Links:</strong> ${incident.newsLinks.map(link => `<a href="${link.url}" class="text-red-500 hover:underline">${link.title}</a>`).join(', ')}</p>
            <p class="font-montserrat"><strong>Screenshots:</strong> ${incident.screenshotLinks}</p>
            <p class="font-montserrat"><strong>Additional Sources:</strong> ${incident.additionalSources}</p>
        `;
        incidentsContainer.appendChild(card);
    });
}

// Update the latest incident ticker
function updateTicker(incidents) {
    const latestIncident = incidents.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const ticker = document.getElementById('ticker');
    ticker.innerHTML = `Latest Incident: ${latestIncident.date} - ${latestIncident.location} - ${latestIncident.type} - ${latestIncident.description}`;
}

// Create a chart of incidents by type
function createChart(incidents) {
    const types = [...new Set(incidents.map(incident => incident.type))];
    const counts = types.map(type => incidents.filter(incident => incident.type === type).length);
    const ctx = document.getElementById('incident-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: types,
            datasets: [{
                label: 'Number of Incidents',
                data: counts,
                backgroundColor: '#e82127', // Tesla Red
                borderColor: '#c91b22',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Filter and sort incidents
document.getElementById('type-filter').addEventListener('change', filterAndSort);
document.getElementById('sort-order').addEventListener('change', filterAndSort);

function filterAndSort() {
    let filteredIncidents = [...window.incidents];
    const typeFilter = document.getElementById('type-filter').value;
    const sortOrder = document.getElementById('sort-order').value;

    // Filter by type
    if (typeFilter !== 'all') {
        filteredIncidents = filteredIncidents.filter(incident => incident.type === typeFilter);
    }

    // Sort by date
    filteredIncidents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    displayIncidents(filteredIncidents);
}

// Dark/Light mode toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
    themeToggle.textContent = currentTheme === 'light' ? 'Toggle Dark/Light Mode' : 'Toggle Dark/Light Mode';
});

// Submission modal
const submitBtn = document.getElementById('submit-btn');
const submitModal = document.getElementById('submit-modal');
const closeModal = document.getElementById('close-modal');
const submitViaEmail = document.getElementById('submit-via-email');
const submitViaGitHub = document.getElementById('submit-via-github');

submitBtn.addEventListener('click', () => {
    submitModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    submitModal.classList.add('hidden');
});

submitViaEmail.addEventListener('click', () => {
    const date = document.getElementById('submit-date').value;
    const location = document.getElementById('submit-location').value;
    const type = document.getElementById('submit-type').value;
    const description = document.getElementById('submit-description').value;
    const sources = document.getElementById('submit-sources').value;
    const subject = encodeURIComponent('New Tesla Vandalism Incident Submission');
    const body = encodeURIComponent(`Date: ${date}\nLocation: ${location}\nType: ${type}\nDescription: ${description}\nSources: ${sources}`);
    window.location.href = `mailto:your-email@example.com?subject=${subject}&body=${body}`;
    submitModal.classList.add('hidden');
});

submitViaGitHub.addEventListener('click', () => {
    const date = document.getElementById('submit-date').value;
    const location = document.getElementById('submit-location').value;
    const type = document.getElementById('submit-type').value;
    const description = document.getElementById('submit-description').value;
    const sources = document.getElementById('submit-sources').value;
    const issueTitle = encodeURIComponent('New Incident Submission');
    const issueBody = encodeURIComponent(`**Date:** ${date}\n**Location:** ${location}\n**Type:** ${type}\n**Description:** ${description}\n**Sources:** ${sources}`);
    window.location.href = `https://github.com/clipboard250/tesla-vandalism-attacks-tracker/issues/new?title=${issueTitle}&body=${issueBody}`;
    submitModal.classList.add('hidden');
});
