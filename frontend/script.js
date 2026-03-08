// ============================================================
// THEME TOGGLE
// ============================================================
(function () {
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    if (stored) html.setAttribute('data-theme', stored);

    function updateToggleLabel(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const span = btn.querySelector('span');
        if (span) span.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateToggleLabel(html.getAttribute('data-theme'));

        document.getElementById('themeToggle').addEventListener('click', function () {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateToggleLabel(next);
            // Re-render charts with correct colours if they exist
            if (typeof updateChartTheme === 'function') updateChartTheme();
        });
    });
})();

// Network Engineer Skills Matrix - Main JavaScript
// Author: Generated for Skills Matrix System
// Last Updated: 2026-01-29

// ==================== API CLIENT ====================

const API_BASE = '/api';

const API = {
    // Skills endpoints
    async getSkills() {
        const response = await fetch(`${API_BASE}/skills`);
        if (!response.ok) throw new Error('Failed to fetch skills');
        const result = await response.json();
        return result.data;
    },

    async getSkill(id) {
        const response = await fetch(`${API_BASE}/skills/${id}`);
        if (!response.ok) throw new Error('Failed to fetch skill');
        const result = await response.json();
        return result.data;
    },

    async createSkill(skill) {
        const response = await fetch(`${API_BASE}/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skill)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to create skill');
        }
        const result = await response.json();
        return result.data;
    },

    async updateSkill(id, skill) {
        const response = await fetch(`${API_BASE}/skills/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skill)
        });
        if (!response.ok) throw new Error('Failed to update skill');
        const result = await response.json();
        return result.data;
    },

    async deleteSkill(id) {
        const response = await fetch(`${API_BASE}/skills/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete skill');
        const result = await response.json();
        return result.data;
    },

    async getSubSkills(mainSkillId) {
        const response = await fetch(`${API_BASE}/skills/${mainSkillId}/sub-skills`);
        if (!response.ok) throw new Error('Failed to fetch sub-skills');
        const result = await response.json();
        return result.data;
    },

    async createSubSkill(mainSkillId, subSkill) {
        const response = await fetch(`${API_BASE}/skills/${mainSkillId}/sub-skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subSkill)
        });
        if (!response.ok) throw new Error('Failed to create sub-skill');
        const result = await response.json();
        return result.data;
    },

    async deleteSubSkill(mainSkillId, subSkillId) {
        const response = await fetch(`${API_BASE}/skills/${mainSkillId}/sub-skills/${subSkillId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete sub-skill');
        const result = await response.json();
        return result.data;
    },

    // Resources endpoints
    async getResources() {
        const response = await fetch(`${API_BASE}/resources`);
        if (!response.ok) throw new Error('Failed to fetch resources');
        const result = await response.json();
        return result.data;
    },

    async getResource(id) {
        const response = await fetch(`${API_BASE}/resources/${id}`);
        if (!response.ok) throw new Error('Failed to fetch resource');
        const result = await response.json();
        return result.data;
    },

    async createResource(resource) {
        const response = await fetch(`${API_BASE}/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resource)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to create resource');
        }
        const result = await response.json();
        return result.data;
    },

    async updateResource(id, resource) {
        const response = await fetch(`${API_BASE}/resources/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resource)
        });
        if (!response.ok) throw new Error('Failed to update resource');
        const result = await response.json();
        return result.data;
    },

    async deleteResource(id) {
        const response = await fetch(`${API_BASE}/resources/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete resource');
        const result = await response.json();
        return result.data;
    },

    // Metadata endpoint
    async getMetadata() {
        const response = await fetch(`${API_BASE}/metadata`);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        const result = await response.json();
        return result.data;
    }
};

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


async function initializeData() {
    console.log('initializeData - Testing API connection');
    try {
        // Test API connection by fetching data
        const data = await getData();
        console.log('API connected successfully:', data.resources.length, 'resources,', data.skills.length, 'skills');
        return true;
    } catch (error) {
        console.error('API connection failed:', error);
        alert('Warning: Could not connect to backend API. Some features may not work correctly.');
        return false;
    }
}

// Cache for data to avoid excessive API calls
let dataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5000; // 5 seconds

async function getData() {
    // Return cached data if fresh
    if (dataCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return dataCache;
    }

    try {
        // Fetch all data from API
        const [skills, resources, metadata] = await Promise.all([
            API.getSkills(),
            API.getResources(),
            API.getMetadata().catch(() => ({ lastUpdated: new Date().toISOString() }))
        ]);

        // Fetch full details for each resource
        const resourcesWithDetails = await Promise.all(
            resources.map(async (resource) => {
                try {
                    return await API.getResource(resource.id);
                } catch (err) {
                    console.error(`Failed to fetch resource ${resource.id}:`, err);
                    return resource;
                }
            })
        );

        // Transform skills data to match expected format
        const transformedSkills = await Promise.all(
            skills.map(async (skill) => {
                const subSkillsData = await API.getSubSkills(skill.id);
                return {
                    id: skill.id,
                    name: skill.name,
                    category: skill.category || 'Main Skill Category',
                    weight: skill.weight || 5,
                    skillType: skill.skillType || 'technical',
                    subSkills: subSkillsData.map(ss => ({
                        id: ss.id,
                        name: ss.name
                    }))
                };
            })
        );

        // Build data structure
        const data = {
            skills: transformedSkills,
            resources: resourcesWithDetails,
            metadata: {
                lastUpdated: metadata.lastUpdated || new Date().toISOString()
            }
        };

        // Update cache
        dataCache = data;
        cacheTimestamp = Date.now();

        return data;
    } catch (error) {
        console.error('ERROR: Failed to fetch data from API:', error);
        // Fallback to localStorage if API fails
        const localData = localStorage.getItem('skillsMatrixData');
        if (localData) {
            console.warn('Falling back to localStorage data');
            return JSON.parse(localData);
        }
        // Last resort: return sample data
        console.warn('WARNING: Using sample data as fallback');
        return sampleData;
    }
}

// Clear cache when data changes
function clearDataCache() {
    dataCache = null;
    cacheTimestamp = null;
}

// Old localStorage-based getData (keep as fallback)
function getDataFromLocalStorage() {
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

// Deprecated: Now using direct API calls instead of saveData()
function saveData(data) {
    console.warn('saveData() is deprecated - using API calls directly');
    // Keep for backward compatibility but data is saved via API now
    clearDataCache(); // Clear cache so next getData() fetches fresh data
}

async function updateLastUpdated() {
    try {
        const metadata = await API.getMetadata();
        const date = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = date.toLocaleString();
    } catch (error) {
        console.error('Failed to update last updated time:', error);
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    }
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const viewName = button.getAttribute('data-view');

            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`${viewName}-view`).classList.add('active');

            // Render the selected view
            await renderView(viewName);
        });
    });
}

async function renderView(viewName) {
    switch(viewName) {
        case 'dashboard':
            await renderDashboard();
            break;
        case 'heatmap':
            await renderHeatmap();
            break;
        case 'search':
            await renderSearch();
            break;
        case 'skills':
            await renderSkills();
            break;
        case 'management':
            await renderManagement();
            break;
    }
}

