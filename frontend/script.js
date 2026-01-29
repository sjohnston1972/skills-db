// Network Engineer Skills Matrix - Main JavaScript
// Author: Generated for Skills Matrix System
// Last Updated: 2026-01-15

// ==================== DATA STRUCTURE ====================

// Real data extracted from Project Services Engineers Skills Matrix.xlsx - All Tabs
// Main skills auto-calculate from sub-skills
const sampleData = {
    "resources": [
        {
            "id": "eng-001",
            "name": "Jessica Martinez",
            "email": "jessica.martinez@company.com",
            "skills": {
                "Cisco Enterprise and SD-WAN": 5,
                "Security Products": 4,
                "Network Lifecycle and operation": 4
            },
            "subSkills": {
                "Cisco Enterprise and SD-WAN": {
                    "Cisco Switching": 5,
                    "Meraki Switching": 5,
                    "Cisco Wireless": 5,
                    "Meraki Wireless": 4,
                    "Cisco Routing EIGRP/OSPF": 5,
                    "BGP": 5,
                    "MPLS": 4,
                    "QOS Implementation": 5
                },
                "Security Products": {
                    "ASA Firewalls": 5,
                    "Firepower Firewall/IPS": 4,
                    "Palo Alto Strata(Firewalls)": 4,
                    "Palo Alto (Panorama)": 4,
                    "Cisco ISE": 5,
                    "VPNs": 5,
                    "Certificates": 4,
                    "DUO MFA": 4
                },
                "Network Lifecycle and operation": {
                    "Network Programabilty Python": 4,
                    "Network Programability Ansible": 3,
                    "Wireshark Tracing": 5,
                    "Smart Licensing setup and administration": 4,
                    "Solarwinds Operations": 4
                }
            }
        },
        {
            "id": "eng-002",
            "name": "David Chen",
            "email": "david.chen@company.com",
            "skills": {
                "Azure": 5,
                "AWS": 4,
                "Security Products": 3
            },
            "subSkills": {
                "Azure": {
                    "vnets": 5,
                    "vnet peering": 5,
                    "expressroute": 4,
                    "virtual wan": 4,
                    "load balancers": 4,
                    "s2s vpn": 5,
                    "user defined routes": 5,
                    "terraform": 5,
                    "arm templates": 4,
                    "palo alto firewalls": 4,
                    "cisco secure firewall": 3
                },
                "AWS": {
                    "vpc's": 5,
                    "vpc peering": 4,
                    "vpn gateways": 4,
                    "custom route tables": 4,
                    "load balancers": 4,
                    "palo alto firewalls": 4
                },
                "Security Products": {
                    "Palo Alto Strata(Firewalls)": 4,
                    "Palo Alto (Panorama)": 3,
                    "VPNs": 4,
                    "Certificates": 3
                }
            }
        },
        {
            "id": "eng-003",
            "name": "Sarah Thompson",
            "email": "sarah.thompson@company.com",
            "skills": {
                "Collaboration": 5,
                "Cisco Enterprise and SD-WAN": 3
            },
            "subSkills": {
                "Collaboration": {
                    "Cisco Call Manager": 5,
                    "Cisco Unity Connection": 5,
                    "Cisco IM and Presence": 4,
                    "Cisco Expressway": 5,
                    "Cisco Voice Gateways": 5,
                    "SRST Implementation": 4,
                    "Cisco UCCX": 5,
                    "UCCX Scripting": 4,
                    "Cisco Webex Teams": 5,
                    "Cisco Webex Calling": 5,
                    "Cisco Webex Devices": 5,
                    "Cisco Telepresence": 4
                },
                "Cisco Enterprise and SD-WAN": {
                    "Cisco Switching": 3,
                    "Cisco Routing EIGRP/OSPF": 3,
                    "QOS Implementation": 4
                }
            }
        },
        {
            "id": "eng-004",
            "name": "Michael Rodriguez",
            "email": "michael.rodriguez@company.com",
            "skills": {
                "Data Centre": 5,
                "Other Networking": 4,
                "Security Products": 3
            },
            "subSkills": {
                "Data Centre": {
                    "ACI ": 5,
                    "ACI Multisite": 4,
                    "NEXUS Routing and Switching": 5,
                    "UCS C-Series standalone": 5,
                    "UCS Servers with UCS Manager": 5,
                    "Hyperflex": 4,
                    "VMWare ESXi": 5,
                    "Vcentre config & build": 5,
                    "Vcentre administration": 5,
                    "Intersight": 4
                },
                "Other Networking": {
                    "HPE Aruba L2 Switching": 4,
                    "HPE Aruba L3 Switching": 4,
                    "HPE Aruba Wireless w/onprem controller": 4
                },
                "Security Products": {
                    "Firepower Firewall/IPS": 3,
                    "VPNs": 3,
                    "Certificates": 3
                }
            }
        },
        {
            "id": "eng-005",
            "name": "Emily Parker",
            "email": "emily.parker@company.com",
            "skills": {
                "Cisco Enterprise and SD-WAN": 2,
                "Network Lifecycle and operation": 2,
                "Security Products": 2
            },
            "subSkills": {
                "Cisco Enterprise and SD-WAN": {
                    "Cisco Switching": 3,
                    "Meraki Switching": 2,
                    "Cisco Wireless": 2,
                    "Meraki Wireless": 2,
                    "Cisco Routing EIGRP/OSPF": 3,
                    "QOS Implementation": 2
                },
                "Network Lifecycle and operation": {
                    "Network Programabilty Python": 1,
                    "Wireshark Tracing": 2,
                    "Smart Licensing setup and administration": 2,
                    "Solarwinds Operations": 2
                },
                "Security Products": {
                    "ASA Firewalls": 2,
                    "Meraki Security": 2,
                    "VPNs": 2,
                    "DUO MFA": 2
                }
            }
        }
    ],
    "skills": [
        {
            "id": "skill-001",
            "name": "Cisco Enterprise and SD-WAN",
            "category": "Main Skill Category",
            "subSkills": [
                "SD-Access Switching",
                "SD-Access Wireless",
                "DNAC Device Lifecylce ",
                "DNAC Full SD-Access",
                "Cisco Prime Infrastructure",
                "Cisco Switching",
                "Catalyst VXLAN",
                "Meraki Switching",
                "Cisco SD-WAN",
                "Meraki SD-WAN",
                "Cisco Wired 802.1x ",
                "Cisco Wired Trustsec",
                "Cisco Wireless",
                "Meraki Wireless",
                "Cisco CMX/Spaces",
                "Meraki Wired 802.1x",
                "Meraki Wired Adpative Policy",
                "Cisco Routing EIGRP/OSPF",
                "QOS Implementation",
                "BGP",
                "MPLS",
                "Multicast"
            ]
        },
        {
            "id": "skill-002",
            "name": "Other Networking",
            "category": "Main Skill Category",
            "subSkills": [
                "HPE Aruba L2 Switching",
                "HPE Aruba L3 Switching",
                "HPE Aruba Wireless w/onprem controller",
                "HPE Aruba Wireless w/aruba central"
            ]
        },
        {
            "id": "skill-003",
            "name": "Data Centre",
            "category": "Main Skill Category",
            "subSkills": [
                "ACI ",
                "ACI Multisite",
                "NEXUS Routing and Switching",
                "Nexus FC Switching/MDS",
                "Nexus Fabricpath",
                "Nexus VXLAN",
                "Nexus OTV",
                "Nexus 1000v",
                "UCS C-Series standalone",
                "UCS Servers with UCS Manager",
                "Hyperflex",
                "DCNM",
                "Nexus Dashboard",
                "Intersight",
                "VMWare ESXi",
                "Vcentre config & build",
                "Vcentre administration",
                "AWS basic tasks",
                "Cisco Cloud Centre"
            ]
        },
        {
            "id": "skill-004",
            "name": "Security Products",
            "category": "Main Skill Category",
            "subSkills": [
                "Cisco Defence Orchestrator",
                "ASA Firewalls",
                "Firepower Firewall/IPS",
                "Meraki Security",
                "Cisco Stealthwatch",
                "Amp for Endpoints",
                "Cisco Cloudlock",
                "umbrella DNS / Applicance",
                "umbrella SIG / Secure Web Gateway",
                "Cohesity",
                "Zscaler",
                "Cisco ISE",
                "VPNs",
                "Certificates",
                "Cisco Email Security",
                "Cisco Web Security/ SIG Proxy",
                "DUO MFA",
                "DUO SSO ",
                "DUO Network Access Gateway",
                "Palo Alto Strata(Firewalls)",
                "Palo Alto (Panorama)",
                "Palo Alto Global Connect",
                "Palo Alto Prisma",
                "Palo Alto SD-WAN",
                "Palo Alto Cortex",
                "Fortinet Firewalls",
                "Fortinet Manager",
                "Checkpoint Firewalls",
                "Checkpoint Manager",
                "F5 Load Balancer",
                "F5 VPN",
                "Sonicwall",
                "Aruba Clearpass"
            ]
        },
        {
            "id": "skill-005",
            "name": "Network Lifecycle and operation",
            "category": "Main Skill Category",
            "subSkills": [
                "Network Programabilty Python",
                "Network Programability Ansible",
                "Smart Collector Deployment",
                "Smart collector Audit",
                "Smart Licensing setup and administration",
                "Netformix Audit",
                "WAN Audit",
                "Ekahau Wireless Survey",
                "I Perf testing",
                "Exfo Testing",
                "Wireshark Tracing",
                "Tenable management and deployment",
                "Solarwinds Operations",
                "Solarwinds upgrade and deployment",
                "Kibana/Logstash Logging and operation",
                "Kibana/Logstash Logging and deployment"
            ]
        },
        {
            "id": "skill-006",
            "name": "Collaboration",
            "category": "Main Skill Category",
            "subSkills": [
                "Cisco Call Manager",
                "Cisco Unity Connection",
                "Cisco IM and Presence",
                "Cisco Expressway",
                "Call Manager Express",
                "Cisco Voice Gateways",
                "SRST Implementation",
                "Cisco CUAC",
                "DPNSS to QSIG ",
                "Cisco UCCX",
                "UCCX Scripting",
                "Advanced Quality Manager",
                "Workforce Optimization",
                "Social Miner",
                "Cisco Webex Teams",
                "Cisco Webex Calling",
                "Cisco Webex Devices",
                "Cisco Telepresence",
                "Cisco Meeting server",
                "Prime Collaboration Deployment",
                "Prime collaboration Management",
                "Prime Collaboration Provisioning",
                "Enghouse Arc Pro",
                "Enghouse Touchpoint",
                "Enghouse EICC"
            ]
        },
        {
            "id": "skill-007",
            "name": "Azure",
            "category": "Main Skill Category",
            "subSkills": [
                "azure firewall",
                "cisco sdwan",
                "Cisco CSR 1000v",
                "Meraki vMX",
                "Cisco ISE",
                "cisco secure firewall",
                "palo alto firewalls",
                "route server",
                "other nva's",
                "Azure functrion App",
                "dns",
                "vnets",
                "vnet peering",
                "expressroute",
                "virtual wan",
                "load balancers",
                "nat gateways",
                "app gateways",
                "s2s vpn",
                "p2s vpn",
                "user defined routes",
                "terraform",
                "arm templates"
            ]
        },
        {
            "id": "skill-008",
            "name": "Nutanix",
            "category": "Main Skill Category",
            "subSkills": [
                "Nutanix Cloud Platform",
                "Nutanix Cloud Clusters (NC2)",
                "Nutanix Cloud Manager",
                "Nutanix Cloud Infrastructure",
                "Nutanix Central",
                "Prism",
                "AOS Storage",
                "AHV Virtualisation",
                "Kubernetes Platform",
                "Data services for Kubernetes",
                "Disaster Recovery",
                "Flow Network Security",
                "Flow Virtual Networking",
                "Intelligent Ops",
                "Self Service",
                "Cost Governance",
                "Security Central",
                "Files Storage",
                "Objects Storage",
                "Volumes Block Storage",
                "Data Lens",
                "Mine Integrated Backup",
                "Database Service",
                "End User Compute"
            ]
        },
        {
            "id": "skill-009",
            "name": "AWS",
            "category": "Main Skill Category",
            "subSkills": [
                "aws firewall",
                "cisco sdwan",
                "Cisco CSR 1000v",
                "meraki",
                "cisco ise",
                "cisco secure firewall",
                "palo alto firewalls",
                "other nva's",
                "vpc's",
                "vpc peering",
                "virtual network nat",
                "load balancers",
                "application load balancers",
                "vpn gateways",
                "custom route tables"
            ]
        },
        {
            "id": "skill-010",
            "name": "Dell",
            "category": "Main Skill Category",
            "subSkills": [
                "PowerStore",
                "PowerFlex",
                "PowerScale",
                "PowerVault",
                "PowerMax",
                "Unity XT",
                "ECS",
                "VxRail",
                "ObjectScale",
                "Apex Data Storage Services",
                "APEX for public Cloud",
                "Apex Cloud Platforms"
            ]
        }
    ],
    "metadata": {
        "lastUpdated": "2026-01-22T00:00:00Z",
        "version": "4.0",
        "source": "Sample Data - 5 Fictional Engineers",
        "note": "Main skills auto-calculate from sub-skills"
    }
};


