// Project name and subheadline
const projectName = "Tesla Incident Tracker";
const projectSubheadline = "A public tool built by a Tesla lover to help people stay informed.";

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

// Extract news source name from the title
function extractSourceName(title) {
    // List of known news sources
    const knownSources = [
        'CNN', 'CBS News', 'ABC News', 'Forbes', 'The Guardian', 'AP News', 'Teslarati', 'Electrek',
        'Business Insider', 'The Washington Post', 'NBC News', 'The New York Times', 'USA Today',
        'Firstpost', 'LiveNOW from FOX', 'CSIS', 'NPR', 'LA Times', 'El País', 'Statesman Journal',
        'Kansas City Star', 'KSHB', 'KTVZ', 'DOJ SC', 'DOJ Colorado', 'Boston.com'
    ];
    // Split the title into words
    const words = title.split(' ');
    // Check if the first word or a combination of words matches a known source
    for (let i = 0; i < words.length; i++) {
        const potentialSource = words.slice(0, i + 1).join(' ');
        if (knownSources.includes(potentialSource)) {
            return potentialSource;
        }
    }
    // Fallback: Use the first word if no match is found
    return words[0];
}

// Display incidents as cards
function displayIncidents(incidents) {
    const incidentsContainer = document.getElementById('incidents');
    incidentsContainer.innerHTML = ''; // Clear existing cards
    incidents.forEach(incident => {
        const card = document.createElement('div');
        card.className = 'incident-card';
        let html = `
            <h3 class="text-lg font-archivo-black">${formatDate(incident.date)} - ${incident.type}</h3>
            <p class="font-montserrat"><strong>Location:</strong> ${incident.location}</p>
            <p class="font-montserrat">${incident.description}</p>
            <p class="font-montserrat"><strong>News Links:</strong> ${incident.newsLinks.map(link => {
                const sourceName = extractSourceName(link.title);
                return `<a href="${link.url}" target="_blank" class="text-red-500 hover:underline">${sourceName}</a>`;
            }).join(', ')}</p>
        `;
        if (!incident.verified) {
            html += `<p class="disclaimer">⚠️ *This incident has not yet been independently verified.*</p>`;
        }
        card.innerHTML = html;
        incidentsContainer.appendChild(card);
    });
}

// Update the latest incident ticker
function updateTicker(incidents) {
    const tickerContent = document.getElementById('ticker-content');
    const tickerContentDuplicate = document.getElementById('ticker-content-duplicate');
    const latestIncident = incidents[0]; // Already sorted newest to oldest in incidents.json
    const tickerText = `Latest Incident: ${formatDate(latestIncident.date)} - ${latestIncident.location} - ${latestIncident.type} - ${latestIncident.description}`;
    tickerContent.textContent = tickerText;
    tickerContentDuplicate.textContent = tickerText; // Duplicate the content for seamless looping
}

// Filter and sort incidents
document.getElementById('type-filter').addEventListener('change', filterAndSort);
document.getElementById('verified-filter').addEventListener('change', filterAndSort);
document.getElementById('sort-order').addEventListener('change', filterAndSort);

function filterAndSort() {
    let filteredIncidents = [...window.incidents];
    const typeFilter = document.getElementById('type-filter').value;
    const verifiedFilter = document.getElementById('verified-filter').value;
    const sortOrder = document.getElementById('sort-order').value;

    // Filter by type
    if (typeFilter !== 'all') {
        filteredIncidents = filteredIncidents.filter(incident => incident.type === typeFilter);
    }

    // Filter by verification status
    if (verifiedFilter === 'verified') {
        filteredIncidents = filteredIncidents.filter(incident => incident.verified);
    } else if (verifiedFilter === 'unverified') {
        filteredIncidents = filteredIncidents.filter(incident => !incident.verified);
    }

    // Sort by date
    if (sortOrder !== 'newest') {
        filteredIncidents.sort((a, b) => {
            const dateA = new Date(a.date + 'T00:00:00Z');
            const dateB = new Date(b.date + 'T00:00:00Z');
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }

    // Log the sorted incidents for debugging
    console.log('Sorted incidents:', filteredIncidents.map(incident => `${incident.date} - ${incident.type}`));

    displayIncidents(filteredIncidents);
    updateTicker(filteredIncidents);
    window.currentFilteredIncidents = filteredIncidents; // Store filtered incidents for export
}

// Convert incidents to CSV format
function convertToCSV(incidents) {
    const headers = ['Date', 'Location', 'Type', 'Description', 'News Links', 'Verified'];
    const rows = incidents.map(incident => {
        const newsLinks = incident.newsLinks.map(link => `${extractSourceName(link.title)}: ${link.url}`).join('; ');
        return [
            formatDate(incident.date),
            incident.location,
            incident.type,
            `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes in description
            `"${newsLinks.replace(/"/g, '""')}"`, // Escape quotes in news links
            incident.verified ? 'Yes' : 'No'
        ];
    });
    return [
        `# ${projectName}`,
        `# ${projectSubheadline}`,
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
    doc.text(projectName, 10, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text(projectSubheadline, 10, yPos);
    yPos += 15; // Add extra spacing for readability

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
                const sourceName = extractSourceName(link.title);
                doc.text(`${sourceName}: ${link.url}`, 10, yPos, { maxWidth: 180 });
                yPos += 7;
            });
        }
        if (!incident.verified) {
            doc.text('⚠️ This incident has not yet been independently verified.', 10, yPos);
            yPos += 7;
        }
    });

    doc.save(filename);
}

// Export filtered incidents
document.getElementById('export-btn').addEventListener('click', () => {
    const filteredIncidents = window.currentFilteredIncidents || window.incidents;
    const typeFilter = document.getElementById('type-filter').value;
    const exportFormat = document.getElementById('export-format').value;
    const baseFilename = typeFilter === 'all' ? 'tesla-incident-tracker-all' : `tesla-incident-tracker-${typeFilter.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`;
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
const themeToggleMobile = document.getElementById('theme-toggle-mobile');
const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
    themeToggle.textContent = currentTheme === 'light' ? 'Toggle Dark/Light Mode' : 'Toggle Dark/Light Mode';
    themeToggleMobile.textContent = currentTheme === 'light' ? 'Toggle Dark/Light Mode' : 'Toggle Dark/Light Mode';
};
themeToggle.addEventListener('click', toggleTheme);
themeToggleMobile.addEventListener('click', toggleTheme);

// Hamburger menu toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const hamburgerMenu = document.getElementById('hamburger-menu');
hamburgerBtn.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('hidden');
});

// Submission modal
const submitBtnTop = document.getElementById('submit-btn-top');
const submitBtnMobile = document.getElementById('submit-btn-mobile');
const submitBtnBottom = document.getElementById('submit-btn-bottom');
const submitModal = document.getElementById('submit-modal');
const closeModal = document.getElementById('close-modal');
const submitViaEmail = document.getElementById('submit-via-email');
const submitViaGitHub = document.getElementById('submit-via-github');

submitBtnTop.addEventListener('click', () => {
    submitModal.classList.remove('hidden');
});

submitBtnMobile.addEventListener('click', () => {
    submitModal.classList.remove('hidden');
    hamburgerMenu.classList.add('hidden');
    // Scroll to the bottom submit button
    submitBtnBottom.scrollIntoView({ behavior: 'smooth' });
});

submitBtnBottom.addEventListener('click', () => {
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