// ==================== NAVIGATION FUNCTIONS ====================

async function navigateToSearch() {
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
    await renderView('search');
}

function scrollToCustomRadar() {
    const customRadarSection = document.querySelector('.custom-chart-section');
    if (customRadarSection) {
        customRadarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ==================== DASHBOARD ====================

let teamRadarChart = null;

async function renderDashboard() {
    const data = await getData();

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

    // Calculate average skill levels for each skill, separated by type
    const technicalSkillAverages = {};
    const nonTechnicalSkillAverages = {};

    data.skills.forEach(skill => {
        let sum = 0;
        let count = 0;
        data.resources.forEach(resource => {
            if (resource.skills[skill.name]) {
                sum += resource.skills[skill.name];
                count++;
            }
        });
        const average = count > 0 ? sum / count : 0;

        // Separate by skill type
        if (skill.skillType === 'non-technical') {
            nonTechnicalSkillAverages[skill.name] = average;
        } else {
            // Default to technical if not specified
            technicalSkillAverages[skill.name] = average;
        }
    });

    // Render radar chart with both datasets
    renderRadarChart(technicalSkillAverages, nonTechnicalSkillAverages);

    // Combine for top/bottom skills display
    const allSkillAverages = { ...technicalSkillAverages, ...nonTechnicalSkillAverages };

    // Render top/bottom skills
    renderTopSkills(allSkillAverages);

    // Render weighted gap analysis
    renderWeightedGaps(data);
}

function renderRadarChart(technicalSkillAverages, nonTechnicalSkillAverages) {
    const ctx = document.getElementById('teamRadarChart').getContext('2d');

    // Get all unique skill names from both technical and non-technical
    const allSkillNames = new Set([
        ...Object.keys(technicalSkillAverages),
        ...Object.keys(nonTechnicalSkillAverages)
    ]);

    // Filter out skills with 0 average in both categories
    const labels = Array.from(allSkillNames).filter(skillName => {
        const techAvg = technicalSkillAverages[skillName] || 0;
        const nonTechAvg = nonTechnicalSkillAverages[skillName] || 0;
        return techAvg > 0 || nonTechAvg > 0;
    });

    // Create data arrays for each dataset
    const techData = labels.map(label => technicalSkillAverages[label] || 0);
    const nonTechData = labels.map(label => nonTechnicalSkillAverages[label] || 0);

    if (teamRadarChart) {
        teamRadarChart.destroy();
    }

    teamRadarChart = window._teamRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tech',
                data: techData,
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(37, 99, 235, 1)'
            }, {
                label: 'Non-Tech',
                data: nonTechData,
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
                    position: 'top',
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);

                        // Toggle visibility
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    },
                    labels: {
                        generateLabels: (chart) => {
                            const datasets = chart.data.datasets;
                            return datasets.map((dataset, i) => ({
                                text: dataset.label,
                                fillStyle: dataset.backgroundColor,
                                strokeStyle: dataset.borderColor,
                                lineWidth: dataset.borderWidth,
                                hidden: !chart.isDatasetVisible(i),
                                datasetIndex: i
                            }));
                        }
                    }
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

function renderWeightedGaps(data) {
    const container = document.getElementById('weightedGaps');
    if (!container) return;

    // Calculate gap scores for all skills
    const gapScores = data.skills.map(skill => {
        // Calculate current average for this skill
        let sum = 0;
        let count = 0;
        data.resources.forEach(resource => {
            if (resource.skills[skill.name]) {
                sum += resource.skills[skill.name];
                count++;
            }
        });
        const currentAvg = count > 0 ? sum / count : 0;

        // Gap Score = (Max Level - Current Avg) × Weight
        const maxLevel = 5;
        const gap = maxLevel - currentAvg;
        const gapScore = gap * (skill.weight || 5);

        return {
            name: skill.name,
            currentAvg: currentAvg,
            weight: skill.weight || 5,
            gap: gap,
            gapScore: gapScore,
            skillType: skill.skillType || 'technical'
        };
    });

    // Sort by gap score descending and take top 10
    const topGaps = gapScores
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, 10);

    // Render the list
    container.innerHTML = topGaps.map((item, index) => {
        const priorityClass = item.gapScore > 30 ? 'critical' : item.gapScore > 20 ? 'high' : item.gapScore > 10 ? 'medium' : 'low';
        const typeColor = item.skillType === 'non-technical' ? '#10b981' : '#2563eb';

        return `
            <li class="weighted-gap-item priority-${priorityClass}">
                <div class="gap-rank">#${index + 1}</div>
                <div class="gap-info">
                    <div class="gap-name">
                        <span style="color: ${typeColor}; font-weight: 600;">${item.name}</span>
                        <span class="weight-badge" title="Demand/Priority Weight">W: ${item.weight}/10</span>
                    </div>
                    <div class="gap-details">
                        <span>Current: ${item.currentAvg.toFixed(1)}/5</span>
                        <span>Gap: ${item.gap.toFixed(1)}</span>
                        <span class="gap-score-badge" title="Priority Score = Gap × Weight">${item.gapScore.toFixed(1)}</span>
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

// ==================== HEATMAP ====================

async function renderHeatmap(sortBy = 'name') {
    const data = await getData();
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

let resourcesEventListenersAdded = false;

async function renderSearch() {
    const data = await getData();
    const searchInput = document.getElementById('resourceSearch');
    const resultsContainer = document.getElementById('searchResults');

    // Display all resources initially
    displaySearchResults(data.resources);

    // Only add event listeners once
    if (!resourcesEventListenersAdded) {
        // Search input listener
        searchInput.addEventListener('input', async (e) => {
            const currentData = await getData();
            const query = e.target.value.toLowerCase();
            const filtered = currentData.resources.filter(eng =>
                eng.name.toLowerCase().includes(query) ||
                (eng.email && eng.email.toLowerCase().includes(query)) ||
                (eng.email && eng.email.toLowerCase().includes(query))
            );
            displaySearchResults(filtered);
        });

        // Event delegation for all button clicks
        resultsContainer.addEventListener('click', async (e) => {
            const target = e.target;

            // Delete button
            if (target.classList.contains('delete-resource-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const resourceId = target.dataset.resourceId;
                const resourceName = target.dataset.resourceName;
                console.log('Delete resource button clicked!', resourceId, resourceName);
                try {
                    await deleteResource(resourceId, resourceName);
                } catch (error) {
                    console.error('Error deleting resource:', error);
                }
            }

            // View button - handled by existing code below
            // Edit button - handled by existing code below
        });

        resourcesEventListenersAdded = true;
    }
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

        const safeName = eng.name.replace(/"/g, '&quot;');

        // Debug: Log what fields this resource has
        if (!eng.email) {
            console.log('Resource missing email:', eng.id, eng.name, 'Fields:', Object.keys(eng));
        }

        const displayEmail = eng.email || 'No email/username';
        return `
            <div class="resource-card" data-resource-id="${eng.id}" style="position: relative;">
                <button class="delete-resource-btn" data-resource-id="${eng.id}" data-resource-name="${safeName}">×</button>
                <h4>${eng.name}</h4>
                <p style="color: var(--text-light); font-size: 0.9rem;"><strong>Email/Username:</strong> ${displayEmail}</p>
                <p><strong>${subSkillCount}</strong> skills</p>
                <div class="resource-card-actions">
                    <button class="btn-view" data-resource-id="${eng.id}">View</button>
                    <button class="btn-edit" data-resource-id="${eng.id}">Edit</button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for buttons and hover
    const cards = resultsContainer.querySelectorAll('.resource-card');
    console.log('Setting up event listeners for', cards.length, 'cards');

    cards.forEach((card, index) => {
        const resourceId = card.getAttribute('data-resource-id');
        const resource = resources.find(e => e.id === resourceId);

        if (!resource) {
            console.warn('Resource not found for card:', resourceId);
            return;
        }

        // Delete button - prevent tooltip
        const deleteBtn = card.querySelector('.delete-resource-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                clearTimeout(hoverTimeout);
                hideResourceTooltip();
            });
        }

        // View button
        const viewBtn = card.querySelector('.btn-view');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showResourceProfile(resourceId);
            });
            viewBtn.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                clearTimeout(hoverTimeout);
            });
        }

        // Edit button
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openResourceModal(resourceId);
            });
            editBtn.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                clearTimeout(hoverTimeout);
            });
        }

        // Hover: show tooltip with 250ms delay (0.25 seconds)
        let hoverTimeout;
        card.addEventListener('mouseenter', (e) => {
            console.log('MOUSEENTER on card for:', resource.name, 'Target:', e.target.tagName, 'Classes:', e.target.className);

            // Don't show tooltip if hovering over buttons or delete button
            if (e.target.tagName === 'BUTTON' ||
                e.target.classList.contains('delete-resource-btn') ||
                e.target.classList.contains('btn-view') ||
                e.target.classList.contains('btn-edit')) {
                console.log('Skipping tooltip - hovering over button');
                return;
            }

            // Check if the actual hover target is a button (in case of event delegation)
            if (e.relatedTarget && e.relatedTarget.classList &&
                (e.relatedTarget.classList.contains('delete-resource-btn') ||
                 e.relatedTarget.classList.contains('btn-view') ||
                 e.relatedTarget.classList.contains('btn-edit'))) {
                console.log('Skipping tooltip - coming from button');
                return;
            }

            console.log('Starting 250ms timeout for tooltip');
            hoverTimeout = setTimeout(() => {
                console.log('Timeout fired - showing tooltip now');
                showResourceTooltip(card, resource);
            }, 250); // 250 milliseconds = 0.25 seconds
        });

        card.addEventListener('mouseleave', (e) => {
            console.log('MOUSELEAVE from card');
            clearTimeout(hoverTimeout);
            hideResourceTooltip();
        });
    });
}