function initializeData() {
    const existingData = localStorage.getItem('skillsMatrixData');
    console.log('initializeData - localStorage exists:', !!existingData);
    if (!existingData) {
        console.log('No data found, initializing with sampleData');
        console.log('Sample data has', sampleData.resources.length, 'resources');
        saveData(sampleData);
    } else {
        // Use getData() which handles migration from engineers to resources
        const data = getData();
        console.log('Existing data found with', data.resources.length, 'resources');
    }
}

function getData() {
    const data = localStorage.getItem('skillsMatrixData');
    if (!data) {
        console.warn('WARNING: getData() - localStorage is empty, returning sampleData!');
        return sampleData;
    }
    const parsed = JSON.parse(data);

    // Migration: Convert old 'engineers' property to 'resources'
    if (parsed.engineers && !parsed.resources) {
        console.log('Migrating data: engineers → resources');
        parsed.resources = parsed.engineers;
        delete parsed.engineers;
        localStorage.setItem('skillsMatrixData', JSON.stringify(parsed));
        console.log('Migration complete');
    }

    // Safety check
    if (!parsed.resources) {
        console.error('ERROR: No resources property found, clearing localStorage and using sampleData');
        localStorage.removeItem('skillsMatrixData');
        return sampleData;
    }

    console.log('getData() - returning data with', parsed.resources.length, 'resources');
    return parsed;
}

function saveData(data) {
    console.log('saveData() - saving data with', data.resources.length, 'resources');
    data.metadata.lastUpdated = new Date().toISOString();
    localStorage.setItem('skillsMatrixData', JSON.stringify(data));
    console.log('saveData() - data saved to localStorage');
    updateLastUpdated();
}

