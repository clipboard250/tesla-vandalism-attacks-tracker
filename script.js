// Load incidents from incidents.json
fetch('incidents.json')
    .then(response => response.json())
    .then(data => {
        window.incidents = data; // Store incidents globally
        displayIncidents(data); // Initial display
        updateTicker(data); // Update the latest incident ticker
    });

// Format date as "Mar 7, 2025"
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Display incidents as cards
function displayIncidents(incidents) {
    const incidentsContainer = document.getElementById('incidents');
    incidentsContainer.innerHTML = ''; // Clear existing cards
    incidents.forEach(incident => {
        const card = document.createElement('div');
        card.className = 'incident-card';
        card.innerHTML = `
            <h3 class="text-lg font-archivo-black">${formatDate(incident.date)} - ${incident.type}</h3>
            <p class="font-montserrat"><strong>Location:</strong> ${incident.location}</p>
            <p class="font-montserrat">${incident.description}</p>
            <p class="font-montserrat"><strong>News Links:</strong> ${incident.newsLinks.map(link => `<a href="${link.url}" target="_blank" class="text-red-500 hover:underline">${link.title}</a>`).join(', ')}</p>
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
    ticker.innerHTML = `Latest Incident: ${formatDate(latestIncident.date)} - ${latestIncident.location} - ${latestIncident.type} - ${latestIncident.description}`;
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
    window.currentFilteredIncidents = filteredIncidents; // Store filtered incidents for export
}

// Export filtered incidents as JSON
document.getElementById('export-btn').addEventListener('click', () => {
    const filteredIncidents = window.currentFilteredIncidents || window.incidents;
    const typeFilter = document.getElementById('type-filter').value;
    const filename = typeFilter === 'all' ? 'tesla-vandalism-incidents-all.json' : `tesla-vandalism-incidents-${typeFilter.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}.json`;
    const jsonStr = JSON.stringify(filteredIncidents, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

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
const submitViaGitHub = document "Submit a New Incident" button, and the modal form should now have visible text for all prompts (e.g., “Date:”, “Location:”, etc.) without needing to highlight them.