function showResourceTooltip(cardElement, resource) {
    // Check if element still exists
    if (!cardElement || !resource) return;

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

async function showResourceProfile(resourceId) {
    const data = await getData();
    const resource = data.resources.find(e => e.id === resourceId);

    if (!resource) return;

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

    // Display in modal instead of inline
    const modalContent = document.getElementById('modalProfileContent');
    modalContent.innerHTML = html;

    // Show modal
    const modal = document.getElementById('profileModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Render individual radar chart
    // Use setTimeout to ensure canvas is rendered
    setTimeout(() => {
        renderResourceRadar(resource, allSkills);
    }, 100);
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const profileModal = document.getElementById('profileModal');
        if (profileModal && profileModal.style.display === 'flex') {
            closeProfileModal();
        }
    }
});

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

// ==================== SKILLS MANAGEMENT ====================

let currentModalSkillId = null;

let skillsEventListenersAdded = false;

async function renderSkills() {
    const data = await getData();
    const searchInput = document.getElementById('skillSearch');
    const resultsContainer = document.getElementById('skillsResults');

    // Display all skills initially
    displaySkillCards(data.skills);

    // Only add event listeners once
    if (!skillsEventListenersAdded) {
        // Search input listener
        searchInput.addEventListener('input', async (e) => {
            const currentData = await getData();
            const query = e.target.value.toLowerCase();
            const filtered = currentData.skills.filter(skill =>
                skill.name.toLowerCase().includes(query) ||
                (skill.skillType && skill.skillType.toLowerCase().includes(query))
            );
            displaySkillCards(filtered);
        });

        // Event delegation for all button clicks
        resultsContainer.addEventListener('click', async (e) => {
            const target = e.target;

            // Delete button
            if (target.classList.contains('delete-skill-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const skillId = target.dataset.skillId;
                const skillName = target.dataset.skillName;
                console.log('Delete button clicked!', skillId, skillName);
                console.log('deleteMainSkill function type:', typeof deleteMainSkill);
                console.log('About to call deleteMainSkill...');
                try {
                    const result = await deleteMainSkill(skillId, skillName);
                    console.log('deleteMainSkill completed, result:', result);
                } catch (error) {
                    console.error('Error calling deleteMainSkill:', error, error.stack);
                }
            }

            // View button
            if (target.classList.contains('btn-view')) {
                e.preventDefault();
                const skillId = target.dataset.skillId;
                viewSkillDetails(skillId);
            }

            // Edit button
            if (target.classList.contains('btn-edit')) {
                e.preventDefault();
                const skillId = target.dataset.skillId;
                openSkillModal(skillId);
            }
        });

        skillsEventListenersAdded = true;
    }
}

function displaySkillCards(skills) {
    const resultsContainer = document.getElementById('skillsResults');

    if (!skills || skills.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-light);">No skills found</p>';
        return;
    }

    resultsContainer.innerHTML = skills.map(skill => {
        const subSkillCount = skill.subSkills ? skill.subSkills.length : 0;
        const typeColor = skill.skillType === 'non-technical' ? '#10b981' : '#2563eb';
        const typeBadge = skill.skillType === 'non-technical' ? 'Non-Tech' : 'Tech';
        const safeName = skill.name.replace(/"/g, '&quot;');

        return `
            <div class="resource-card" data-skill-id="${skill.id}" style="position: relative;">
                <button class="delete-skill-btn" data-skill-id="${skill.id}" data-skill-name="${safeName}">×</button>
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0;">${skill.name}</h4>
                    <span style="background: ${typeColor}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${typeBadge}</span>
                </div>
                <p style="color: var(--text-light); font-size: 0.9rem; margin: 0.5rem 0;"><strong>Weight:</strong> ${skill.weight || 5}/10</p>
                <p style="color: var(--text-light); font-size: 0.9rem;"><strong>${subSkillCount}</strong> sub-skills</p>
                <div class="resource-card-actions">
                    <button class="btn-view" data-skill-id="${skill.id}">View</button>
                    <button class="btn-edit" data-skill-id="${skill.id}">Edit</button>
                </div>
            </div>
        `;
    }).join('');
    // Event listeners are handled by event delegation in renderSkills()
}

async function viewSkillDetails(skillId) {
    const data = await getData();
    const skill = data.skills.find(s => s.id === skillId);
    if (!skill) return;

    const subSkillsList = skill.subSkills && skill.subSkills.length > 0
        ? skill.subSkills.map(ss => {
            const name = typeof ss === 'string' ? ss : ss.name;
            return `<li style="padding: 0.25rem 0;">${name}</li>`;
        }).join('')
        : '<li style="color: var(--text-light);">No sub-skills</li>';

    alert(`Skill: ${skill.name}\n\nType: ${skill.skillType || 'technical'}\nWeight: ${skill.weight || 5}/10\n\nSub-Skills:\n${skill.subSkills && skill.subSkills.length > 0 ? skill.subSkills.map(ss => typeof ss === 'string' ? ss : ss.name).join(', ') : 'None'}`);
}

async function openSkillModal(skillId) {
    const data = await getData();
    const skill = data.skills.find(s => s.id === skillId);
    if (!skill) return;

    currentModalSkillId = skillId;

    document.getElementById('modalSkillNameInput').value = skill.name;
    document.getElementById('modalSkillType').textContent = skill.skillType || 'technical';
    document.getElementById('modalSkillWeightInput').value = skill.weight || 5;

    // Display sub-skills
    displayModalSubSkills(skill.subSkills || []);

    // Show modal
    const modal = document.getElementById('skillModal');
    console.log('Opening skill modal, modal element:', modal);
    modal.classList.add('show');

    // Test: Add click handler to modal backdrop
    modal.onclick = (e) => {
        if (e.target === modal) {
            console.log('Modal backdrop clicked');
            closeSkillModal();
        }
    };

    // Set up close button listener
    const closeBtn = modal.querySelector('.modal-close');
    console.log('Close button found:', closeBtn);
    if (closeBtn) {
        // Remove existing listeners by cloning
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        console.log('Event listener attached to close button');
        newCloseBtn.addEventListener('click', (e) => {
            console.log('!!! CLOSE BUTTON CLICKED !!!');
            e.preventDefault();
            e.stopPropagation();
            closeSkillModal();
        });

        // Also add test with direct onclick
        newCloseBtn.onclick = (e) => {
            console.log('!!! ONCLICK FIRED !!!');
            e.preventDefault();
            closeSkillModal();
        };
    } else {
        console.error('Close button NOT found in modal');
    }

    // Set up add sub-skill button - just adds to UI, saves on "Save & Close"
    document.getElementById('addSubSkillModal').onclick = () => {
        const input = document.getElementById('newSubSkillModal');
        const subSkillName = input.value.trim();
        if (!subSkillName) {
            alert('Please enter a sub-skill name');
            return;
        }

        // Get current sub-skills
        const container = document.getElementById('subSkillsListModal');
        const currentSubSkills = Array.from(container.querySelectorAll('.sub-skill-name')).map(el => ({
            name: el.textContent.trim()
        }));

        // Add the new one
        currentSubSkills.push({ name: subSkillName });

        // Re-display
        displayModalSubSkills(currentSubSkills);
        input.value = '';
    };
}

function displayModalSubSkills(subSkills) {
    const container = document.getElementById('subSkillsListModal');

    if (!subSkills || subSkills.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); padding: 1rem;">No sub-skills yet</p>';
        return;
    }

    container.innerHTML = subSkills.map(subSkill => {
        const subSkillName = typeof subSkill === 'string' ? subSkill : subSkill.name;
        const subSkillId = typeof subSkill === 'object' ? subSkill.id : null;

        return `
            <div class="sub-skill-tag" style="margin: 0.5rem 0;">
                <span class="sub-skill-name">${subSkillName}</span>
                <button class="delete-sub-skill-btn" onclick="deleteModalSubSkill('${subSkillName}', ${subSkillId})">×</button>
            </div>
        `;
    }).join('');
}