function updateLastUpdated() {
    const data = getData();
    const date = new Date(data.metadata.lastUpdated);
    document.getElementById('lastUpdated').textContent = date.toLocaleString();
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');

            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`${viewName}-view`).classList.add('active');

            // Render the selected view
            renderView(viewName);
        });
    });
}

function renderView(viewName) {
    switch(viewName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'heatmap':
            renderHeatmap();
            break;
        case 'search':
            renderSearch();
            break;
        case 'management':
            renderManagement();
            break;
    }
}

// ==================== NAVIGATION FUNCTIONS ====================

function navigateToSearch() {
    // Switch to search tab
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    const searchBtn = document.querySelector('[data-view="search"]');
    if (searchBtn) {
        searchBtn.classList.add('active');
    }

    // Show search view
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('search-view').classList.add('active');

    // Render search view
    renderView('search');
}

function scrollToCustomRadar() {
    const customRadarSection = document.querySelector('.custom-chart-section');
    if (customRadarSection) {
        customRadarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ==================== DASHBOARD ====================

let teamRadarChart = null;

function renderDashboard() {
    const data = getData();

    // Calculate metrics
    const totalResources = data.resources.length;

    // Count total sub-skills across all categories
    let totalSubSkills = 0;
    data.skills.forEach(skillCategory => {
        if (skillCategory.subSkills && skillCategory.subSkills.length > 0) {
            totalSubSkills += skillCategory.subSkills.length;
        }
    });
    const totalSkills = totalSubSkills;

    // Update metrics
    document.getElementById('totalResources').textContent = totalResources;
    document.getElementById('totalSkills').textContent = totalSkills;

    // Calculate average skill levels for each skill
    const skillAverages = {};
    data.skills.forEach(skill => {
        let sum = 0;
        let count = 0;
        data.resources.forEach(resource => {
            if (resource.skills[skill.name]) {
                sum += resource.skills[skill.name];
                count++;
            }
        });
        skillAverages[skill.name] = count > 0 ? sum / count : 0;
    });

    // Render radar chart
    renderRadarChart(skillAverages);

    // Render top/bottom skills
    renderTopSkills(skillAverages);
}

function renderRadarChart(skillAverages) {
    const ctx = document.getElementById('teamRadarChart').getContext('2d');

    // Filter out skills with 0 average (no one has that skill)
    const filteredSkills = Object.entries(skillAverages)
        .filter(([skill, avg]) => avg > 0);

    const labels = filteredSkills.map(([skill, avg]) => skill);
    const values = filteredSkills.map(([skill, avg]) => avg);

    if (teamRadarChart) {
        teamRadarChart.destroy();
    }

    teamRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Team Average Skill Level',
                data: values,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(37, 99, 235, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function renderTopSkills(skillAverages) {
    const sorted = Object.entries(skillAverages).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const bottom5 = sorted.slice(-5).reverse();

    const topList = document.getElementById('topSkills');
    const gapList = document.getElementById('gapSkills');

    topList.innerHTML = top5.map(([skill, avg]) => `
        <li>
            <span>${skill}</span>
            <span class="skill-score">${avg.toFixed(1)}</span>
        </li>
    `).join('');

    gapList.innerHTML = bottom5.map(([skill, avg]) => `
        <li>
            <span>${skill}</span>
            <span class="skill-score" style="background: var(--danger-color);">${avg.toFixed(1)}</span>
        </li>
    `).join('');
}

// ==================== HEATMAP ====================

function renderHeatmap(sortBy = 'name') {
    const data = getData();
    const container = document.getElementById('heatmapContainer');

    // Sort resources
    let resources =[...data.resources];
    if (sortBy === 'name') {
        resources.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'avgSkill') {
        resources.sort((a, b) => {
            const avgA = Object.values(a.skills).reduce((sum, val) => sum + val, 0) / Object.keys(a.skills).length;
            const avgB = Object.values(b.skills).reduce((sum, val) => sum + val, 0) / Object.keys(b.skills).length;
            return avgB - avgA;
        });
    }

    let html = '';

    if (sortBy === 'name') {
        // Traditional table with fixed columns (alphabetical)
        const allSkills = data.skills.map(s => s.name);

        html = '<table class="heatmap-table"><thead><tr>';
        html += '<th>Resource</th>';
        allSkills.forEach(skill => {
            html += `<th>${skill}</th>`;
        });
        html += '</tr></thead><tbody>';

        resources.forEach(resource => {
            html += '<tr>';
            html += `<td class="resource-name">${resource.name}</td>`;

            allSkills.forEach(skill => {
                const level = resource.skills[skill] || 0;
                const tooltip = `${resource.name} - ${skill}: Level ${level}`;
                html += `<td class="skill-cell level-${level}" title="${tooltip}">${level || '-'}</td>`;
            });

            html += '</tr>';
        });

        html += '</tbody></table>';
    } else {
        // Flexible layout: each resource shows their skills sorted by their own levels
        html = '<table class="heatmap-table heatmap-flexible"><thead><tr>';
        html += '<th>Resource</th>';
        html += '<th colspan="100">Skills (sorted by proficiency, highest first)</th>';
        html += '</tr></thead><tbody>';

        resources.forEach(resource => {
            // Sort this resource's skills by their level (descending)
            const resourceSkills = Object.entries(resource.skills)
                .filter(([skill, level]) => level > 0)
                .sort((a, b) => b[1] - a[1]); // Sort by level descending

            html += '<tr>';
            html += `<td class="resource-name">${resource.name}</td>`;

            // Display skills in order of this resource's proficiency
            resourceSkills.forEach(([skill, level]) => {
                const tooltip = `${resource.name} - ${skill}: Level ${level}`;
                html += `<td class="skill-cell level-${level}" title="${tooltip}">${skill}: ${level}</td>`;
            });

            html += '</tr>';
        });

        html += '</tbody></table>';
    }

    container.innerHTML = html;

    // Setup sort buttons
    document.getElementById('sortByName').addEventListener('click', () => renderHeatmap('name'));
    document.getElementById('sortByAvgSkill').addEventListener('click', () => renderHeatmap('avgSkill'));
}

// ==================== SEARCH ====================

function renderSearch() {
    const data = getData();
    const searchInput = document.getElementById('resourceSearch');
    const resultsContainer = document.getElementById('searchResults');

    // Display all engineers initially
    displaySearchResults(data.resources);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = data.resources.filter(eng =>
            eng.name.toLowerCase().includes(query) ||
            eng.email.toLowerCase().includes(query)
        );
        displaySearchResults(filtered);
    });
}

function displaySearchResults(resources) {
    const resultsContainer = document.getElementById('searchResults');

    if (resources.length === 0) {
        resultsContainer.innerHTML = '<p>No resources found.</p>';
        return;
    }

    resultsContainer.innerHTML = resources.map(eng => {
        // Count sub-skills instead of main skills
        let subSkillCount = 0;
        if (eng.subSkills) {
            Object.values(eng.subSkills).forEach(category => {
                subSkillCount += Object.keys(category).length;
            });
        }

        return `
            <div class="resource-card" data-resource-id="${eng.id}">
                <h4>${eng.name}</h4>
                <p>${eng.email}</p>
                <p><strong>${subSkillCount}</strong> skills <small style="color: #9ca3af;">(Click: Profile | Dbl-Click: Edit)</small></p>
            </div>
        `;
    }).join('');

    // Add event listeners for cards
    const cards = resultsContainer.querySelectorAll('.resource-card');
    cards.forEach(card => {
        const resourceId = card.getAttribute('data-resource-id');
        const resource = resources.find(e => e.id === resourceId);

        // Single click: show profile
        card.addEventListener('click', () => {
            showResourceProfile(resourceId);
        });

        // Double click: open edit modal
        card.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            openResourceModal(resourceId);
        });

        // Hover: show tooltip with 250ms delay and fade-in
        let hoverTimeout;
        card.addEventListener('mouseenter', (e) => {
            hoverTimeout = setTimeout(() => {
                showResourceTooltip(e.currentTarget, resource);
            }, 250);
        });

        card.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            hideResourceTooltip();
        });
    });
}

