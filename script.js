// Load incidents from incidents.json
fetch('incidents.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load incidents.json');
        }
        return response.json();
    })
    .then(data => {
        window.incidents = data; // Store incidents globally (already sorted newest to oldest in incidents.json)
        displayIncidents(data); // Initial display
        updateTicker(data); // Update the latest incident ticker
    })
    .catch(error => {
        console.error('Error loading incidents:', error);
        const incidentsContainer = document.getElementById('incidents');
        incidentsContainer.innerHTML = '<p class="text-red-500">Error loading incidents. Please try again later.</p>';
    });

// Format date as "Mar 7, 2025" using UTC to avoid timezone shifts
function formatDate(dateString) {
    try {
        const date = new Date(dateString + 'T00:00:00Z'); // Parse as UTC
        if (isNaN(date)) {
            throw new Error('Invalid date');
        }
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        return `${month} ${day}, ${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Fallback to original string if formatting fails
    }
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
            <p class="font-montserrat"><strong>Additional Sources:</strong> ${incident.additionalSources}</p>
        `;
        incidentsContainer.appendChild(card);
    });
}

// Update the latest incident ticker
function updateTicker(incidents) {
    const ticker = document.getElementById('ticker');
    const latestIncident = incidents[0]; // Already sorted newest to oldest in incidents.json
    const tickerText = `Latest Incident: ${formatDate(latestIncident.date)} - ${latestIncident.location} - ${latestIncident.type} - ${latestIncident.description}`;
    ticker.innerHTML = `<div class="ticker-content">${tickerText}</div>`;
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
        // Sort by date only if a specific type is selected
        filteredIncidents.sort((a, b) => {
            const dateA = new Date(a.date + 'T00:00:00Z');
            const dateB = new Date(b.date + 'T00:00:00Z');
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    } else {
        // For "All Types", preserve the initial order from incidents.json unless the user changes the sort order
        if (sortOrder !== 'newest') {
            filteredIncidents.sort((a, b) => {
                const dateA = new Date(a.date + 'T00:00:00Z');
                const dateB = new Date(b.date + 'T00:00:00Z');
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
        }
    }

    // Log the sorted incidents for debugging
    console.log('Sorted incidents:', filteredIncidents.map(incident => `${incident.date} - ${incident.type}`));

    displayIncidents(filteredIncidents);
    updateTicker(filteredIncidents);
    window.currentFilteredIncidents = filteredIncidents; // Store filtered incidents for export
}

// Convert incidents to CSV format
function convertToCSV(incidents) {
    const headers = ['Date', 'Location', 'Type', 'Description', 'News Links', 'Additional Sources'];
    const rows = incidents.map(incident => {
        const newsLinks = incident.newsLinks.map(link => `${link.title}: ${link.url}`).join('; ');
        return [
            formatDate(incident.date),
            incident.location,
            incident.type,
            `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes in description
            `"${newsLinks.replace(/"/g, '""')}"`, // Escape quotes in news links
            `"${incident.additionalSources.replace(/"/g, '""')}"` // Escape quotes in additional sources
        ];
    });
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// Export filtered incidents to PDF
function exportToPDF(incidents, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(16);
    doc.text('Tesla Vandalism and Attacks Tracker', 10, yPos);
    yPos += 10;

    doc.setFontSize(12);
    incidents.forEach((incident, index) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 10;
        }
        doc.text(`${index + 1}. ${formatDate(incident.date)} - ${incident.type}`, 10, yPos);
        yPos += 7;
        doc.text(`Location: ${incident.location}`, 10, yPos);
        yPos += 7;
        doc.text(`Description: ${incident.description}`, 10, yPos, { maxWidth: 180 });
        yPos += 10;
        if (incident.newsLinks.length > 0) {
            doc.text('News Links:', 10, yPos);
            yPos += 7;
            incident.newsLinks.forEach(link => {
                doc.text(`${link.title}: ${link.url}`, 10, yPos, { maxWidth: 180 });
                yPos += 7;
            });
        }
        doc.text(`Additional Sources: ${incident.additionalSources}`, 10, yPos);
        yPos += 10;
    });

    doc.save(filename);
}

// Export filtered incidents
document.getElementById('export-btn').addEventListener('click', () => {
    const filteredIncidents = window.currentFilteredIncidents || window.incidents;
    const typeFilter = document.getElementById('type-filter').value;
    const exportFormat = document.getElementById('export-format').value;
    const baseFilename = typeFilter === 'all' ? 'tesla-vandalism-incidents-all' : `tesla-vandalism-incidents-${typeFilter.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`;
    let blob, filename;

    if (exportFormat === 'csv') {
        const csvStr = convertToCSV(filteredIncidents);
        blob = new Blob([csvStr], { type: 'text/csv' });
        filename = `${baseFilename}.csv`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (exportFormat === 'pdf') {
        exportToPDF(filteredIncidents, `${baseFilename}.pdf`);
    }
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
const closeModal = document.getElementById('submit-modal');
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