async function deleteModalSubSkill(subSkillName, subSkillId) {
    console.log('Deleting sub-skill:', subSkillName);
    // Just remove from UI - will be saved on "Save & Close"
    const container = document.getElementById('subSkillsListModal');
    const subSkillElements = container.querySelectorAll('.sub-skill-tag');
    subSkillElements.forEach(el => {
        if (el.textContent.includes(subSkillName)) {
            el.remove();
        }
    });
}

async function saveSkillChanges() {
    if (!currentModalSkillId) return;

    const newName = document.getElementById('modalSkillNameInput').value.trim();
    const newWeight = parseInt(document.getElementById('modalSkillWeightInput').value);

    if (!newName) {
        alert('Please enter a skill name');
        return;
    }

    if (isNaN(newWeight) || newWeight < 1 || newWeight > 10) {
        alert('Please enter a weight between 1 and 10');
        return;
    }

    // Collect current sub-skills from the UI
    const subSkillElements = document.querySelectorAll('#subSkillsListModal .sub-skill-name');
    const subSkills = Array.from(subSkillElements).map(el => el.textContent.trim());

    try {
        await API.updateSkill(currentModalSkillId, {
            name: newName,
            weight: newWeight,
            subSkills: subSkills
        });
        clearDataCache();
        await renderSkills();
        closeSkillModal();
        console.log('Skill changes saved successfully');
    } catch (error) {
        console.error('Failed to save skill changes:', error);
        alert(`Error saving skill changes: ${error.message}`);
    }
}

function closeSkillModal() {
    console.log('Closing skill modal');
    const modal = document.getElementById('skillModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('Modal show class removed');
    } else {
        console.error('skillModal element not found');
    }
    currentModalSkillId = null;
    const input = document.getElementById('newSubSkillModal');
    if (input) {
        input.value = '';
    }
}

// Make sure the function is globally accessible
window.closeSkillModal = closeSkillModal;

async function deleteMainSkill(skillId, skillName) {
    console.log('!!! DELETE BUTTON CLICKED !!!', 'skillId:', skillId, 'skillName:', skillName);
    console.log('showConfirmModal function exists:', typeof showConfirmModal);

    try {
        // Use custom confirm modal
        console.log('About to call showConfirmModal...');
        const confirmed = await showConfirmModal(`Are you sure you want to delete "${skillName}"?\n\nThis will remove it from all resources and delete all its sub-skills.`);
        console.log('Confirmation result:', confirmed);

        if (!confirmed) {
            console.log('User cancelled deletion');
            return;
        }

        console.log('Calling API.deleteSkill...');
        await API.deleteSkill(skillId);
        clearDataCache();
        await renderSkills();
        console.log('Skill deleted successfully');
    } catch (error) {
        console.error('Error in deleteMainSkill:', error);
        alert(`Error: ${error.message}`);
    }
}

async function deleteResource(resourceId, resourceName) {
    console.log('!!! DELETE RESOURCE CLICKED !!!', 'resourceId:', resourceId, 'resourceName:', resourceName);
    console.log('About to show confirm modal for resource deletion');

    try {
        const confirmed = await showConfirmModal(`Are you sure you want to delete "${resourceName}"?\n\nThis will permanently remove this resource and all their skill data.`);
        console.log('Resource deletion confirmation result:', confirmed);

        if (!confirmed) {
            console.log('User cancelled deletion');
            return;
        }

        console.log('Calling API.deleteResource...');
        await API.deleteResource(resourceId);
        clearDataCache();
        await renderSearch();
        console.log('Resource deleted successfully');
    } catch (error) {
        console.error('Error in deleteResource:', error);
        alert(`Error: ${error.message}`);
    }
}