function showResourceTooltip(cardElement, resource) {
    // Remove any existing tooltip
    hideResourceTooltip();

    // Get all sub-skills
    const allSubSkills = [];
    if (resource.subSkills) {
        Object.entries(resource.subSkills).forEach(([category, skills]) => {
            Object.entries(skills).forEach(([skillName, level]) => {
                allSubSkills.push({ name: skillName, level: level });
            });
        });
    }

    // Sort by level descending
    const sortedSkills = allSubSkills.sort((a, b) => b.level - a.level);

    // Get top 10 skills
    const top10Skills = sortedSkills.filter(s => s.level > 0).slice(0, 10);

    // Get skills gaps (level 1-2) and missing skills (level 0)
    const gapSkills = sortedSkills.filter(s => s.level > 0 && s.level <= 2).slice(0, 5);

    if (top10Skills.length === 0 && gapSkills.length === 0) {
        return; // No skills to show
    }

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'resource-tooltip show';
    tooltip.id = 'active-resource-tooltip';

    let tooltipHTML = '';

    // Top skills section
    if (top10Skills.length > 0) {
        tooltipHTML += '<h5>Top 10 Skills</h5><ul>';
        top10Skills.forEach(skill => {
            tooltipHTML += `
                <li>
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level">Level ${skill.level}</span>
                </li>
            `;
        });
        tooltipHTML += '</ul>';
    }

    // Skills gaps section
    if (gapSkills.length > 0) {
        tooltipHTML += '<div class="section-divider"></div>';
        tooltipHTML += '<div class="gaps-section"><h5>Skills Gaps (Low Proficiency)</h5><ul>';
        gapSkills.forEach(skill => {
            tooltipHTML += `
                <li>
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level" style="background: rgba(248, 113, 113, 0.3);">Level ${skill.level}</span>
                </li>
            `;
        });
        tooltipHTML += '</ul></div>';
    }

    tooltip.innerHTML = tooltipHTML;
    document.body.appendChild(tooltip);

    // Position tooltip next to the card
    const cardRect = cardElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Try to position to the right of the card
    let left = cardRect.right + 15;
    let top = cardRect.top;

    // If tooltip would go off the right edge, position to the left
    if (left + tooltipRect.width > window.innerWidth) {
        left = cardRect.left - tooltipRect.width - 15;
    }

    // If tooltip would go off the bottom, adjust top position
    if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 10;
    }

    // Ensure tooltip doesn't go off the top
    if (top < 10) {
        top = 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function hideResourceTooltip() {
    const existingTooltip = document.getElementById('active-resource-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

function showResourceProfile(resourceId) {
    const data = getData();
    const resource = data.resources.find(e => e.id === resourceId);

    if (!resource) return;

    const profileContainer = document.getElementById('resourceProfile');
    const allSkills = data.skills.map(s => s.name);
    const missingSkills = allSkills.filter(s => !resource.skills[s]);

    // Count sub-skills instead of main skills
    let subSkillCount = 0;
    if (resource.subSkills) {
        Object.values(resource.subSkills).forEach(category => {
            subSkillCount += Object.keys(category).length;
        });
    }

    let html = `
        <div class="profile-header">
            <h3>${resource.name}</h3>
            <p>${resource.email}</p>
        </div>

        <div class="profile-chart">
            <canvas id="resourceRadarChart"></canvas>
        </div>

        <h4>Skills (${subSkillCount} total)</h4>
        <div class="skills-list">
    `;

    Object.entries(resource.skills).sort((a, b) => b[1] - a[1]).forEach(([skill, level]) => {
        html += `
            <div class="skill-item">
                <span>${skill}</span>
                <span class="skill-level-badge level-${level}" style="background-color: var(--level-${level}); color: ${level >= 5 ? 'white' : '#1e293b'};">
                    Level ${level}
                </span>
            </div>
        `;
    });

    html += '</div>';

    if (missingSkills.length > 0) {
        html += `<h4 style="margin-top: 2rem; color: var(--danger-color);">Skills Gaps (${missingSkills.length})</h4>`;
        html += '<div class="skills-list">';
        missingSkills.forEach(skill => {
            html += `<div class="skill-item"><span>${skill}</span><span style="color: var(--secondary-color);">Not acquired</span></div>`;
        });
        html += '</div>';
    }

    profileContainer.innerHTML = html;

    // Render individual radar chart
    renderResourceRadar(resource, allSkills);
}

function renderResourceRadar(resource, allSkills) {
    const ctx = document.getElementById('resourceRadarChart').getContext('2d');

    // Filter out skills where resource has 0 proficiency
    const filteredSkills = allSkills
        .map(skill => ({ skill, value: resource.skills[skill] || 0 }))
        .filter(item => item.value > 0);

    const labels = filteredSkills.map(item => item.skill);
    const values = filteredSkills.map(item => item.value);

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: `${resource.name}'s Skills`,
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(16, 185, 129, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// ==================== DATA MANAGEMENT ====================

function renderManagement() {
    populateResourceSelect();
    populateMainSkillSelect();
    setupManagementEventListeners();
}

function populateResourceSelect() {
    const data = getData();
    const select = document.getElementById('selectResource');

    select.innerHTML = '<option value="">-- Choose Resource --</option>';
    data.resources.forEach(eng => {
        select.innerHTML += `<option value="${eng.id}">${eng.name}</option>`;
    });
}

function populateMainSkillSelect() {
    const data = getData();
    const select = document.getElementById('selectMainSkill');

    select.innerHTML = '<option value="">-- Choose Main Skill --</option>';
    data.skills.forEach(skill => {
        select.innerHTML += `<option value="${skill.id}">${skill.name}</option>`;
    });
}

function setupManagementEventListeners() {
    // Add Resource
    document.getElementById('addResource').addEventListener('click', addResource);

    // Select Resource
    document.getElementById('selectResource').addEventListener('change', onResourceSelect);

    // Update/Delete Resource
    document.getElementById('updateResource').addEventListener('click', updateResource);
    document.getElementById('deleteResource').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteResource();
    });

    // Main Skill Management
    document.getElementById('addMainSkill').addEventListener('click', addMainSkill);
    document.getElementById('selectMainSkill').addEventListener('change', onMainSkillSelect);
    document.getElementById('editMainSkill').addEventListener('click', startEditMainSkill);
    document.getElementById('saveMainSkillName').addEventListener('click', saveMainSkillName);
    document.getElementById('cancelEditMainSkill').addEventListener('click', cancelEditMainSkill);
    document.getElementById('deleteMainSkill').addEventListener('click', deleteMainSkill);

    // Sub-Skill Management
    document.getElementById('addSubSkill').addEventListener('click', addSubSkill);

    // Data actions
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('resetData').addEventListener('click', resetData);
}

function addResource() {
    const name = document.getElementById('resourceName').value.trim();
    const email = document.getElementById('resourceEmail').value.trim();

    if (!name || !email) {
        alert('Please enter both name and email.');
        return;
    }

    const data = getData();
    const newEngineer = {
        id: `eng-${Date.now()}`,
        name: name,
        email: email,
        skills: {}
    };

    data.resources.push(newEngineer);
    saveData(data);

    document.getElementById('resourceName').value = '';
    document.getElementById('resourceEmail').value = '';

    alert(`Resource "${name}" added successfully!`);
    populateResourceSelect();
    renderDashboard();
}

function onResourceSelect() {
    const resourceId = document.getElementById('selectResource').value;

    if (!resourceId) {
        document.getElementById('updateResource').disabled = true;
        document.getElementById('deleteResource').disabled = true;
        document.getElementById('resourceSkillsEdit').innerHTML = '';
        return;
    }

    document.getElementById('updateResource').disabled = false;
    document.getElementById('deleteResource').disabled = false;

    const data = getData();
    const resource = data.resources.find(e => e.id === resourceId);

    // Display skills editor with accordion for sub-skills
    const container = document.getElementById('resourceSkillsEdit');
    let html = '<h4>Edit Sub-Skills (Main skills auto-calculate):</h4>';
    html += '<div class="skills-accordion">';

    data.skills.forEach((mainSkill, index) => {
        const isOpen = index === 0; // First one open by default
        const mainSkillLevel = resource.skills[mainSkill.name] || 0;

        html += `
            <div class="accordion-item">
                <button class="accordion-header ${isOpen ? 'active' : ''}" onclick="toggleAccordion(this)">
                    <span>${mainSkill.name}</span>
                    <span class="main-skill-badge">Current: ${mainSkillLevel}</span>
                    <span class="accordion-icon">${isOpen ? '▼' : '▶'}</span>
                </button>
                <div class="accordion-content" style="display: ${isOpen ? 'block' : 'none'}">
        `;

        // Get resource's sub-skills for this category
        const engineerSubSkills = resource.subSkills?.[mainSkill.name] || {};

        // Display all available sub-skills for this category
        if (mainSkill.subSkills && mainSkill.subSkills.length > 0) {
            mainSkill.subSkills.forEach(subSkill => {
                const level = engineerSubSkills[subSkill] || 0;
                html += `
                    <div class="sub-skill-edit-item">
                        <label title="${subSkill}">${subSkill}</label>
                        <input type="number" min="0" max="5" value="${level}"
                               data-main-skill="${mainSkill.name}"
                               data-sub-skill="${subSkill}"
                               class="sub-skill-input">
                    </div>
                `;
            });
        } else {
            html += '<p class="no-subskills">No sub-skills available for this category</p>';
        }

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Helper function to toggle accordion
function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.accordion-icon');
    const isOpen = content.style.display === 'block';

    content.style.display = isOpen ? 'none' : 'block';
    icon.textContent = isOpen ? '▶' : '▼';
    button.classList.toggle('active');
}

function updateResource() {
    const resourceId = document.getElementById('selectResource').value;
    if (!resourceId) return;

    const data = getData();
    const resource = data.resources.find(e => e.id === resourceId);

    // Initialize subSkills if not exists
    if (!resource.subSkills) {
        resource.subSkills = {};
    }

    // Update sub-skills from inputs
    const inputs = document.querySelectorAll('.sub-skill-input');
    const subSkillsByCategory = {};

    inputs.forEach(input => {
        const mainSkill = input.getAttribute('data-main-skill');
        const subSkill = input.getAttribute('data-sub-skill');
        const level = parseInt(input.value);

        if (!subSkillsByCategory[mainSkill]) {
            subSkillsByCategory[mainSkill] = {};
        }

        if (level > 0) {
            subSkillsByCategory[mainSkill][subSkill] = level;
        }
    });

    // Update resource's sub-skills
    resource.subSkills = subSkillsByCategory;

    // Recalculate main skill averages from sub-skills
    resource.skills = {};
    Object.keys(subSkillsByCategory).forEach(mainSkill => {
        const subSkills = subSkillsByCategory[mainSkill];
        const levels = Object.values(subSkills);

        if (levels.length > 0) {
            const average = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
            resource.skills[mainSkill] = average;
        }
    });

    saveData(data);
    alert(`Resource "${resource.name}" updated successfully! Main skills recalculated from sub-skills.`);
    renderDashboard();

    // Refresh the editor to show updated main skill values
    onResourceSelect();
}

async function deleteResource() {
    const resourceId = document.getElementById('selectResource').value;

    if (!resourceId) {
        alert('Please select a resource to delete.');
        return;
    }

    const data = getData();
    const resource = data.resources.find(e => e.id === resourceId);

    if (!resource) {
        alert('Resource not found.');
        return;
    }

    const confirmed = await showConfirmModal(`Are you sure you want to delete "${resource.name}"?`);
    if (!confirmed) {
        return;
    }

    data.resources = data.resources.filter(e => e.id !== resourceId);
    saveData(data);

    alert(`Resource "${resource.name}" deleted successfully!`);
    document.getElementById('selectResource').value = '';
    document.getElementById('resourceSkillsEdit').innerHTML = '';
    document.getElementById('updateResource').disabled = true;
    document.getElementById('deleteResource').disabled = true;
    populateResourceSelect();
    renderDashboard();
}

function addMainSkill() {
    const name = document.getElementById('newMainSkill').value.trim();

    if (!name) {
        alert('Please enter a main skill category name.');
        return;
    }

    const data = getData();

    // Check for duplicates
    if (data.skills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('This main skill category already exists.');
        return;
    }

    const newSkill = {
        id: `skill-${Date.now()}`,
        name: name,
        category: 'Main Skill Category',
        subSkills: []
    };

    data.skills.push(newSkill);
    saveData(data);

    document.getElementById('newMainSkill').value = '';

    alert(`Main skill category "${name}" added successfully!`);
    populateMainSkillSelect();
    renderDashboard();
}

function onMainSkillSelect() {
    const skillId = document.getElementById('selectMainSkill').value;

    if (!skillId) {
        document.getElementById('deleteMainSkill').disabled = true;
        document.getElementById('editMainSkill').disabled = true;
        document.getElementById('subSkillsManagement').style.display = 'none';
        document.getElementById('editMainSkillSection').style.display = 'none';
        return;
    }

    document.getElementById('deleteMainSkill').disabled = false;
    document.getElementById('editMainSkill').disabled = false;
    document.getElementById('subSkillsManagement').style.display = 'block';

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    // Display sub-skills list
    displaySubSkills(mainSkill);
}

function startEditMainSkill() {
    const skillId = document.getElementById('selectMainSkill').value;
    if (!skillId) return;

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    if (!mainSkill) return;

    // Show edit section with current name
    document.getElementById('editMainSkillName').value = mainSkill.name;
    document.getElementById('editMainSkillSection').style.display = 'block';
    document.getElementById('editMainSkill').style.display = 'none';
    document.getElementById('saveMainSkillName').style.display = 'inline-block';
    document.getElementById('cancelEditMainSkill').style.display = 'inline-block';
    document.getElementById('deleteMainSkill').disabled = true;
    document.getElementById('selectMainSkill').disabled = true;
}

function cancelEditMainSkill() {
    document.getElementById('editMainSkillSection').style.display = 'none';
    document.getElementById('editMainSkill').style.display = 'inline-block';
    document.getElementById('saveMainSkillName').style.display = 'none';
    document.getElementById('cancelEditMainSkill').style.display = 'none';
    document.getElementById('deleteMainSkill').disabled = false;
    document.getElementById('selectMainSkill').disabled = false;
}

function saveMainSkillName() {
    const skillId = document.getElementById('selectMainSkill').value;
    const newName = document.getElementById('editMainSkillName').value.trim();

    if (!skillId || !newName) {
        alert('Please enter a valid category name.');
        return;
    }

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    if (!mainSkill) {
        alert('Skill category not found.');
        return;
    }

    const oldName = mainSkill.name;

    // Check if name already exists
    const existingSkill = data.skills.find(s => s.id !== skillId && s.name === newName);
    if (existingSkill) {
        alert('A skill category with this name already exists.');
        return;
    }

    // Update skill category name
    mainSkill.name = newName;

    // Update all engineers who have this skill
    data.resources.forEach(resource => {
        if (resource.skills && resource.skills[oldName] !== undefined) {
            resource.skills[newName] = resource.skills[oldName];
            delete resource.skills[oldName];
        }

        if (resource.subSkills && resource.subSkills[oldName]) {
            resource.subSkills[newName] = resource.subSkills[oldName];
            delete resource.subSkills[oldName];
        }
    });

    saveData(data);

    alert(`Skill category renamed from "${oldName}" to "${newName}"`);

    // Refresh the select dropdown
    populateMainSkillSelect();
    document.getElementById('selectMainSkill').value = skillId;

    // Cancel edit mode
    cancelEditMainSkill();

    // Refresh dashboard
    renderDashboard();
}

function displaySubSkills(mainSkill) {
    const container = document.getElementById('subSkillsList');

    if (!mainSkill.subSkills || mainSkill.subSkills.length === 0) {
        container.innerHTML = '<p class="no-subskills">No sub-skills yet. Add one above.</p>';
        return;
    }

    let html = '<h5>Current Sub-Skills:</h5>';
    html += '<div class="sub-skills-grid">';

    mainSkill.subSkills.forEach(subSkill => {
        html += `
            <div class="sub-skill-tag" data-subskill="${subSkill.replace(/"/g, '&quot;')}">
                <span class="sub-skill-name">${subSkill}</span>
                <button class="edit-sub-skill-btn" onclick="startEditSubSkill('${mainSkill.id}', '${subSkill.replace(/'/g, "\\'")}')">✎</button>
                <button class="delete-sub-skill-btn" onclick="deleteSubSkill('${mainSkill.id}', '${subSkill.replace(/'/g, "\\'")}')">×</button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function addSubSkill() {
    const skillId = document.getElementById('selectMainSkill').value;
    if (!skillId) {
        alert('Please select a main skill category first.');
        return;
    }

    const subSkillName = document.getElementById('newSubSkill').value.trim();
    if (!subSkillName) {
        alert('Please enter a sub-skill name.');
        return;
    }

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    // Initialize subSkills array if it doesn't exist
    if (!mainSkill.subSkills) {
        mainSkill.subSkills = [];
    }

    // Check for duplicates
    if (mainSkill.subSkills.includes(subSkillName)) {
        alert('This sub-skill already exists in this category.');
        return;
    }

    mainSkill.subSkills.push(subSkillName);
    saveData(data);

    document.getElementById('newSubSkill').value = '';

    alert(`Sub-skill "${subSkillName}" added to "${mainSkill.name}"!`);
    displaySubSkills(mainSkill);
}

async function deleteSubSkill(mainSkillId, subSkillName) {
    const confirmed = await showConfirmModal(`Are you sure you want to delete the sub-skill "${subSkillName}"? This will remove it from all resources.`);
    if (!confirmed) {
        return;
    }

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === mainSkillId);

    // Remove from main skill's sub-skills list
    mainSkill.subSkills = mainSkill.subSkills.filter(s => s !== subSkillName);

    // Remove from all engineers' sub-skills
    data.resources.forEach(resource => {
        if (resource.subSkills && resource.subSkills[mainSkill.name]) {
            delete resource.subSkills[mainSkill.name][subSkillName];

            // Recalculate main skill average
            const subSkills = resource.subSkills[mainSkill.name];
            const levels = Object.values(subSkills);

            if (levels.length > 0) {
                const average = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
                resource.skills[mainSkill.name] = average;
            } else {
                delete resource.skills[mainSkill.name];
                delete resource.subSkills[mainSkill.name];
            }
        }
    });

    saveData(data);
    alert(`Sub-skill "${subSkillName}" deleted successfully!`);

    displaySubSkills(mainSkill);
    renderDashboard();
}

function startEditSubSkill(mainSkillId, subSkillName) {
    // Find the tag element
    const container = document.getElementById('subSkillsList');
    const tags = container.querySelectorAll('.sub-skill-tag');

    tags.forEach(tag => {
        const tagSubSkill = tag.getAttribute('data-subskill');
        if (tagSubSkill === subSkillName) {
            const nameSpan = tag.querySelector('.sub-skill-name');
            const editBtn = tag.querySelector('.edit-sub-skill-btn');
            const deleteBtn = tag.querySelector('.delete-sub-skill-btn');

            // Replace span with input
            const input = document.createElement('input');
            input.type = 'text';
            input.value = subSkillName;
            input.className = 'sub-skill-edit-input';
            nameSpan.replaceWith(input);
            input.focus();
            input.select();

            // Replace edit button with save button
            editBtn.textContent = '✓';
            editBtn.className = 'save-sub-skill-btn';
            editBtn.onclick = () => saveSubSkillEdit(mainSkillId, subSkillName, input.value);

            // Replace delete button with cancel button
            deleteBtn.textContent = '✕';
            deleteBtn.className = 'cancel-sub-skill-btn';
            deleteBtn.onclick = () => cancelSubSkillEdit(mainSkillId);
        }
    });
}

function saveSubSkillEdit(mainSkillId, oldName, newName) {
    newName = newName.trim();

    if (!newName) {
        alert('Sub-skill name cannot be empty.');
        return;
    }

    if (newName === oldName) {
        cancelSubSkillEdit(mainSkillId);
        return;
    }

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === mainSkillId);

    // Check if new name already exists
    if (mainSkill.subSkills.includes(newName)) {
        alert(`Sub-skill "${newName}" already exists in this category.`);
        return;
    }

    // Update in main skill's sub-skills list
    const index = mainSkill.subSkills.indexOf(oldName);
    if (index !== -1) {
        mainSkill.subSkills[index] = newName;
    }

    // Update in all resources' sub-skills
    data.resources.forEach(resource => {
        if (resource.subSkills && resource.subSkills[mainSkill.name]) {
            const categorySkills = resource.subSkills[mainSkill.name];
            if (categorySkills[oldName] !== undefined) {
                categorySkills[newName] = categorySkills[oldName];
                delete categorySkills[oldName];
            }
        }
    });

    saveData(data);
    alert(`Sub-skill renamed from "${oldName}" to "${newName}"!`);

    displaySubSkills(mainSkill);
    renderDashboard();
}

function cancelSubSkillEdit(mainSkillId) {
    const data = getData();
    const mainSkill = data.skills.find(s => s.id === mainSkillId);
    displaySubSkills(mainSkill);
}

async function deleteMainSkill() {
    const skillId = document.getElementById('selectMainSkill').value;
    if (!skillId) return;

    const data = getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    const confirmed = await showConfirmModal(`Are you sure you want to delete "${mainSkill.name}" and all its sub-skills? This will remove it from all resources.`);
    if (!confirmed) {
        return;
    }

    // Remove from all engineers
    data.resources.forEach(resource => {
        delete resource.skills[mainSkill.name];
        if (resource.subSkills) {
            delete resource.subSkills[mainSkill.name];
        }
    });

    // Remove from skills list
    data.skills = data.skills.filter(s => s.id !== skillId);

    saveData(data);
    alert(`Main skill category "${mainSkill.name}" deleted successfully!`);

    document.getElementById('selectMainSkill').value = '';
    document.getElementById('deleteMainSkill').disabled = true;
    document.getElementById('subSkillsManagement').style.display = 'none';
    populateMainSkillSelect();
    renderDashboard();
}

function exportData() {
    const data = getData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skills-matrix-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            // Basic validation (support both old 'engineers' and new 'resources' format)
            if ((!importedData.engineers && !importedData.resources) || !importedData.skills) {
                throw new Error('Invalid data format');
            }

            const confirmed = await showConfirmModal('This will replace all current data. Continue?');
            if (confirmed) {
                saveData(importedData);
                alert('Data imported successfully!');
                location.reload();
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

async function resetData() {
    const confirmed = await showConfirmModal('This will reset all data to sample data. Continue?');
    if (!confirmed) {
        return;
    }

    saveData(sampleData);
    alert('Data reset to sample data!');
    location.reload();
}

// ==================== CUSTOM RADAR CHART ====================

let customRadarChart = null;

function populateSubSkillCheckboxes() {
    const data = getData();
    const container = document.getElementById('subSkillCheckboxes');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!data || !data.skills) {
        return;
    }

    // Collect all sub-skills organized by category
    data.skills.forEach((skillCategory, index) => {
        if (skillCategory.subSkills && skillCategory.subSkills.length > 0) {
            // Create collapsible category section
            const categorySection = document.createElement('div');
            categorySection.className = 'collapsible-category';
            if (index === 0) {
                categorySection.classList.add('expanded'); // First section open by default
            }

            // Create category header with select-all
            const header = document.createElement('div');
            header.className = 'category-header';

            // Toggle icon
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.textContent = index === 0 ? '▼' : '▶';

            // Select-all checkbox
            const selectAllCheckbox = document.createElement('input');
            selectAllCheckbox.type = 'checkbox';
            selectAllCheckbox.className = 'select-all-checkbox';
            selectAllCheckbox.dataset.category = skillCategory.name;

            // Category name
            const categoryName = document.createElement('span');
            categoryName.className = 'category-name';
            categoryName.textContent = skillCategory.name;

            // Skill count badge
            const skillCount = document.createElement('span');
            skillCount.className = 'skill-count';
            skillCount.textContent = `(${skillCategory.subSkills.length})`;

            header.appendChild(toggleIcon);
            header.appendChild(selectAllCheckbox);
            header.appendChild(categoryName);
            header.appendChild(skillCount);

            // Create checkboxes container
            const checkboxesContainer = document.createElement('div');
            checkboxesContainer.className = 'category-checkboxes';

            // Add checkboxes for each sub-skill
            skillCategory.subSkills.forEach(subSkill => {
                const checkboxItem = document.createElement('div');
                checkboxItem.className = 'checkbox-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `subskill-${subSkill.replace(/\s+/g, '-')}`;
                checkbox.value = subSkill;
                checkbox.dataset.category = skillCategory.name;
                checkbox.className = 'subskill-checkbox';

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = subSkill;

                checkboxItem.appendChild(checkbox);
                checkboxItem.appendChild(label);
                checkboxesContainer.appendChild(checkboxItem);
            });

            categorySection.appendChild(header);
            categorySection.appendChild(checkboxesContainer);
            container.appendChild(categorySection);

            // Add click handler for header (toggle collapse)
            header.addEventListener('click', (e) => {
                // Don't toggle if clicking on the select-all checkbox
                if (e.target === selectAllCheckbox) {
                    return;
                }

                categorySection.classList.toggle('expanded');
                toggleIcon.textContent = categorySection.classList.contains('expanded') ? '▼' : '▶';
            });

            // Add change handler for select-all checkbox
            selectAllCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const subSkillCheckboxes = checkboxesContainer.querySelectorAll('.subskill-checkbox');
                subSkillCheckboxes.forEach(cb => {
                    cb.checked = isChecked;
                });
            });

            // Add change handlers for individual checkboxes to update select-all state
            const subSkillCheckboxes = checkboxesContainer.querySelectorAll('.subskill-checkbox');
            subSkillCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const allChecked = Array.from(subSkillCheckboxes).every(checkbox => checkbox.checked);
                    const someChecked = Array.from(subSkillCheckboxes).some(checkbox => checkbox.checked);
                    selectAllCheckbox.checked = allChecked;
                    selectAllCheckbox.indeterminate = someChecked && !allChecked;
                });
            });
        }
    });
}

function getTop10ResourcesForSubSkill(subSkillName, category) {
    const data = getData();

    // Get all engineers with this sub-skill
    const engineersWithSkill = data.resources
        .map(eng => {
            const level = eng.subSkills?.[category]?.[subSkillName] || 0;
            return {
                name: eng.name,
                level: level
            };
        })
        .filter(eng => eng.level > 0)
        .sort((a, b) => b.level - a.level)
        .slice(0, 10);

    return engineersWithSkill;
}

function getTeamAverageForSubSkill(subSkillName, category) {
    const data = getData();

    const levels = data.resources
        .map(eng => eng.subSkills?.[category]?.[subSkillName] || 0)
        .filter(level => level > 0);

    if (levels.length === 0) return 0;

    const sum = levels.reduce((acc, level) => acc + level, 0);
    return sum / levels.length;
}

function renderCustomRadarChart() {
    const container = document.getElementById('subSkillCheckboxes');
    const selectedCheckboxes = container.querySelectorAll('input[type="checkbox"]:checked');

    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one sub-skill to display.');
        return;
    }

    const labels = [];
    const values = [];
    const skillsData = []; // Store category info for tooltip

    selectedCheckboxes.forEach(checkbox => {
        const subSkillName = checkbox.value;
        const category = checkbox.dataset.category;
        const avgLevel = getTeamAverageForSubSkill(subSkillName, category);

        labels.push(subSkillName);
        values.push(avgLevel);
        skillsData.push({ name: subSkillName, category: category });
    });

    const ctx = document.getElementById('customRadarChart').getContext('2d');

    if (customRadarChart) {
        customRadarChart.destroy();
    }

    customRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Team Average Level',
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const avgLevel = context.parsed.r.toFixed(2);
                            return `Team Average: ${avgLevel}`;
                        },
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const skillData = skillsData[index];
                            const top10 = getTop10ResourcesForSubSkill(skillData.name, skillData.category);

                            if (top10.length === 0) {
                                return '\n\nNo resources have this skill yet.';
                            }

                            let result = '\n\nTop 10 Resources:';
                            top10.forEach((eng, i) => {
                                result += `\n${i + 1}. ${eng.name} (Level ${eng.level})`;
                            });

                            return result;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    displayColors: false
                }
            }
        }
    });
}

function filterSubSkills() {
    const searchInput = document.getElementById('subSkillSearch');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const container = document.getElementById('subSkillCheckboxes');
    const checkboxItems = container.querySelectorAll('.checkbox-item');
    const categoryHeaders = container.querySelectorAll('.skill-category-header');

    let visibleCount = 0;
    let currentCategory = null;
    let categoryHasVisibleItems = false;

    // If search is empty, show everything
    if (searchTerm === '') {
        checkboxItems.forEach(item => item.style.display = 'flex');
        categoryHeaders.forEach(header => header.style.display = 'block');
        visibleCount = checkboxItems.length;
        document.getElementById('searchCount').textContent = `${visibleCount} sub-skills`;
        return;
    }

    // Hide all items first
    checkboxItems.forEach(item => item.style.display = 'none');
    categoryHeaders.forEach(header => header.style.display = 'none');

    // Helper function to check if search term matches (word boundary aware)
    function matchesSearch(text, term) {
        text = text.toLowerCase();
        term = term.toLowerCase();

        // Check if term appears as a whole word or at the start of a word
        // Use word boundary regex for better matching
        const regex = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return regex.test(text);
    }

    // Filter items based on search term
    const allElements = Array.from(container.children);

    allElements.forEach(element => {
        if (element.classList.contains('skill-category-header')) {
            // Save reference to current category header
            if (currentCategory) {
                // Show previous category if it had visible items
                if (categoryHasVisibleItems) {
                    currentCategory.style.display = 'block';
                }
            }
            currentCategory = element;
            categoryHasVisibleItems = false;
        } else if (element.classList.contains('checkbox-item')) {
            const label = element.querySelector('label');
            const skillName = label.textContent;
            const categoryName = currentCategory ? currentCategory.textContent : '';

            // Match if search term is in skill name OR category name (with word boundaries)
            if (matchesSearch(skillName, searchTerm) || matchesSearch(categoryName, searchTerm)) {
                element.style.display = 'flex';
                categoryHasVisibleItems = true;
                visibleCount++;
            }
        }
    });

    // Handle the last category
    if (currentCategory && categoryHasVisibleItems) {
        currentCategory.style.display = 'block';
    }

    // Update count display
    const countText = visibleCount === 1 ? '1 sub-skill' : `${visibleCount} sub-skills`;
    document.getElementById('searchCount').textContent = countText;
}

function setupCustomChartEventListeners() {
    document.getElementById('updateCustomChart').addEventListener('click', renderCustomRadarChart);

    document.getElementById('clearSubSkills').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#subSkillCheckboxes input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (customRadarChart) {
            customRadarChart.destroy();
            customRadarChart = null;
        }
    });

    // Setup search filter
    const searchInput = document.getElementById('subSkillSearch');
    searchInput.addEventListener('input', filterSubSkills);

    // Initialize count
    const totalCount = document.querySelectorAll('#subSkillCheckboxes .checkbox-item').length;
    document.getElementById('searchCount').textContent = `${totalCount} sub-skills`;
}

// ==================== ENGINEER MODAL ====================

let currentModalResourceId = null;

function openResourceModal(resourceId) {
    const data = getData();
    const resource = data.resources.find(e => e.id === resourceId);

    if (!resource) return;

    currentModalResourceId = resourceId;

    // Set resource name and email
    document.getElementById('modalResourceName').textContent = resource.name;
    document.getElementById('modalResourceEmail').textContent = resource.email;

    // Populate skills
    const container = document.getElementById('modalSkillsContainer');
    container.innerHTML = '';

    // Get all skill categories
    data.skills.forEach((skillCategory, index) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'modal-category';
        if (index !== 0) categoryDiv.classList.add('collapsed');

        const headerDiv = document.createElement('div');
        headerDiv.className = 'modal-category-header';
        headerDiv.onclick = () => {
            categoryDiv.classList.toggle('collapsed');
        };

        const h4 = document.createElement('h4');
        h4.textContent = skillCategory.name;

        const toggle = document.createElement('span');
        toggle.className = 'modal-category-toggle';
        toggle.textContent = '▼';

        headerDiv.appendChild(h4);
        headerDiv.appendChild(toggle);
        categoryDiv.appendChild(headerDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'modal-category-content';

        // Add all sub-skills for this category
        if (skillCategory.subSkills && skillCategory.subSkills.length > 0) {
            skillCategory.subSkills.forEach(subSkillName => {
                const currentLevel = resource.subSkills?.[skillCategory.name]?.[subSkillName] || 0;

                const skillItem = document.createElement('div');
                skillItem.className = 'modal-skill-item';

                const skillNameSpan = document.createElement('span');
                skillNameSpan.className = 'modal-skill-name';
                skillNameSpan.textContent = subSkillName;

                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'modal-skill-controls';

                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'modal-skill-input';
                input.min = '0';
                input.max = '5';
                input.value = currentLevel;
                input.dataset.category = skillCategory.name;
                input.dataset.skill = subSkillName;

                controlsDiv.appendChild(input);

                skillItem.appendChild(skillNameSpan);
                skillItem.appendChild(controlsDiv);

                contentDiv.appendChild(skillItem);
            });
        }

        categoryDiv.appendChild(contentDiv);
        container.appendChild(categoryDiv);
    });

    // Show modal
    document.getElementById('resourceModal').classList.add('show');
}

function closeResourceModal() {
    document.getElementById('resourceModal').classList.remove('show');
    currentModalResourceId = null;
}

// ==================== CONFIRMATION MODAL ====================

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmModalMessage');
        const yesBtn = document.getElementById('confirmModalYes');
        const noBtn = document.getElementById('confirmModalNo');

        messageEl.textContent = message;
        modal.classList.add('show');

        // Handle Yes button click
        const handleYes = () => {
            modal.classList.remove('show');
            cleanup();
            resolve(true);
        };

        // Handle No button click
        const handleNo = () => {
            modal.classList.remove('show');
            cleanup();
            resolve(false);
        };

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('show');
                cleanup();
                resolve(false);
            }
        };

        // Cleanup function to remove event listeners
        const cleanup = () => {
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
            document.removeEventListener('keydown', handleEsc);
        };

        // Attach event listeners
        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
        document.addEventListener('keydown', handleEsc);
    });
}

function saveResourceSkills() {
    if (!currentModalResourceId) return;

    const data = getData();
    const resource =data.resources.find(e => e.id === currentModalResourceId);

    if (!resource) return;

    // Initialize subSkills if not present
    if (!resource.subSkills) {
        resource.subSkills = {};
    }

    // Get all skill inputs
    const inputs = document.querySelectorAll('.modal-skill-input');

    inputs.forEach(input => {
        const category = input.dataset.category;
        const skillName = input.dataset.skill;
        const level = parseInt(input.value) || 0;

        if (!resource.subSkills[category]) {
            resource.subSkills[category] = {};
        }

        if (level > 0) {
            resource.subSkills[category][skillName] = level;
        } else {
            // Remove skill if level is 0
            delete resource.subSkills[category][skillName];
        }
    });

    // Recalculate main skills
    if (!resource.skills) {
        resource.skills = {};
    }

    data.skills.forEach(skillCategory => {
        const categorySkills = resource.subSkills[skillCategory.name];
        if (categorySkills) {
            const levels = Object.values(categorySkills).filter(l => l > 0);
            if (levels.length > 0) {
                const avg = levels.reduce((sum, level) => sum + level, 0) / levels.length;
                resource.skills[skillCategory.name] = Math.round(avg);
            } else {
                delete resource.skills[skillCategory.name];
            }
        } else {
            delete resource.skills[skillCategory.name];
        }
    });

    // Save data
    saveData(data);

    // Close modal
    closeResourceModal();

    // Refresh the search results
    renderSearch();

    alert('Skills updated successfully!');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('resourceModal');
    if (e.target === modal) {
        closeResourceModal();
    }
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    setupNavigation();
    updateLastUpdated();
    renderDashboard();
    populateSubSkillCheckboxes();
    setupCustomChartEventListeners();
});
