// Main application logic

class PlacementApp {
    constructor() {
        this.currentPage = 'home';
        this.currentDay = null;
        this.currentCompany = null;
        this.data = {
            dashboard: null,
            schedules: {},
            placements: {},
            companies: {}
        };
        
        this.init();
    }
    
    async init() {
        // Initialize visit counter
        await this.initVisitCounter();
        
        // Set up navigation
        this.setupNavigation();
        
        // Set up dark mode
        this.setupDarkMode();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Set up data refresh (every minute)
        setInterval(() => this.refreshData(), 60000);
    }
    
    // Visit Counter
    async initVisitCounter() {
        try {
            const result = await window.storage.get('total-visits', true);
            let visitCount = result ? parseInt(result.value) : 0;
            
            visitCount++;
            
            await window.storage.set('total-visits', visitCount.toString(), true);
            
            document.getElementById('visit-count').textContent = visitCount.toLocaleString('en-IN');
        } catch (error) {
            console.error('Visit counter error:', error);
            document.getElementById('visit-count').textContent = '---';
        }
    }
    
    // Navigation
    setupNavigation() {
        // Desktop nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        // Bottom nav (mobile)
        document.querySelectorAll('.bottom-nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        // Quick access cards
        document.querySelectorAll('.quick-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const page = card.dataset.page;
                this.navigateToPage(page);
            });
        });
        
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });
        
        // Placement tabs
        document.querySelectorAll('.placements-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.placements-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const day = btn.dataset.day;
                this.filterPlacements(day);
            });
        });
    }
    
    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Update nav active state
        document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Show requested page
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
            this.currentPage = page;
            
            // Load page data if needed
            if (page.startsWith('day')) {
                const day = parseInt(page.replace('day', ''));
                this.loadDaySchedule(day);
            } else if (page === 'placements') {
                this.loadAllPlacements();
            }
        }
        
        // Hide mobile menu
        document.getElementById('mobile-nav').classList.add('hidden');
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Dark Mode
    setupDarkMode() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.querySelector('.icon').textContent = '☀️';
        }
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isNowDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isNowDark);
            darkModeToggle.querySelector('.icon').textContent = isNowDark ? '☀️' : '🌙';
        });
    }
    
    // Data Loading
    async loadDashboardData() {
        try {
            const response = await fetch('data/dashboard.json');
            this.data.dashboard = await response.json();
            
            this.displayAnnouncements();
            this.displayLatestUpdates();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }
    
    displayAnnouncements() {
        const marquee = document.getElementById('announcements-marquee');
        
        if (!this.data.dashboard || !this.data.dashboard.announcements) {
            marquee.innerHTML = '<p>No announcements at this time.</p>';
            return;
        }
        
        let html = '';
        this.data.dashboard.announcements.forEach(item => {
            if (item.liveAnnouncement) {
                html += `<p><strong>📢 ${item.liveAnnouncement}</strong></p>`;
            }
            if (item.companyStatus) {
                html += `<p><strong>🏢 ${item.companyStatus}</strong></p>`;
            }
            if (item.announcementToStudents) {
                html += `<p><strong>📣 ${item.announcementToStudents}</strong></p>`;
            }
        });
        
        // Duplicate for seamless scrolling
        marquee.innerHTML = html + html;
    }
    
    displayLatestUpdates() {
        const updatesList = document.getElementById('latest-updates');
        
        if (!this.data.dashboard || !this.data.dashboard.announcements) {
            updatesList.innerHTML = '<p>No updates available.</p>';
            return;
        }
        
        let html = '';
        this.data.dashboard.announcements.slice(0, 5).forEach(item => {
            if (item.liveAnnouncement) {
                html += `<p>• ${item.liveAnnouncement}</p>`;
            }
        });
        
        updatesList.innerHTML = html || '<p>No updates available.</p>';
    }
    
    async loadDaySchedule(day) {
        try {
            const response = await fetch(`data/day${day}-schedule.json`);
            const data = await response.json();
            this.data.schedules[day] = data;
            
            const contentDiv = document.getElementById(`day${day}-content`);
            
            if (!data.available || !data.schedule || data.schedule.length === 0) {
                contentDiv.innerHTML = `
                    <div class="info-message">
                        <h3>ℹ️ Schedule Not Available</h3>
                        <p>Day ${day} schedule will be available soon. Please check back later.</p>
                    </div>
                `;
                return;
            }
            
            // Display schedule
            this.displaySchedule(day, data.schedule);
            
        } catch (error) {
            console.error(`Error loading Day ${day} schedule:`, error);
            document.getElementById(`day${day}-content`).innerHTML = '<p>Error loading schedule.</p>';
        }
    }
    
    displaySchedule(day, schedule) {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            this.displayScheduleCards(day, schedule);
        } else {
            this.displayScheduleTable(day, schedule);
        }
    }
    
    displayScheduleTable(day, schedule) {
        let html = `
            <div class="schedule-table-container">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>SL. NO.</th>
                            <th>TIME</th>
                            <th>COMPANY NAME</th>
                            <th>ARRIVAL STATUS</th>
                            <th>CURRENT STATUS</th>
                            <th>PROGRAMMES</th>
                            <th>VENUE</th>
                            <th>REMARKS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        schedule.forEach(company => {
            html += `
                <tr onclick="app.viewCompanyDetails(${day}, '${company.sheetName}', '${company.companyName}')" style="cursor: pointer;">
                    <td>${company.slNo}</td>
                    <td>${company.time}</td>
                    <td><strong>${company.companyName}</strong></td>
                    <td>${this.getStatusBadge(company.arrivalStatus, company.arrivalStatusColor)}</td>
                    <td>${this.getStatusBadge(company.currentStatus, company.currentStatusColor)}</td>
                    <td>${company.programmes}</td>
                    <td>${company.venue}</td>
                    <td>${company.remarks}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById(`day${day}-content`).innerHTML = html;
    }
    
    displayScheduleCards(day, schedule) {
        let html = '<div class="company-cards">';
        
        schedule.forEach(company => {
            html += `
                <div class="company-card" onclick="app.viewCompanyDetails(${day}, '${company.sheetName}', '${company.companyName}')">
                    <h3>${company.companyName}</h3>
                    <div class="company-card-info">
                        <div class="info-row">
                            <span>⏰</span>
                            <span>${company.time}</span>
                        </div>
                        <div class="info-row">
                            <span>📍</span>
                            <span>${company.venue}</span>
                        </div>
                        <div class="info-row">
                            <span>🎓</span>
                            <span>${company.programmes}</span>
                        </div>
                        <div class="info-row">
                            <span>Arrival:</span>
                            ${this.getStatusBadge(company.arrivalStatus, company.arrivalStatusColor)}
                        </div>
                        <div class="info-row">
                            <span>Status:</span>
                            ${this.getStatusBadge(company.currentStatus, company.currentStatusColor)}
                        </div>
                    </div>
                    <p style="margin-top: 8px;"><em>${company.remarks}</em></p>
                </div>
            `;
        });
        
        html += '</div>';
        
        document.getElementById(`day${day}-content`).innerHTML = html;
    }
    
    getStatusBadge(status, color) {
        if (!status) return '';
        return `
            <span class="status-badge ${color}">
                <span class="status-icon ${color}"></span>
                ${status}
            </span>
        `;
    }
    
    async viewCompanyDetails(day, sheetName, companyName) {
        try {
            const response = await fetch(`data/companies/day${day}-${sheetName}.json`);
            const data = await response.json();
            
            // Navigate to company page
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('company-page').classList.add('active');
            
            // Set company info
            document.getElementById('company-name').textContent = companyName;
            document.getElementById('company-details').textContent = `Day ${day} - ${sheetName}`;
            
            // Store current company data
            this.currentCompany = { day, sheetName, companyName, data };
            
            // Display first available section
            const firstSection = Object.keys(data.sections)[0];
            this.displayCompanySection(firstSection);
            
            // Setup tab navigation
            this.setupCompanyTabs(data.sections);
            
            // Setup back button
            document.querySelector('.back-btn').onclick = () => {
                this.navigateToPage(`day${day}`);
            };
            
        } catch (error) {
            console.error('Error loading company details:', error);
            alert('Error loading company details. Please try again.');
        }
    }
    
    setupCompanyTabs(sections) {
        const tabs = document.querySelectorAll('.company-tab-btn');
        
        tabs.forEach(tab => {
            const section = tab.dataset.section;
            
            // Hide tab if section doesn't exist
            if (!sections[section]) {
                tab.style.display = 'none';
            } else {
                tab.style.display = 'block';
                
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.displayCompanySection(section);
                };
            }
        });
    }
    
    displayCompanySection(section) {
        const data = this.currentCompany.data.sections[section];
        const contentDiv = document.getElementById('company-content');
        
        if (!data || data.length === 0) {
            contentDiv.innerHTML = '<p>No candidates in this section.</p>';
            return;
        }
        
        let html = `
            <div class="schedule-table-container">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Sl. No</th>
                            <th>Student Name</th>
                            <th>Roll No</th>
                            <th>Discipline</th>
                            <th>Campus</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach(student => {
            html += `
                <tr>
                    <td>${student.slNo}</td>
                    <td>${student.studentName}</td>
                    <td><strong>${student.rollNo}</strong></td>
                    <td>${student.discipline}</td>
                    <td>${student.campus}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        contentDiv.innerHTML = html;
    }
    
    async loadAllPlacements() {
        try {
            const allPlacements = [];
            
            for (let day = 1; day <= 3; day++) {
                try {
                    const response = await fetch(`data/day${day}-placed.json`);
                    const data = await response.json();
                    
                    if (data.placements) {
                        data.placements.forEach(p => {
                            allPlacements.push({ ...p, day });
                        });
                    }
                } catch (error) {
                    console.log(`Day ${day} placements not available yet`);
                }
            }
            
            this.data.allPlacements = allPlacements;
            this.displayPlacements(allPlacements);
            
        } catch (error) {
            console.error('Error loading placements:', error);
        }
    }
    
    displayPlacements(placements) {
        const contentDiv = document.getElementById('placements-content');
        
        if (!placements || placements.length === 0) {
            contentDiv.innerHTML = '<p>No placements yet.</p>';
            return;
        }
        
        let html = `
            <div class="schedule-table-container">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Company</th>
                            <th>Student Name</th>
                            <th>Roll No</th>
                            <th>Department</th>
                            <th>Campus</th>
                            <th>Designation</th>
                            <th>CTC</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        placements.forEach(p => {
            html += `
                <tr>
                    <td><strong>Day ${p.day}</strong></td>
                    <td>${p.date}</td>
                    <td>${p.time}</td>
                    <td>${p.companyName}</td>
                    <td>${p.studentName}</td>
                    <td><strong>${p.rollNo}</strong></td>
                    <td>${p.department}</td>
                    <td>${p.campus}</td>
                    <td>${p.designation}</td>
                    <td><strong>${p.ctc}</strong></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        contentDiv.innerHTML = html;
    }
    
    filterPlacements(day) {
        if (!this.data.allPlacements) return;
        
        let filtered;
        if (day === 'all') {
            filtered = this.data.allPlacements;
        } else {
            filtered = this.data.allPlacements.filter(p => p.day === parseInt(day));
        }
        
        this.displayPlacements(filtered);
    }
    
    async refreshData() {
        console.log('Refreshing data...');
        
        // Reload current page data
        if (this.currentPage === 'home') {
            await this.loadDashboardData();
        } else if (this.currentPage.startsWith('day')) {
            const day = parseInt(this.currentPage.replace('day', ''));
            await this.loadDaySchedule(day);
        } else if (this.currentPage === 'placements') {
            await this.loadAllPlacements();
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlacementApp();
});