function openAddSkillModal() {
    const modal = document.getElementById('addSkillModal');
    modal.classList.add('show');

    // Set up close button listener
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close add skill modal clicked via event listener');
            closeAddSkillModal();
        });
    }

    // Track sub-skills being added
    let newSkillSubSkills = [];

    // Set up add sub-skill button
    document.getElementById('addNewSkillSubSkillBtn').onclick = () => {
        const input = document.getElementById('newSkillSubSkillInput');
        const subSkillName = input.value.trim();

        if (!subSkillName) {
            alert('Please enter a sub-skill name');
            return;
        }

        // Add to list
        newSkillSubSkills.push(subSkillName);
        input.value = '';

        // Display updated list
        displayNewSkillSubSkills(newSkillSubSkills);
    };

    // Function to display sub-skills in the add modal
    function displayNewSkillSubSkills(subSkills) {
        const container = document.getElementById('newSkillSubSkillsList');
        if (subSkills.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light); padding: 0.5rem;">No sub-skills added yet</p>';
            return;
        }

        container.innerHTML = subSkills.map((subSkillName, index) => `
            <div class="sub-skill-tag" style="margin: 0.5rem 0;">
                <span class="sub-skill-name">${subSkillName}</span>
                <button class="delete-sub-skill-btn" onclick="removeNewSubSkill(${index})">×</button>
            </div>
        `).join('');
    }

    // Function to remove sub-skill from new list
    window.removeNewSubSkill = (index) => {
        newSkillSubSkills.splice(index, 1);
        displayNewSkillSubSkills(newSkillSubSkills);
    };

    // Initialize empty list display
    displayNewSkillSubSkills(newSkillSubSkills);

    // Set up create button
    document.getElementById('createSkillBtn').onclick = async () => {
        const name = document.getElementById('newSkillName').value.trim();
        const skillType = document.getElementById('newSkillType').value;
        const weight = parseInt(document.getElementById('newSkillWeight').value);

        if (!name) {
            alert('Please enter a skill name');
            return;
        }

        if (isNaN(weight) || weight < 1 || weight > 10) {
            alert('Please enter a weight between 1 and 10');
            return;
        }

        try {
            const skillData = {
                id: `skill-${Date.now()}`,
                name: name,
                category: name, // Use name as category
                skillType: skillType,
                weight: weight,
                subSkills: newSkillSubSkills
            };
            console.log('Creating skill with data:', skillData);
            await API.createSkill(skillData);
            clearDataCache();
            await renderSkills();
            closeAddSkillModal();
            newSkillSubSkills = []; // Clear the array
            console.log('Skill created successfully');
        } catch (error) {
            console.error('Failed to create skill:', error);
            alert(`Error creating skill: ${error.message}`);
        }
    };
}

function closeAddSkillModal() {
    console.log('Closing add skill modal');
    const modal = document.getElementById('addSkillModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('newSkillName').value = '';
    document.getElementById('newSkillType').value = 'technical';
    document.getElementById('newSkillWeight').value = '5';
    document.getElementById('newSkillSubSkillInput').value = '';
    document.getElementById('newSkillSubSkillsList').innerHTML = '';
}

function openAddResourceModal() {
    const modal = document.getElementById('addResourceModal');
    modal.classList.add('show');

    // Set up create button
    document.getElementById('createResourceBtn').onclick = async () => {
        const name = document.getElementById('newResourceName').value.trim();
        const email = document.getElementById('newResourceEmail').value.trim();
        const password = document.getElementById('newResourcePassword').value.trim();

        if (!name) {
            alert('Please enter a name');
            return;
        }

        if (!email) {
            alert('Please enter an email/username');
            return;
        }

        if (!password) {
            alert('Please enter a password');
            return;
        }

        try {
            const resourceData = {
                id: `eng-${Date.now()}`,
                name: name,
                email: email,
                password: password
            };
            console.log('Creating resource with data:', resourceData);
            const result = await API.createResource(resourceData);
            console.log('Create resource result:', result);
            clearDataCache();
            await renderSearch();
            closeAddResourceModal();
            console.log('Resource created successfully');
        } catch (error) {
            console.error('Failed to create resource:', error);
            alert(`Error creating resource: ${error.message}`);
        }
    };
}

function closeAddResourceModal() {
    const modal = document.getElementById('addResourceModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('newResourceName').value = '';
    document.getElementById('newResourceEmail').value = '';
    document.getElementById('newResourcePassword').value = '';
}

// Make all skills and resources management functions globally accessible
window.closeAddSkillModal = closeAddSkillModal;
window.openAddSkillModal = openAddSkillModal;
window.openSkillModal = openSkillModal;
window.saveSkillChanges = saveSkillChanges;
window.viewSkillDetails = viewSkillDetails;
window.deleteMainSkill = deleteMainSkill;
window.deleteResource = deleteResource;
window.deleteModalSubSkill = deleteModalSubSkill;
window.displaySkillCards = displaySkillCards;
window.openAddResourceModal = openAddResourceModal;
window.closeAddResourceModal = closeAddResourceModal;

// ==================== DATA MANAGEMENT ====================

function renderManagement() {
    populateResourceSelect();
    populateMainSkillSelect();
    setupManagementEventListeners();
}

async function populateResourceSelect() {
    const data = await getData();
    const select = document.getElementById('selectResource');

    select.innerHTML = '<option value="">-- Choose Resource --</option>';
    data.resources.forEach(eng => {
        select.innerHTML += `<option value="${eng.id}">${eng.name}</option>`;
    });
}

async function populateMainSkillSelect() {
    const data = await getData();
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
    document.getElementById('changePassword').addEventListener('click', openChangePasswordModal);
    document.getElementById('deleteResource').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        deleteResourceFromManagement();
    });

    // Main Skill Management
    document.getElementById('addMainSkill').addEventListener('click', addMainSkill);
    document.getElementById('selectMainSkill').addEventListener('change', onMainSkillSelect);
    document.getElementById('editMainSkill').addEventListener('click', startEditMainSkill);
    document.getElementById('saveMainSkillName').addEventListener('click', saveMainSkillName);
    document.getElementById('cancelEditMainSkill').addEventListener('click', cancelEditMainSkill);
    document.getElementById('deleteMainSkill').addEventListener('click', deleteMainSkillFromManagement);

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

async function addResource() {
    const name = document.getElementById('resourceName').value.trim();
    const email = document.getElementById('resourceEmail').value.trim();
    const password = document.getElementById('resourcePassword').value;

    if (!name || !email) {
        alert('Please enter both name and email.');
        return;
    }

    try {
        // Create resource via API
        await API.createResource({
            id: `eng-${Date.now()}`,
            name: name,
            email: email,
            password: password || undefined // Include password if provided
        });

        // Clear form
        document.getElementById('resourceName').value = '';
        document.getElementById('resourceEmail').value = '';
        document.getElementById('resourcePassword').value = '';

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Resource "${name}" added successfully!`);
        await populateResourceSelect();
        await renderDashboard();
    } catch (error) {
        console.error('Failed to add resource:', error);
        alert(`Error adding resource: ${error.message}`);
    }
}

async function onResourceSelect() {
    const resourceId = document.getElementById('selectResource').value;

    if (!resourceId) {
        document.getElementById('updateResource').disabled = true;
        document.getElementById('changePassword').disabled = true;
        document.getElementById('deleteResource').disabled = true;
        document.getElementById('resourceSkillsEdit').innerHTML = '';
        return;
    }

    document.getElementById('updateResource').disabled = false;
    document.getElementById('changePassword').disabled = false;
    document.getElementById('deleteResource').disabled = false;

    const data = await getData();
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

async function updateResource() {
    const resourceId = document.getElementById('selectResource').value;
    if (!resourceId) return;

    try {
        // Collect sub-skills from inputs
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

        // Update resource via API
        await API.updateResource(resourceId, {
            subSkills: subSkillsByCategory
        });

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Resource updated successfully! Main skills recalculated from sub-skills.`);
        await renderDashboard();

        // Refresh the editor to show updated values
        onResourceSelect();
    } catch (error) {
        console.error('Failed to update resource:', error);
        alert(`Error updating resource: ${error.message}`);
    }
}

