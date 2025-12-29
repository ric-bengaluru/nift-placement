// Search functionality

class SearchManager {
    constructor() {
        this.modal = document.getElementById('search-modal');
        this.searchBtn = document.getElementById('search-btn');
        this.closeBtn = this.modal.querySelector('.close-btn');
        this.searchInput = document.getElementById('search-input');
        this.daySelect = document.getElementById('search-day-select');
        this.submitBtn = document.getElementById('search-submit-btn');
        this.resultsContainer = document.getElementById('search-results');
        
        this.currentDay = 1; // Default day
        
        this.init();
    }
    
    init() {
        // Open modal
        this.searchBtn.addEventListener('click', () => this.openModal());
        
        // Close modal
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Search on Enter key
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Search button
        this.submitBtn.addEventListener('click', () => this.performSearch());
        
        // Update current day from page context
        this.updateCurrentDay();
    }
    
    openModal() {
        this.modal.classList.remove('hidden');
        this.searchInput.focus();
        
        // Set day select based on current page
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage.includes('day')) {
            const day = currentPage.replace('day', '').replace('-page', '');
            this.daySelect.value = day;
        }
    }
    
    closeModal() {
        this.modal.classList.add('hidden');
        this.resultsContainer.innerHTML = '';
        this.searchInput.value = '';
    }
    
    updateCurrentDay() {
        const currentPage = document.querySelector('.page.active');
        if (currentPage && currentPage.id.includes('day')) {
            this.currentDay = parseInt(currentPage.id.replace('day', '').replace('-page', ''));
        }
    }
    
    async performSearch() {
        const rollNo = this.searchInput.value.trim();
        const selectedDay = this.daySelect.value;
        
        if (!rollNo) {
            this.showError('Please enter a roll number');
            return;
        }
        
        if (!selectedDay) {
            this.showError('Please select a day');
            return;
        }
        
        this.resultsContainer.innerHTML = '<p>Searching...</p>';
        
        try {
            const day = parseInt(selectedDay);
            
            // Search company shortlists (current day only)
            const shortlistResults = await this.searchShortlists(rollNo, day);
            
            // Search placements (all days)
            const placementResults = await this.searchPlacements(rollNo);
            
            // Display results
            this.displayResults(rollNo, day, shortlistResults, placementResults);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }
    
    async searchShortlists(rollNo, day) {
        const results = [];
        
        try {
            // Load schedule to get company list
            const scheduleResponse = await fetch(`data/day${day}-schedule.json`);
            const scheduleData = await scheduleResponse.json();
            
            if (!scheduleData.available || !scheduleData.schedule) {
                return results;
            }
            
            // Search in each company
            for (const company of scheduleData.schedule) {
                if (!company.sheetName) continue;
                
                try {
                    const companyResponse = await fetch(`data/companies/day${day}-${company.sheetName}.json`);
                    const companyData = await companyResponse.json();
                    
                    // Search in all sections
                    const sections = ['registered', 'round1', 'round2', 'round3', 'selected'];
                    
                    for (const section of sections) {
                        if (companyData.sections[section]) {
                            const found = companyData.sections[section].find(
                                student => student.rollNo === rollNo
                            );
                            
                            if (found) {
                                results.push({
                                    company: company.companyName,
                                    section: section,
                                    details: found,
                                    time: company.time,
                                    venue: company.venue
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading company ${company.sheetName}:`, error);
                }
            }
        } catch (error) {
            console.error('Error searching shortlists:', error);
        }
        
        return results;
    }
    
    async searchPlacements(rollNo) {
        const allPlacements = [];
        
        // Search in all three days
        for (let day = 1; day <= 3; day++) {
            try {
                const response = await fetch(`data/day${day}-placed.json`);
                const data = await response.json();
                
                if (data.placements) {
                    const matches = data.placements.filter(p => p.rollNo === rollNo);
                    matches.forEach(match => {
                        allPlacements.push({
                            ...match,
                            day: day
                        });
                    });
                }
            } catch (error) {
                // Day not available yet
                continue;
            }
        }
        
        return allPlacements;
    }
    
    displayResults(rollNo, day, shortlistResults, placementResults) {
        let html = `<h3>🔍 Search Results for ${rollNo}</h3>`;
        
        // Company Shortlists Section
        html += `
            <div class="result-section">
                <h3>📋 Company Shortlists (Day ${day})</h3>
        `;
        
        if (shortlistResults.length > 0) {
            shortlistResults.forEach(result => {
                const sectionLabel = this.getSectionLabel(result.section);
                html += `
                    <div class="result-item">
                        <h4>✓ ${result.company}</h4>
                        <p><strong>Section:</strong> ${sectionLabel}</p>
                        <p><strong>Name:</strong> ${result.details.studentName}</p>
                        <p><strong>Roll No:</strong> ${result.details.rollNo}</p>
                        <p><strong>Campus:</strong> ${result.details.campus}</p>
                        <p><strong>Discipline:</strong> ${result.details.discipline}</p>
                        <p><strong>Time:</strong> ${result.time}</p>
                        <p><strong>Venue:</strong> ${result.venue}</p>
                    </div>
                `;
            });
        } else {
            html += '<p>No shortlists found in Day ' + day + ' companies.</p>';
        }
        
        html += '</div>';
        
        // Placements Section
        html += `
            <div class="result-section">
                <h3>🎉 Placements (All Days)</h3>
        `;
        
        if (placementResults.length > 0) {
            placementResults.forEach(result => {
                html += `
                    <div class="result-item">
                        <h4>✅ Day ${result.day} - ${result.date} at ${result.time}</h4>
                        <p><strong>Company:</strong> ${result.companyName}</p>
                        <p><strong>Student Name:</strong> ${result.studentName}</p>
                        <p><strong>Roll No:</strong> ${result.rollNo}</p>
                        <p><strong>Designation:</strong> ${result.designation}</p>
                        <p><strong>CTC:</strong> ${result.ctc}</p>
                        <p><strong>Campus:</strong> ${result.campus}</p>
                        <p><strong>Department:</strong> ${result.department}</p>
                    </div>
                `;
            });
        } else {
            html += '<p>No placements found yet.</p>';
        }
        
        html += '</div>';
        
        this.resultsContainer.innerHTML = html;
    }
    
    getSectionLabel(section) {
        const labels = {
            'registered': 'Registered Candidates',
            'round1': 'First Round Shortlisted',
            'round2': 'Second Round Shortlisted',
            'round3': 'Third Round Shortlisted',
            'selected': 'Final Selected'
        };
        return labels[section] || section;
    }
    
    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="result-section">
                <p style="color: var(--status-red);">❌ ${message}</p>
            </div>
        `;
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const searchManager = new SearchManager();
});