async function deleteResourceFromManagement() {
    const resourceId = document.getElementById('selectResource').value;

    if (!resourceId) {
        alert('Please select a resource to delete.');
        return;
    }

    try {
        // Get resource details first
        const data = await getData();
        const resource = data.resources.find(e => e.id === resourceId);

        if (!resource) {
            alert('Resource not found.');
            return;
        }

        const confirmed = await showConfirmModal(`Are you sure you want to delete "${resource.name}"?`);
        if (!confirmed) {
            return;
        }

        // Delete via API
        await API.deleteResource(resourceId);

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Resource "${resource.name}" deleted successfully!`);
        document.getElementById('selectResource').value = '';
        document.getElementById('resourceSkillsEdit').innerHTML = '';
        document.getElementById('updateResource').disabled = true;
        document.getElementById('changePassword').disabled = true;
        document.getElementById('deleteResource').disabled = true;
        await populateResourceSelect();
        await renderDashboard();
    } catch (error) {
        console.error('Failed to delete resource:', error);
        alert(`Error deleting resource: ${error.message}`);
    }
}

async function addMainSkill() {
    const name = document.getElementById('newMainSkill').value.trim();
    const weight = parseInt(document.getElementById('newMainSkillWeight').value) || 5;
    const skillType = document.getElementById('newMainSkillType').value || 'technical';

    if (!name) {
        alert('Please enter a main skill category name.');
        return;
    }

    if (weight < 1 || weight > 10) {
        alert('Weight must be between 1 and 10.');
        return;
    }

    try {
        // Create skill via API
        await API.createSkill({
            id: `skill-${Date.now()}`,
            name: name,
            category: 'Main Skill Category',
            weight: weight,
            skillType: skillType
        });

        // Clear form
        document.getElementById('newMainSkill').value = '';
        document.getElementById('newMainSkillWeight').value = '5';
        document.getElementById('newMainSkillType').value = 'technical';

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Main skill category "${name}" added successfully!`);
        await populateMainSkillSelect();
        await renderDashboard();
    } catch (error) {
        console.error('Failed to add main skill:', error);
        alert(`Error adding skill: ${error.message}`);
    }
}

async function onMainSkillSelect() {
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

    const data = await getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    // Display sub-skills list
    displaySubSkills(mainSkill);
}

async function startEditMainSkill() {
    const skillId = document.getElementById('selectMainSkill').value;
    if (!skillId) return;

    const data = await getData();
    const mainSkill = data.skills.find(s => s.id === skillId);

    if (!mainSkill) return;

    // Show edit section with current values
    document.getElementById('editMainSkillName').value = mainSkill.name;
    document.getElementById('editMainSkillWeight').value = mainSkill.weight || 5;
    document.getElementById('editMainSkillType').value = mainSkill.skillType || 'technical';

    document.getElementById('editMainSkillSection').style.display = 'block';
    document.getElementById('editMainSkillWeightSection').style.display = 'block';
    document.getElementById('editMainSkillTypeSection').style.display = 'block';
    document.getElementById('editMainSkill').style.display = 'none';
    document.getElementById('saveMainSkillName').style.display = 'inline-block';
    document.getElementById('cancelEditMainSkill').style.display = 'inline-block';
    document.getElementById('deleteMainSkill').disabled = true;
    document.getElementById('selectMainSkill').disabled = true;
}

function cancelEditMainSkill() {
    document.getElementById('editMainSkillSection').style.display = 'none';
    document.getElementById('editMainSkillWeightSection').style.display = 'none';
    document.getElementById('editMainSkillTypeSection').style.display = 'none';
    document.getElementById('editMainSkill').style.display = 'inline-block';
    document.getElementById('saveMainSkillName').style.display = 'none';
    document.getElementById('cancelEditMainSkill').style.display = 'none';
    document.getElementById('deleteMainSkill').disabled = false;
    document.getElementById('selectMainSkill').disabled = false;
}

async function saveMainSkillName() {
    const skillId = document.getElementById('selectMainSkill').value;
    const newName = document.getElementById('editMainSkillName').value.trim();
    const newWeight = parseInt(document.getElementById('editMainSkillWeight').value) || 5;
    const newSkillType = document.getElementById('editMainSkillType').value || 'technical';

    if (!skillId || !newName) {
        alert('Please enter a valid category name.');
        return;
    }

    if (newWeight < 1 || newWeight > 10) {
        alert('Weight must be between 1 and 10.');
        return;
    }

    try {
        // Update skill via API
        await API.updateSkill(skillId, {
            name: newName,
            weight: newWeight,
            skillType: newSkillType,
            category: 'Main Skill Category'
        });

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Skill category updated successfully!`);

        // Refresh the select dropdown
        await populateMainSkillSelect();
        document.getElementById('selectMainSkill').value = skillId;

        // Cancel edit mode
        cancelEditMainSkill();

        // Refresh dashboard
        await renderDashboard();
    } catch (error) {
        console.error('Failed to update skill:', error);
        alert(`Error updating skill: ${error.message}`);
    }
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
        const subSkillName = typeof subSkill === 'string' ? subSkill : subSkill.name;
        html += `
            <div class="sub-skill-tag" data-subskill="${subSkillName.replace(/"/g, '&quot;')}">
                <span class="sub-skill-name">${subSkillName}</span>
                <button class="edit-sub-skill-btn" onclick="startEditSubSkill('${mainSkill.id}', '${subSkillName.replace(/'/g, "\\'")}')">✎</button>
                <button class="delete-sub-skill-btn" onclick="deleteSubSkill('${mainSkill.id}', '${subSkillName.replace(/'/g, "\\'")}')">×</button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

async function addSubSkill() {
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

    try {
        // Create sub-skill via API
        await API.createSubSkill(skillId, {
            id: `subskill-${Date.now()}`,
            name: subSkillName
        });

        // Clear form
        document.getElementById('newSubSkill').value = '';

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Sub-skill "${subSkillName}" added successfully!`);

        // Refresh sub-skills display
        const data = await getData();
        const mainSkill = data.skills.find(s => s.id === skillId);
        displaySubSkills(mainSkill);
    } catch (error) {
        console.error('Failed to add sub-skill:', error);
        alert(`Error adding sub-skill: ${error.message}`);
    }
}

async function deleteSubSkill(mainSkillId, subSkillName) {
    const confirmed = await showConfirmModal(`Are you sure you want to delete the sub-skill "${subSkillName}"? This will remove it from all resources.`);
    if (!confirmed) {
        return;
    }

    try {
        // Get data to find the subSkillId
        const data = await getData();
        const mainSkill = data.skills.find(s => s.id === mainSkillId);
        const subSkill = mainSkill.subSkills.find(ss => (typeof ss === 'string' ? ss : ss.name) === subSkillName);
        const subSkillId = typeof subSkill === 'object' ? subSkill.id : `subskill-${subSkillName}`;

        // Delete via API
        await API.deleteSubSkill(mainSkillId, subSkillId);

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Sub-skill "${subSkillName}" deleted successfully!`);

        // Refresh display
        const updatedData = await getData();
        const updatedMainSkill = updatedData.skills.find(s => s.id === mainSkillId);
        displaySubSkills(updatedMainSkill);
        await renderDashboard();
    } catch (error) {
        console.error('Failed to delete sub-skill:', error);
        alert(`Error deleting sub-skill: ${error.message}`);
    }
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

async function saveSubSkillEdit(mainSkillId, oldName, newName) {
    newName = newName.trim();

    if (!newName) {
        alert('Sub-skill name cannot be empty.');
        return;
    }

    if (newName === oldName) {
        cancelSubSkillEdit(mainSkillId);
        return;
    }

    const data = await getData();
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
    console.log(`Sub-skill renamed from "${oldName}" to "${newName}"!`);

    displaySubSkills(mainSkill);
    renderDashboard();
}

async function cancelSubSkillEdit(mainSkillId) {
    const data = await getData();
    const mainSkill = data.skills.find(s => s.id === mainSkillId);
    displaySubSkills(mainSkill);
}

async function deleteMainSkillFromManagement() {
    const skillId = document.getElementById('selectMainSkill').value;
    if (!skillId) return;

    try {
        const data = await getData();
        const mainSkill = data.skills.find(s => s.id === skillId);

        const confirmed = await showConfirmModal(`Are you sure you want to delete "${mainSkill.name}" and all its sub-skills? This will remove it from all resources.`);
        if (!confirmed) {
            return;
        }

        // Delete via API
        await API.deleteSkill(skillId);

        // Clear cache and refresh UI
        clearDataCache();
        console.log(`Main skill category "${mainSkill.name}" deleted successfully!`);

        document.getElementById('selectMainSkill').value = '';
        document.getElementById('deleteMainSkill').disabled = true;
        document.getElementById('editMainSkill').disabled = true;
        document.getElementById('subSkillsManagement').style.display = 'none';
        await populateMainSkillSelect();
        await renderDashboard();
    } catch (error) {
        console.error('Failed to delete main skill:', error);
        alert(`Error deleting main skill: ${error.message}`);
    }
}

async function exportData() {
    const data = await getData();
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
                console.log('Data imported successfully!');
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
    console.log('Data reset to sample data!');
    location.reload();
}

// ==================== CUSTOM RADAR CHART ====================

let customRadarChart = null;

async function populateSubSkillCheckboxes() {
    const data = await getData();
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
            categorySection.className = 'collapsible-category expanded'; // All sections open by default

            // Create category header with select-all
            const header = document.createElement('div');
            header.className = 'category-header';

            // Toggle icon
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.textContent = '▼'; // All expanded by default

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

                const subSkillName = typeof subSkill === 'string' ? subSkill : subSkill.name;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `subskill-${subSkillName.replace(/\s+/g, '-')}`;
                checkbox.value = subSkillName;
                checkbox.dataset.category = skillCategory.name;
                checkbox.className = 'subskill-checkbox';

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = subSkillName;

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
    // Use cached data directly (can't use await in synchronous context)
    if (!dataCache || !dataCache.resources) {
        return [];
    }

    // Get all engineers with this sub-skill
    const engineersWithSkill = dataCache.resources
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

async function getTeamAverageForSubSkill(subSkillName, category) {
    const data = await getData();

    const levels = data.resources
        .map(eng => eng.subSkills?.[category]?.[subSkillName] || 0)
        .filter(level => level > 0);

    if (levels.length === 0) return 0;

    const sum = levels.reduce((acc, level) => acc + level, 0);
    return sum / levels.length;
}

async function renderCustomRadarChart() {
    const container = document.getElementById('subSkillCheckboxes');
    // Only select sub-skill checkboxes, not the select-all checkboxes
    const selectedCheckboxes = container.querySelectorAll('input.subskill-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
        console.log('No sub-skills selected for custom radar chart');
        // Hide chart or show message
        const chartContainer = document.getElementById('customRadarChart');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
        return;
    }

    const labels = [];
    const values = [];
    const skillsData = []; // Store category info for tooltip

    // Process checkboxes asynchronously
    for (const checkbox of selectedCheckboxes) {
        const subSkillName = checkbox.value;
        const category = checkbox.dataset.category;
        const avgLevel = await getTeamAverageForSubSkill(subSkillName, category);

        labels.push(subSkillName);
        values.push(avgLevel);
        skillsData.push({ name: subSkillName, category: category });
    }

    const ctx = document.getElementById('customRadarChart').getContext('2d');

    if (customRadarChart) {
        customRadarChart.destroy();
    }

    // Show chart canvas
    const canvas = document.getElementById('customRadarChart');
    if (canvas) canvas.style.display = 'block';

    customRadarChart = window._customRadarChart = new Chart(ctx, {
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
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 11
                        },
                        padding: 20,
                        centerPointLabels: false,
                        callback: function(label, index) {
                            // Replace hyphens with non-breaking hyphens to prevent wrapping
                            return label.toString().replace(/-/g, '\u2011');
                        }
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

                            // Use cached data directly (can't use await in tooltip callbacks)
                            if (!dataCache || !dataCache.resources) {
                                return '';
                            }

                            // Get all resources with this sub-skill
                            const resourcesWithSkill = dataCache.resources
                                .map(res => {
                                    const level = res.subSkills?.[skillData.category]?.[skillData.name] || 0;
                                    return {
                                        name: res.name,
                                        level: level
                                    };
                                })
                                .filter(res => res.level > 0)
                                .sort((a, b) => b.level - a.level); // Sort descending

                            if (resourcesWithSkill.length === 0) {
                                return '\n\nNo resources have this skill yet.';
                            }

                            let result = '';

                            // Top 3 Most Skilled
                            const top3 = resourcesWithSkill.slice(0, 3);
                            result += '\n\nMost Skilled:';
                            top3.forEach((res, i) => {
                                result += `\n  ${i + 1}. ${res.name} (Level ${res.level})`;
                            });

                            // Bottom 3 Least Skilled (only if more than 3 resources)
                            if (resourcesWithSkill.length > 3) {
                                const bottom3 = resourcesWithSkill.slice(-3).reverse(); // Get last 3 and reverse
                                result += '\n\nLeast Skilled:';
                                bottom3.forEach((res, i) => {
                                    result += `\n  ${i + 1}. ${res.name} (Level ${res.level})`;
                                });
                            }

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
    const categories = container.querySelectorAll('.collapsible-category');
    let visibleCount = 0;

    // If search is empty, show everything
    if (searchTerm === '') {
        categories.forEach(category => {
            category.style.display = 'block';
            const items = category.querySelectorAll('.checkbox-item');
            items.forEach(item => item.style.display = 'flex');
            visibleCount += items.length;
        });
        document.getElementById('searchCount').textContent = `${visibleCount} sub-skills`;
        return;
    }

    // Filter categories and items based on search term
    categories.forEach(category => {
        const items = category.querySelectorAll('.checkbox-item');
        const categoryName = category.querySelector('.category-name');
        const categoryText = categoryName ? categoryName.textContent.toLowerCase() : '';
        let categoryHasVisible = false;

        items.forEach(item => {
            const label = item.querySelector('label');
            const skillName = label ? label.textContent.toLowerCase() : '';

            // Match if search term is in skill name OR category name
            if (skillName.includes(searchTerm) || categoryText.includes(searchTerm)) {
                item.style.display = 'flex';
                categoryHasVisible = true;
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide entire category based on whether it has visible items
        category.style.display = categoryHasVisible ? 'block' : 'none';
    });

    // Update count display
    const countText = visibleCount === 1 ? '1 sub-skill' : `${visibleCount} sub-skills`;
    document.getElementById('searchCount').textContent = countText;
}

function setupCustomChartEventListeners() {
    const updateBtn = document.getElementById('updateCustomChart');
    const clearBtn = document.getElementById('clearSubSkills');
    const searchInput = document.getElementById('subSkillSearch');

    if (!updateBtn || !clearBtn || !searchInput) {
        console.error('Custom chart elements not found');
        return;
    }

    updateBtn.addEventListener('click', async () => {
        console.log('Update chart button clicked');
        await renderCustomRadarChart();
    });

    clearBtn.addEventListener('click', () => {
        console.log('Clear selections clicked');
        const checkboxes = document.querySelectorAll('#subSkillCheckboxes input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (customRadarChart) {
            customRadarChart.destroy();
            customRadarChart = null;
        }

        // Hide chart canvas
        const canvas = document.getElementById('customRadarChart');
        if (canvas) canvas.style.display = 'none';
    });

    // Setup search filter
    searchInput.addEventListener('input', () => {
        console.log('Search input changed:', searchInput.value);
        filterSubSkills();
    });

    // Initialize count
    setTimeout(() => {
        const totalCount = document.querySelectorAll('#subSkillCheckboxes .checkbox-item').length;
        const countElement = document.getElementById('searchCount');
        if (countElement) {
            countElement.textContent = `${totalCount} sub-skills`;
        }
        console.log('Initialized sub-skill checkboxes:', totalCount);
    }, 500);
}

// ==================== ENGINEER MODAL ====================

let currentModalResourceId = null;

async function openResourceModal(resourceId) {
    const data = await getData();
    const resource = data.resources.find(e => e.id === resourceId);

    if (!resource) return;

    currentModalResourceId = resourceId;

    // Set resource name, email, and password
    document.getElementById('modalResourceName').textContent = resource.name;
    document.getElementById('modalResourceEmail').value = resource.email || '';
    document.getElementById('modalResourcePassword').value = resource.password || '';

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
            skillCategory.subSkills.forEach(subSkill => {
                // Handle both string and object formats
                const subSkillName = typeof subSkill === 'string' ? subSkill : subSkill.name;
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

// ==================== CHANGE PASSWORD MODAL ====================

function openChangePasswordModal() {
    const resourceId = document.getElementById('selectResource').value;
    if (!resourceId) return;

    // Clear password fields
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    // Show modal
    const modal = document.getElementById('changePasswordModal');
    modal.classList.add('show');
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.remove('show');
}

async function saveNewPassword() {
    const resourceId = document.getElementById('selectResource').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!resourceId) {
        alert('No resource selected.');
        return;
    }

    if (!newPassword) {
        alert('Please enter a new password.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    try {
        // Update password via API
        await API.updateResource(resourceId, {
            password: newPassword
        });

        // Clear cache
        clearDataCache();
        console.log('Password updated successfully!');
        closeChangePasswordModal();
    } catch (error) {
        console.error('Failed to update password:', error);
        alert(`Error updating password: ${error.message}`);
    }
}

// ==================== CONFIRMATION MODAL ====================

function showConfirmModal(message) {
    console.log('showConfirmModal called with message:', message);
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmModalMessage');
        const yesBtn = document.getElementById('confirmModalYes');
        const noBtn = document.getElementById('confirmModalNo');

        console.log('Modal elements found:', {
            modal: !!modal,
            messageEl: !!messageEl,
            yesBtn: !!yesBtn,
            noBtn: !!noBtn
        });

        if (!modal || !messageEl || !yesBtn || !noBtn) {
            console.error('Missing modal elements!');
            resolve(false);
            return;
        }

        messageEl.textContent = message;
        modal.classList.add('show');
        console.log('Modal should now be visible, classList:', modal.classList.toString());

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

async function saveResourceSkills() {
    if (!currentModalResourceId) return;

    const data = await getData();
    const resource = data.resources.find(e => e.id === currentModalResourceId);

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

    // Get email and password from inputs
    const email = document.getElementById('modalResourceEmail').value.trim();
    const password = document.getElementById('modalResourcePassword').value.trim();

    if (email) {
        resource.email = email;
    }
    if (password) {
        resource.password = password;
    }

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

    // Save to API
    try {
        await API.updateResource(currentModalResourceId, resource);

        // Close modal
        closeResourceModal();

        // Clear cache and refresh the search results
        clearDataCache();
        await renderSearch();
    } catch (error) {
        console.error('Error saving skills:', error);
        alert('Failed to save skills. Please try again.');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('resourceModal');
    if (e.target === modal) {
        closeResourceModal();
    }
});

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    setupNavigation();
    await updateLastUpdated();
    await renderDashboard();
    await populateSubSkillCheckboxes();
    setupCustomChartEventListeners();
});

function updateChartTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const labelColor = isDark ? '#a0aec0' : '#4a5568';

    [window._teamRadarChart, window._customRadarChart].forEach(function (chart) {
        if (!chart) return;
        const scales = chart.options.scales;
        if (scales && scales.r) {
            scales.r.grid.color = gridColor;
            scales.r.ticks.color = labelColor;
            scales.r.pointLabels.color = labelColor;
        }
        chart.update();
    });
}
