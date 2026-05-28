// ============================================================
// THEME TOGGLE
// ============================================================
(function () {
    const html = document.documentElement;
    const stored = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', stored);

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

// Staffing & Data Quality APIs (new — added in v3)
const StaffingAPI = {
    async search(requirements, mode = 'match') {
        const r = await fetch(`${API_BASE}/staffing/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirements, mode }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'staffing search failed');
        return j.data;
    }
};

const DataQualityAPI = {
    async get(staleDays = 365) {
        const r = await fetch(`${API_BASE}/data-quality?staleDays=${staleDays}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'data-quality fetch failed');
        return j.data;
    }
};

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
        case 'radar':
            await renderCustomRadar();
            break;
        case 'staffing':
            await renderStaffing();
            break;
        case 'quality':
            await renderQuality();
            break;
        case 'training':
            await renderTraining();
            break;
        case 'insights':
            await renderInsights();
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

let customRadarInitialized = false;

async function renderCustomRadar() {
    // Always re-populate so newly added skills / sub-skills appear without a reload
    await populateSubSkillCheckboxes();
    if (!customRadarInitialized) {
        setupCustomChartEventListeners();
        customRadarInitialized = true;
    }
}

async function navigateToRadar() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const radarBtn = document.querySelector('[data-view="radar"]');
    if (radarBtn) radarBtn.classList.add('active');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('radar-view').classList.add('active');
    await renderView('radar');
}

// Keep old name as alias for any lingering references
function scrollToCustomRadar() { navigateToRadar(); }

async function navigateToTraining() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector('[data-view="training"]');
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('training-view');
    if (view) view.classList.add('active');
    await renderView('training');
}
window.navigateToTraining = navigateToTraining;

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

    // Tech / Non-tech breakdowns
    const techSkills = data.skills.filter(s => (s.skillType || 'technical') === 'technical');
    const nonTechSkills = data.skills.filter(s => (s.skillType || 'technical') === 'non-technical');
    const techSkillNames = new Set(techSkills.map(s => s.name));
    const nonTechSkillNames = new Set(nonTechSkills.map(s => s.name));

    // Skills tracked: count of sub-skills under each type
    const techSubCount = techSkills.reduce((a, s) => a + (s.subSkills?.length || 0), 0);
    const nonTechSubCount = nonTechSkills.reduce((a, s) => a + (s.subSkills?.length || 0), 0);
    setText('totalSkillsTech', techSubCount);
    setText('totalSkillsNonTech', nonTechSubCount);

    // Resources: how many have at least one rating in each type
    let resourcesWithTech = 0;
    let resourcesWithNonTech = 0;
    data.resources.forEach(r => {
        const sub = r.subSkills || {};
        let hasTech = false, hasNonTech = false;
        for (const [mainName, items] of Object.entries(sub)) {
            const anyRated = Object.values(items || {}).some(v => v > 0);
            if (!anyRated) continue;
            if (techSkillNames.has(mainName)) hasTech = true;
            if (nonTechSkillNames.has(mainName)) hasNonTech = true;
        }
        if (hasTech) resourcesWithTech++;
        if (hasNonTech) resourcesWithNonTech++;
    });
    setText('totalResourcesTech', resourcesWithTech);
    setText('totalResourcesNonTech', resourcesWithNonTech);

    // Empty-resource warning: count resources with no ratings at all
    const unrated = data.resources.filter(r => {
        if (!r.subSkills) return true;
        return !Object.values(r.subSkills).some(cat => Object.keys(cat || {}).length > 0);
    });
    let warnEl = document.getElementById('unratedWarning');
    if (!warnEl) {
        warnEl = document.createElement('div');
        warnEl.id = 'unratedWarning';
        warnEl.className = 'dashboard-warn';
        const view = document.getElementById('dashboard-view');
        const grid = view && view.querySelector('.metrics-grid');
        if (view && grid) view.insertBefore(warnEl, grid);
    }
    if (unrated.length > 0) {
        warnEl.innerHTML = `<strong>Heads up:</strong> ${unrated.length} resource${unrated.length === 1 ? '' : 's'} have no skill ratings yet — they are excluded from averages but counted in <em>Total Resources</em>. ` +
            `<span class="muted">(${unrated.map(r => r.name).slice(0, 5).join(', ')}${unrated.length > 5 ? ', …' : ''})</span>`;
        warnEl.style.display = 'block';
    } else {
        warnEl.style.display = 'none';
    }

    // Compute average team skill level (across all sub-skill ratings)
    let allRatings = [];
    data.resources.forEach(resource => {
        if (resource.subSkills) {
            Object.values(resource.subSkills).forEach(category => {
                Object.values(category).forEach(level => {
                    if (level > 0) allRatings.push(level);
                });
            });
        }
    });
    const avgTeamSkillEl = document.getElementById('avgTeamSkill');
    if (avgTeamSkillEl) {
        const avg = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
        avgTeamSkillEl.textContent = avg > 0 ? avg.toFixed(1) : '—';
    }

    // Avg by type
    const collectRatings = (matchType) => {
        const out = [];
        data.resources.forEach(r => {
            if (!r.subSkills) return;
            Object.entries(r.subSkills).forEach(([mainName, items]) => {
                const skill = data.skills.find(s => s.name === mainName);
                const stype = skill && skill.skillType ? skill.skillType : 'technical';
                if (stype !== matchType) return;
                Object.values(items || {}).forEach(v => { if (v > 0) out.push(v); });
            });
        });
        return out;
    };
    const techRatings = collectRatings('technical');
    const nonTechRatings = collectRatings('non-technical');
    const avgTech = techRatings.length ? techRatings.reduce((a, b) => a + b, 0) / techRatings.length : 0;
    const avgNonTech = nonTechRatings.length ? nonTechRatings.reduce((a, b) => a + b, 0) / nonTechRatings.length : 0;
    setText('avgTeamSkillTech',    avgTech    ? avgTech.toFixed(1)    : '—');
    setText('avgTeamSkillNonTech', avgNonTech ? avgNonTech.toFixed(1) : '—');

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

    // Stash both maps + data, then draw radar + lists for the currently-selected type
    window._dashboardAverages = { technical: technicalSkillAverages, 'non-technical': nonTechnicalSkillAverages };
    window._dashboardData = data;
    drawTeamRadar();
    renderDashboardTopGap();
    setupDashboardToggle();

    // Training tile — quick read of training pipeline (best effort; doesn't block dashboard)
    populateTrainingTile().catch(() => {});

    // Team Experts (L4+): count every (resource × sub-skill) rating at level 4 or 5.
    let expertsTotal = 0, expertsTech = 0, expertsNonTech = 0;
    data.resources.forEach(r => {
        if (!r.subSkills) return;
        for (const [mainName, items] of Object.entries(r.subSkills)) {
            const skill = data.skills.find(s => s.name === mainName);
            const stype = skill && skill.skillType ? skill.skillType : 'technical';
            for (const lvl of Object.values(items || {})) {
                if (lvl >= 4) {
                    expertsTotal += 1;
                    if (stype === 'non-technical') expertsNonTech += 1;
                    else expertsTech += 1;
                }
            }
        }
    });
    setText('totalExperts',        expertsTotal);
    setText('totalExpertsTech',    expertsTech);
    setText('totalExpertsNonTech', expertsNonTech);

    // Single Points of Failure: main skills where <= 1 person is rated L4+ at the
    // main-skill level. Surfaces bus-factor risk across the catalogue.
    const spofSole = [];   // [{ skill, expert }] — exactly one expert
    const spofNone = [];   // [skill] — nobody at expert level
    data.skills.forEach(skill => {
        if (!skill.subSkills || skill.subSkills.length === 0) return; // skip orphan main skills
        const experts = data.resources.filter(r => (r.skills && r.skills[skill.name] >= 4));
        if (experts.length === 0) spofNone.push(skill.name);
        else if (experts.length === 1) spofSole.push({ skill: skill.name, expert: experts[0].name });
    });
    setText('spofValue', spofSole.length + spofNone.length);
    setText('spofOne',   spofSole.length);
    setText('spofZero',  spofNone.length);
    // Stash detail for the hover tooltip — picked up by setupSpofHover().
    window.__spofDetail = { sole: spofSole, none: spofNone };
    setupSpofHover();
}

// Attach hover tooltip on the SPOF dashboard tile once. Reads detail from
// window.__spofDetail (refreshed each updateStats run) and reuses the
// .resource-tooltip styling.
let _spofHoverWired = false;
function setupSpofHover() {
    if (_spofHoverWired) return;
    const card = document.getElementById('spofCard');
    if (!card) return;
    _spofHoverWired = true;
    let timer = null;
    card.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        timer = setTimeout(() => showSpofTooltip(card), 250);
    });
    card.addEventListener('mouseleave', () => {
        clearTimeout(timer);
        hideResourceTooltip();
    });
}

function showSpofTooltip(cardElement) {
    if (!cardElement) return;
    hideResourceTooltip();
    const detail = window.__spofDetail || { sole: [], none: [] };
    if (detail.sole.length === 0 && detail.none.length === 0) return;

    // Cap to keep the tooltip compact (matches resource-card behaviour).
    const SOLE_MAX = 6;
    const NONE_MAX = 6;
    const sole = detail.sole.slice(0, SOLE_MAX);
    const none = detail.none.slice(0, NONE_MAX);
    const soleHidden = detail.sole.length - sole.length;
    const noneHidden = detail.none.length - none.length;

    const tooltip = document.createElement('div');
    tooltip.className = 'resource-tooltip show';
    tooltip.id = 'active-resource-tooltip';

    let html = '';
    if (sole.length > 0) {
        html += '<h5>Sole expert (1 person L4+)</h5><ul>';
        sole.forEach(s => {
            html += `<li><span class="skill-name">${escapeHtml(s.skill)}</span><span class="skill-level" style="background: rgba(251, 191, 36, 0.25); color: #fbbf24;">${escapeHtml(s.expert)}</span></li>`;
        });
        if (soleHidden > 0) html += `<li style="justify-content:center;font-style:italic;">+${soleHidden} more</li>`;
        html += '</ul>';
    }
    if (none.length > 0) {
        if (sole.length > 0) html += '<div class="section-divider"></div>';
        html += '<h5 style="color: var(--danger);">No experts (0 at L4+)</h5><ul>';
        none.forEach(skillName => {
            html += `<li><span class="skill-name">${escapeHtml(skillName)}</span><span class="skill-level" style="background: rgba(248, 113, 113, 0.3); color: #f87171;">L4+ gap</span></li>`;
        });
        if (noneHidden > 0) html += `<li style="justify-content:center;font-style:italic;">+${noneHidden} more</li>`;
        html += '</ul>';
    }

    tooltip.innerHTML = html;
    document.body.appendChild(tooltip);

    const cardRect = cardElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = cardRect.right + 15;
    let top = cardRect.top;
    if (left + tooltipRect.width > window.innerWidth) left = cardRect.left - tooltipRect.width - 15;
    if (top + tooltipRect.height > window.innerHeight) top = window.innerHeight - tooltipRect.height - 10;
    if (top < 10) top = 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderDashboardTopGap() {
    const averages = (window._dashboardAverages || {})[dashboardSkillType] || {};
    const data = window._dashboardData;
    // Pass only the skills matching the selected type
    const filteredData = data ? {
        ...data,
        skills: data.skills.filter(s => (s.skillType || 'technical') === dashboardSkillType),
    } : null;
    renderTopSkills(averages, filteredData);

    // Section headers reflect the selected type for clarity
    const strengthHeader = document.querySelector('.skills-column h3.strength');
    const gapHeader = document.querySelector('.skills-column h3.gap');
    const typeLabel = dashboardSkillType === 'technical' ? 'Technical' : 'Non-Technical';
    if (strengthHeader) strengthHeader.textContent = `Top 5 ${typeLabel} Strengths`;
    if (gapHeader) gapHeader.textContent = `Top 5 ${typeLabel} Gaps`;
}

let dashboardToggleBound = false;
function setupDashboardToggle() {
    if (dashboardToggleBound) return;
    dashboardToggleBound = true;
    document.querySelectorAll('.skill-type-toggle .stt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.skillType;
            if (!type || type === dashboardSkillType) return;
            dashboardSkillType = type;
            document.querySelectorAll('.skill-type-toggle .stt-btn').forEach(b => {
                b.classList.toggle('stt-active', b.dataset.skillType === type);
            });
            drawTeamRadar();
            renderDashboardTopGap();
        });
    });
}

// Dashboard state: which skill type is shown in radar + top/gap lists
let dashboardSkillType = 'technical';

const RADAR_COLORS = {
    technical:       { fill: 'rgba(37, 99, 235, 0.25)',  border: 'rgba(37, 99, 235, 1)' },
    'non-technical': { fill: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 1)' },
};

function renderRadarChart(technicalSkillAverages, nonTechnicalSkillAverages) {
    // Hold both maps on window so the toggle handler can re-render without recomputing
    window._dashboardAverages = { technical: technicalSkillAverages, 'non-technical': nonTechnicalSkillAverages };
    drawTeamRadar();
}

function drawTeamRadar() {
    const canvas = document.getElementById('teamRadarChart');
    if (!canvas) return;
    const averages = (window._dashboardAverages || {})[dashboardSkillType] || {};
    const labels = Object.keys(averages).filter(k => (averages[k] || 0) > 0);
    const data = labels.map(l => averages[l] || 0);
    const colors = RADAR_COLORS[dashboardSkillType] || RADAR_COLORS.technical;

    if (window._teamRadarChart) {
        window._teamRadarChart.destroy();
    }

    if (labels.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data for this type yet', canvas.width / 2, canvas.height / 2);
        window._teamRadarChart = null;
        return;
    }

    window._teamRadarChart = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: dashboardSkillType === 'technical' ? 'Technical avg' : 'Non-Technical avg',
                data,
                backgroundColor: colors.fill,
                borderColor: colors.border,
                borderWidth: 2,
                pointBackgroundColor: colors.border,
                pointRadius: 3,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } },
        },
    });
}

function renderTopSkills(skillAverages, data) {
    const sorted = Object.entries(skillAverages).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);

    // Use weighted gap score for gap list (matches Priority Skills Gap list)
    const bottom5 = data
        ? data.skills
            .map(skill => {
                const currentAvg = skillAverages[skill.name] || 0;
                const gapScore = (5 - currentAvg) * (skill.weight || 5);
                return { name: skill.name, avg: currentAvg, gapScore };
            })
            .filter(s => s.avg > 0)
            .sort((a, b) => b.gapScore - a.gapScore)
            .slice(0, 5)
            .map(s => [s.name, s.avg])
        : sorted.slice(-5).reverse();

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
            <span class="skill-score skill-score--gap">${avg.toFixed(1)}</span>
        </li>
    `).join('');
}


// ==================== HEATMAP ====================
// State is module-level so toggles persist across re-renders
const heatmapState = {
    sortBy: 'name',          // 'name' | 'avgSkill'
    mode: 'main',            // 'main' | 'sub'
    filterType: 'technical', // 'all' | 'technical' | 'non-technical'
    minLevel: 0,             // 0-5; cells below this are dimmed
    hideUnrated: false,      // hide rows/cols with no ratings
    editMode: false,
};

const STALE_DAYS = 365;

function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function isStaleISO(iso) {
    if (!iso) return false;
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    return days > STALE_DAYS;
}

function avgOf(arr) {
    const vals = arr.filter(v => typeof v === 'number');
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function buildHeatmapModel(data) {
    // Build a tidy model with main + sub columns, ready to render in either mode.
    const mainCols = data.skills
        .filter(s => heatmapState.filterType === 'all' ? true : s.skillType === heatmapState.filterType)
        .map(s => ({
            kind: 'main',
            id: s.id,
            name: s.name,
            weight: s.weight || 5,
            skillType: s.skillType || 'technical',
            subSkills: (s.subSkills || []).map(ss => ({
                kind: 'sub',
                id: typeof ss === 'object' ? ss.id : null,
                name: typeof ss === 'object' ? ss.name : ss,
                mainSkillId: s.id,
                mainSkillName: s.name,
            })),
        }));

    const rows = data.resources.map(r => {
        // Resolve a main-skill level from sub-skills (resource.skills is server-computed already)
        const mainLevels = {};
        const subLevels = {};
        const subDates = {};
        mainCols.forEach(c => {
            mainLevels[c.name] = (r.skills && r.skills[c.name]) || 0;
            const subs = (r.subSkills && r.subSkills[c.name]) || {};
            const dates = (r.lastAssessed && r.lastAssessed[c.name]) || {};
            c.subSkills.forEach(sc => {
                subLevels[`${c.name}::${sc.name}`] = subs[sc.name] || 0;
                subDates[`${c.name}::${sc.name}`] = dates[sc.name] || null;
            });
        });
        return {
            id: r.id,
            name: r.name,
            email: r.email,
            mainLevels,
            subLevels,
            subDates,
        };
    });

    return { mainCols, rows };
}

function sortRows(rows, model) {
    const out = [...rows];
    if (heatmapState.sortBy === 'name') {
        out.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        out.sort((a, b) => {
            const aa = avgOf(Object.values(a.mainLevels).filter(v => v > 0));
            const bb = avgOf(Object.values(b.mainLevels).filter(v => v > 0));
            return bb - aa;
        });
    }
    return out;
}

function renderHeatmapMain(model, container) {
    const rows = sortRows(model.rows, model);
    const cols = model.mainCols;

    // Filter rows/cols if "hide unrated" is on
    let visibleCols = cols;
    let visibleRows = rows;
    if (heatmapState.hideUnrated) {
        visibleCols = cols.filter(c => rows.some(r => r.mainLevels[c.name] > 0));
        visibleRows = rows.filter(r => visibleCols.some(c => r.mainLevels[c.name] > 0));
    }
    if (heatmapState.minLevel > 0) {
        visibleRows = visibleRows.filter(r =>
            visibleCols.some(c => r.mainLevels[c.name] >= heatmapState.minLevel)
        );
    }

    // Footer stats per column. "Demand" only computed when there IS rating data
    // (otherwise an unrated column would look like the highest priority — misleading).
    const colStats = visibleCols.map(c => {
        const vals = visibleRows.map(r => r.mainLevels[c.name]).filter(v => v > 0);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const expertCount = visibleRows.filter(r => r.mainLevels[c.name] >= 4).length;
        const hasData = vals.length > 0;
        const demand = hasData ? (5 - avg) * (c.weight || 5) : null;
        return { avg, expertCount, hasData, demand };
    });
    const ratedStats = colStats.filter(s => s.hasData);
    const maxDemand = ratedStats.length ? Math.max(1, ...ratedStats.map(s => s.demand)) : 1;

    let html = `<table class="heatmap-table heatmap-v2"><thead><tr>`;
    html += `<th class="sticky-col sticky-row">Resource</th>`;
    visibleCols.forEach(c => {
        html += `<th class="sticky-row" title="weight ${c.weight}, ${c.skillType}">${escapeHtml(c.name)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    visibleRows.forEach(r => {
        html += `<tr>`;
        html += `<td class="resource-name sticky-col">${escapeHtml(r.name)}</td>`;
        visibleCols.forEach(c => {
            const lvl = r.mainLevels[c.name] || 0;
            const dim = (heatmapState.minLevel > 0 && lvl < heatmapState.minLevel) ? ' dim' : '';
            // Compute "stale-ish": any sub-skill in this category is stale
            const subDates = c.subSkills.map(sc => r.subDates[`${c.name}::${sc.name}`]).filter(Boolean);
            const isStale = subDates.length > 0 && subDates.every(isStaleISO);
            const staleDot = isStale ? '<span class="freshness-dot stale" title="all underlying ratings >365d"></span>' : '';
            html += `<td class="skill-cell level-${lvl}${dim}"
                data-resource-id="${r.id}" data-main-skill="${escapeHtml(c.name)}"
                title="${escapeHtml(r.name)} — ${escapeHtml(c.name)}: ${lvl || 'none'}">
                ${staleDot}${lvl || '-'}
            </td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody>`;

    // Footer with team stats per column
    html += `<tfoot><tr>`;
    html += `<th class="sticky-col">Team avg</th>`;
    colStats.forEach(s => {
        html += `<th class="hm-foot-cell"><div class="hm-foot-avg">${s.hasData ? s.avg.toFixed(1) : '—'}</div>`;
        html += `<div class="hm-foot-expert">${s.expertCount}× L4+</div>`;
        if (s.hasData) {
            const pct = Math.max(4, Math.round((s.demand / maxDemand) * 100));
            const maskPct = Math.max(0, 100 - pct);
            html += `<div class="hm-demand-bar" title="Priority bar. Wider/redder = larger demand. score = (5−avg) × weight = ${s.demand.toFixed(1)}">
                <span class="hm-demand-mask" style="width:${maskPct}%"></span></div>`;
        } else {
            html += `<div class="hm-demand-bar no-data" title="No ratings yet — no demand signal."></div>`;
        }
        html += `</th>`;
    });
    html += `</tr></tfoot>`;
    html += `</table>`;

    container.innerHTML = html;
}

function renderHeatmapSub(model, container) {
    const rows = sortRows(model.rows, model);
    let cols = [];
    model.mainCols.forEach(c => c.subSkills.forEach(sc => cols.push({ main: c, sub: sc })));

    // Filter
    if (heatmapState.hideUnrated) {
        cols = cols.filter(({ main, sub }) =>
            rows.some(r => (r.subLevels[`${main.name}::${sub.name}`] || 0) > 0)
        );
    }
    if (heatmapState.minLevel > 0) {
        cols = cols.filter(({ main, sub }) =>
            rows.some(r => (r.subLevels[`${main.name}::${sub.name}`] || 0) >= heatmapState.minLevel)
        );
    }

    let visibleRows = rows;
    if (heatmapState.hideUnrated) {
        visibleRows = rows.filter(r =>
            cols.some(({ main, sub }) => (r.subLevels[`${main.name}::${sub.name}`] || 0) > 0)
        );
    }

    let html = `<table class="heatmap-table heatmap-v2 heatmap-sub"><thead>`;
    // Main-skill group header row
    html += `<tr><th class="sticky-col sticky-row" rowspan="2">Resource</th>`;
    let groupHtml = '';
    let cursor = 0;
    while (cursor < cols.length) {
        const groupName = cols[cursor].main.name;
        let span = 0;
        while (cursor + span < cols.length && cols[cursor + span].main.name === groupName) span++;
        groupHtml += `<th class="hm-group sticky-row" colspan="${span}">${escapeHtml(groupName)}</th>`;
        cursor += span;
    }
    html += groupHtml + `</tr><tr>`;
    cols.forEach(({ sub }) => {
        html += `<th class="hm-sub-th sticky-row" title="${escapeHtml(sub.name)}">${escapeHtml(sub.name)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    visibleRows.forEach(r => {
        html += `<tr><td class="resource-name sticky-col">${escapeHtml(r.name)}</td>`;
        cols.forEach(({ main, sub }) => {
            const key = `${main.name}::${sub.name}`;
            const lvl = r.subLevels[key] || 0;
            const dim = (heatmapState.minLevel > 0 && lvl < heatmapState.minLevel) ? ' dim' : '';
            const date = r.subDates[key];
            const stale = isStaleISO(date);
            const dot = stale ? '<span class="freshness-dot stale" title="rating >365d old"></span>' : '';
            html += `<td class="skill-cell level-${lvl}${dim}"
                data-resource-id="${r.id}" data-main-skill="${escapeHtml(main.name)}" data-sub-skill="${escapeHtml(sub.name)}"
                title="${escapeHtml(r.name)} — ${escapeHtml(main.name)} :: ${escapeHtml(sub.name)}: ${lvl || 'none'}${date ? ' (' + new Date(date).toLocaleDateString() + ')' : ''}">
                ${dot}${lvl || '-'}
            </td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody>`;

    // Footer
    const colStats = cols.map(({ main, sub }) => {
        const vals = visibleRows
            .map(r => r.subLevels[`${main.name}::${sub.name}`] || 0)
            .filter(v => v > 0);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const expertCount = visibleRows.filter(
            r => (r.subLevels[`${main.name}::${sub.name}`] || 0) >= 4
        ).length;
        return { avg, expertCount };
    });
    html += `<tfoot><tr><th class="sticky-col">Team avg</th>`;
    colStats.forEach(s => {
        html += `<th class="hm-foot-cell"><div class="hm-foot-avg">${s.avg ? s.avg.toFixed(1) : '—'}</div>`;
        html += `<div class="hm-foot-expert">${s.expertCount}× L4+</div></th>`;
    });
    html += `</tr></tfoot></table>`;

    container.innerHTML = html;
}

async function renderHeatmap(sortBy) {
    if (sortBy) heatmapState.sortBy = sortBy;
    const data = await getData();
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    const model = buildHeatmapModel(data);
    if (heatmapState.mode === 'sub') {
        renderHeatmapSub(model, container);
    } else {
        renderHeatmapMain(model, container);
    }

    bindHeatmapInteractions(container, model);
    syncHeatmapControls();
}

function syncHeatmapControls() {
    const set = (id, active) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('stt-active', !!active);
    };
    set('sortByName', heatmapState.sortBy === 'name');
    set('sortByAvgSkill', heatmapState.sortBy === 'avgSkill');
    set('hmModeMain', heatmapState.mode === 'main');
    set('hmModeSub', heatmapState.mode === 'sub');
    const editEl = document.getElementById('hmEditMode');
    if (editEl) editEl.checked = heatmapState.editMode;
    const unratedEl = document.getElementById('hmHideUnrated');
    if (unratedEl) unratedEl.checked = heatmapState.hideUnrated;
    document.querySelectorAll('#hmTypeToggle .stt-btn').forEach(b => {
        b.classList.toggle('stt-active', b.dataset.skillType === heatmapState.filterType);
    });
    const ml = document.getElementById('hmFilterMinLevel');
    if (ml) ml.value = String(heatmapState.minLevel);
    // toggle edit-mode visual on the heatmap
    document.getElementById('heatmapContainer').classList.toggle('edit-mode', heatmapState.editMode);
}

let heatmapListenersBound = false;
function bindHeatmapInteractions(container, model) {
    // Cell click → popover (or inline edit in edit mode + sub view)
    container.querySelectorAll('td.skill-cell').forEach(cell => {
        cell.addEventListener('click', e => onHeatmapCellClick(e, model));
    });

    if (heatmapListenersBound) return;
    heatmapListenersBound = true;

    document.getElementById('sortByName').addEventListener('click', () => renderHeatmap('name'));
    document.getElementById('sortByAvgSkill').addEventListener('click', () => renderHeatmap('avgSkill'));
    document.getElementById('hmModeMain').addEventListener('click', () => {
        heatmapState.mode = 'main'; renderHeatmap();
    });
    document.getElementById('hmModeSub').addEventListener('click', () => {
        heatmapState.mode = 'sub'; renderHeatmap();
    });
    document.querySelectorAll('#hmTypeToggle .stt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.skillType;
            if (t === heatmapState.filterType) return;
            heatmapState.filterType = t;
            document.querySelectorAll('#hmTypeToggle .stt-btn').forEach(b => {
                b.classList.toggle('stt-active', b.dataset.skillType === t);
            });
            renderHeatmap();
        });
    });
    document.getElementById('hmFilterMinLevel').addEventListener('change', e => {
        heatmapState.minLevel = parseInt(e.target.value, 10) || 0; renderHeatmap();
    });
    document.getElementById('hmHideUnrated').addEventListener('change', e => {
        heatmapState.hideUnrated = e.target.checked; renderHeatmap();
    });
    document.getElementById('hmEditMode').addEventListener('change', e => {
        heatmapState.editMode = e.target.checked;
        document.getElementById('heatmapContainer').classList.toggle('edit-mode', heatmapState.editMode);
    });
    // Legend hover: highlight all cells at that level
    document.querySelectorAll('.heatmap-legend .legend-item[data-level]').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const lvl = item.dataset.level;
            document.getElementById('heatmapContainer').classList.add('hl-active');
            document.querySelectorAll('#heatmapContainer td.skill-cell').forEach(c => {
                c.classList.toggle('hl', c.classList.contains(`level-${lvl}`));
            });
        });
        item.addEventListener('mouseleave', () => {
            document.getElementById('heatmapContainer').classList.remove('hl-active');
            document.querySelectorAll('#heatmapContainer td.skill-cell.hl').forEach(c => c.classList.remove('hl'));
        });
    });
    // Popover close
    document.getElementById('hmPopoverClose').addEventListener('click', closeHeatmapPopover);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeHeatmapPopover();
    });
}

function onHeatmapCellClick(e, model) {
    const cell = e.currentTarget;
    const resourceId = cell.dataset.resourceId;
    const mainSkill = cell.dataset.mainSkill;
    const subSkill = cell.dataset.subSkill || null;
    const row = model.rows.find(r => r.id === resourceId);
    const mainCol = model.mainCols.find(c => c.name === mainSkill);
    if (!row || !mainCol) return;
    openHeatmapPopover(row, mainCol, subSkill);
}

function openHeatmapPopover(row, mainCol, focusSubName) {
    const pop = document.getElementById('heatmapPopover');
    document.getElementById('hmPopoverTitle').textContent =
        `${row.name} — ${mainCol.name}`;
    const body = document.getElementById('hmPopoverBody');

    const subs = mainCol.subSkills;
    const editMode = heatmapState.editMode;

    let html = `<div class="hm-popover-meta">
        <span>Weight: <strong>${mainCol.weight}</strong></span>
        <span>Type: <strong>${mainCol.skillType}</strong></span>
        <span>Computed main level:
            <strong>${row.mainLevels[mainCol.name] || '—'}</strong></span>
    </div>`;
    html += `<table class="hm-popover-table"><thead><tr>
        <th>Sub-skill</th><th>Level</th><th>Last assessed</th></tr></thead><tbody>`;
    subs.forEach(sc => {
        const key = `${mainCol.name}::${sc.name}`;
        const lvl = row.subLevels[key] || 0;
        const date = row.subDates[key];
        const focused = (sc.name === focusSubName) ? ' hm-row-focused' : '';
        const dateText = date
            ? `${new Date(date).toLocaleDateString()}${isStaleISO(date) ? ' <span class="hm-pill-stale">stale</span>' : ''}`
            : '—';

        let levelCell;
        if (editMode) {
            levelCell = `<select class="hm-edit-level" data-sub="${escapeHtml(sc.name)}">`
              + [0,1,2,3,4,5].map(n => `<option value="${n}" ${n === lvl ? 'selected' : ''}>${n}</option>`).join('')
              + `</select>`;
        } else {
            levelCell = `<span class="skill-level-badge level-${lvl}">${lvl}</span>`;
        }
        html += `<tr class="${focused}"><td>${escapeHtml(sc.name)}</td><td>${levelCell}</td><td>${dateText}</td></tr>`;
    });
    html += `</tbody></table>`;

    if (editMode) {
        html += `<div class="hm-popover-actions">
            <button class="btn-primary" id="hmPopoverSave">Save</button>
            <button class="btn-secondary" id="hmPopoverCancel">Cancel</button>
        </div>`;
    }

    body.innerHTML = html;
    pop.hidden = false;
    pop.dataset.resourceId = row.id;
    pop.dataset.mainSkill = mainCol.name;

    if (editMode) {
        document.getElementById('hmPopoverSave').addEventListener('click', () => savePopoverEdits(row, mainCol));
        document.getElementById('hmPopoverCancel').addEventListener('click', closeHeatmapPopover);
    }
}

async function savePopoverEdits(row, mainCol) {
    // Gather all sub-skill levels for this main skill from the popover
    const selects = document.querySelectorAll('#hmPopoverBody select.hm-edit-level');
    // Build full subSkills object for the resource (preserving everything else)
    const data = await getData();
    const fullResource = data.resources.find(r => r.id === row.id);
    const newSubSkills = JSON.parse(JSON.stringify(fullResource.subSkills || {}));
    if (!newSubSkills[mainCol.name]) newSubSkills[mainCol.name] = {};
    let changed = 0;
    selects.forEach(sel => {
        const subName = sel.dataset.sub;
        const newLvl = parseInt(sel.value, 10);
        const old = newSubSkills[mainCol.name][subName] || 0;
        if (newLvl > 0) {
            if (newSubSkills[mainCol.name][subName] !== newLvl) changed++;
            newSubSkills[mainCol.name][subName] = newLvl;
        } else {
            if (old > 0) changed++;
            delete newSubSkills[mainCol.name][subName];
        }
    });

    try {
        await API.updateResource(row.id, { subSkills: newSubSkills });
        clearDataCache();
        showToast(`${row.name} — ${mainCol.name}: ${changed} change${changed === 1 ? '' : 's'} saved`, 'success');
        closeHeatmapPopover();
        await renderHeatmap();
    } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
    }
}

function closeHeatmapPopover() {
    const pop = document.getElementById('heatmapPopover');
    if (pop) pop.hidden = true;
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
        // Search input listener (debounced)
        const onSearchInput = debounce(async (val) => {
            const currentData = await getData();
            const query = (val || '').toLowerCase();
            const filtered = currentData.resources.filter(eng =>
                eng.name.toLowerCase().includes(query) ||
                (eng.email && eng.email.toLowerCase().includes(query))
            );
            displaySearchResults(filtered);
        }, 150);
        searchInput.addEventListener('input', (e) => onSearchInput(e.target.value));

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

async function displaySearchResults(resources) {
    const resultsContainer = document.getElementById('searchResults');

    if (resources.length === 0) {
        resultsContainer.innerHTML = '<p>No resources found.</p>';
        return;
    }

    // Build skill-name → weight lookup so chip importance can be weight-aware
    const data = await getData();
    const skillWeightByName = {};
    (data.skills || []).forEach(s => { skillWeightByName[s.name] = s.weight || 5; });

    // SPOF map: for each main skill, which resource IDs are rated L4+?
    // If exactly one, that resource is a sole-expert for that skill.
    const expertsBySkill = new Map();
    (data.skills || []).forEach(skill => {
        const ids = (data.resources || [])
            .filter(r => r.skills && r.skills[skill.name] >= 4)
            .map(r => r.id);
        expertsBySkill.set(skill.name, ids);
    });
    const soleExpertSkillsByResource = new Map();
    expertsBySkill.forEach((ids, skillName) => {
        if (ids.length === 1) {
            const rid = ids[0];
            if (!soleExpertSkillsByResource.has(rid)) soleExpertSkillsByResource.set(rid, []);
            soleExpertSkillsByResource.get(rid).push(skillName);
        }
    });

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

        const displayEmail = eng.email || '(no username)';
        // Top main skills: Proficient+ only (≥3), sorted by importance = level × weight.
        // Reason: level 1-2 isn't a real "strength"; the weight factor surfaces
        // high-demand skills above niche-but-cheap ones at the same level.
        const candidateSkills = Object.entries(eng.skills || {})
            .filter(([, lvl]) => lvl >= 3)
            .map(([name, lvl]) => ({ name, lvl, importance: lvl * (skillWeightByName[name] || 5) }))
            .sort((a, b) => b.importance - a.importance);
        const topSkills = candidateSkills.slice(0, 4);
        const moreCount = Math.max(0, candidateSkills.length - topSkills.length);

        let chipsHtml;
        if (topSkills.length > 0) {
            chipsHtml = `<div class="resource-skill-chips">${topSkills.map(s => `
                  <span class="skill-chip level-${s.lvl}" title="${s.name}: level ${s.lvl}">
                    <span class="chip-name">${s.name}</span>
                    <span class="chip-level">${s.lvl}</span>
                  </span>`).join('')}${moreCount > 0 ? `<span class="skill-chip skill-chip--more" title="${moreCount} more proficient-level skills">+${moreCount}</span>` : ''}</div>`;
        } else {
            chipsHtml = '<p class="resource-no-skills">No skills at proficient level yet</p>';
        }

        const soleExpertSkills = soleExpertSkillsByResource.get(eng.id) || [];
        const spofBadge = soleExpertSkills.length > 0
            ? `<div class="resource-spof-badge" title="${escapeHtml(eng.name)} is the only team member rated L4+ in: ${soleExpertSkills.map(escapeHtml).join(', ')}">
                  <span class="spof-icon" aria-hidden="true">⚠</span>
                  <span class="spof-label">Sole expert:</span>
                  <span class="spof-skills">${soleExpertSkills.map(s => `<span class="spof-skill">${escapeHtml(s)}</span>`).join('')}</span>
               </div>`
            : '';

        // Resource accent: blue for tech-leaning roles, green for project/PM roles.
        // Used as a left-border colour on the card so you can scan the team at a glance.
        const pmRoles = new Set(['Project Manager', 'Project Coordinator', 'Senior Project Manager']);
        const roleClass = pmRoles.has(eng.job_role) ? 'role-nontech'
                        : (eng.job_role ? 'role-tech' : '');

        return `
            <div class="resource-card ${roleClass}${soleExpertSkills.length > 0 ? ' is-spof' : ''}" data-resource-id="${eng.id}" style="position: relative;">
                <button class="delete-resource-btn" data-resource-id="${eng.id}" data-resource-name="${safeName}">×</button>
                <h4>${eng.name}</h4>
                ${eng.job_role ? `<div class="resource-role">${escapeHtml(eng.job_role)}</div>` : ''}
                <p style="color: var(--text-light); font-size: 0.9rem;"><strong>Username:</strong> ${displayEmail}</p>
                <p><strong>${subSkillCount}</strong> skills</p>
                ${spofBadge}
                ${chipsHtml}
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

async function showResourceTooltip(cardElement, resource) {
    if (!cardElement || !resource) return;
    hideResourceTooltip();

    // Need main-skill weights so we can rank by importance (level × weight)
    const data = await getData();
    const weightByMain = {};
    (data.skills || []).forEach(s => { weightByMain[s.name] = s.weight || 5; });

    // Flatten sub-skill ratings with their parent main-skill weight
    const all = [];
    if (resource.subSkills) {
        for (const [mainName, subs] of Object.entries(resource.subSkills)) {
            const w = weightByMain[mainName] || 5;
            for (const [name, level] of Object.entries(subs || {})) {
                if (level > 0) all.push({ name, level, mainName, weight: w });
            }
        }
    }

    // "Top skills" — proficient+ only (≥3), sorted by importance = level × weight.
    // (Matches the resource-card chip rule, so the tooltip never disagrees with
    // what the card itself is showing.) Capped at 5 to keep the tooltip compact.
    const topSubSkills = all
        .filter(s => s.level >= 3)
        .sort((a, b) => (b.level * b.weight) - (a.level * a.weight))
        .slice(0, 5);

    // "Areas to develop" — L1-2 only, lowest first. Renamed from "gaps" so it
    // doesn't collide with the dashboard's team-level priority-gap concept.
    const developing = all
        .filter(s => s.level >= 1 && s.level <= 2)
        .sort((a, b) => a.level - b.level)
        .slice(0, 5);

    // If there's literally nothing to say, don't pop the tooltip.
    if (topSubSkills.length === 0 && developing.length === 0) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'resource-tooltip show';
    tooltip.id = 'active-resource-tooltip';

    let tooltipHTML = '';

    // Compact single-line items so the tooltip stays small.
    tooltipHTML += '<h5>Top skills</h5>';
    if (topSubSkills.length > 0) {
        tooltipHTML += '<ul>';
        topSubSkills.forEach(s => {
            tooltipHTML += `<li><span class="skill-name">${escapeHtml(s.name)}</span><span class="skill-level">L${s.level}</span></li>`;
        });
        tooltipHTML += '</ul>';
    } else {
        tooltipHTML += '<p class="tooltip-empty">No proficient-level skills yet.</p>';
    }

    if (developing.length > 0) {
        tooltipHTML += '<div class="section-divider"></div>';
        tooltipHTML += '<h5>Areas to develop</h5><ul>';
        developing.forEach(s => {
            tooltipHTML += `<li><span class="skill-name">${escapeHtml(s.name)}</span><span class="skill-level" style="background: rgba(248, 113, 113, 0.3);">L${s.level}</span></li>`;
        });
        tooltipHTML += '</ul>';
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

    // Build per-category tabs (skills + their sub-skills with last-assessed staleness)
    const STALE_DAYS = 365;
    const now = Date.now();
    const categories = Object.keys(resource.subSkills || {}).sort();
    const lastAssessed = resource.lastAssessed || {};

    function staleHint(iso) {
        if (!iso) return '';
        const days = Math.floor((now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
        const stale = days > STALE_DAYS;
        return `<small class="last-assessed ${stale ? 'stale' : ''}" title="Last assessed ${iso}">${days}d ago${stale ? ' • stale' : ''}</small>`;
    }

    let tabsHtml = `<div class="profile-tabs"><button class="profile-tab active" data-tab="__summary">Summary</button>`;
    categories.forEach(cat => {
        tabsHtml += `<button class="profile-tab" data-tab="${cat.replace(/"/g, '&quot;')}">${cat}</button>`;
    });
    tabsHtml += '</div>';

    let panelsHtml = `<div class="profile-tab-panel active" data-panel="__summary">
        <h4>Skills (${subSkillCount} total)</h4>
        <div class="skills-list">
          ${Object.entries(resource.skills).sort((a, b) => b[1] - a[1]).map(([s, lvl]) => `
            <div class="skill-item">
              <span>${s}</span>
              <span class="skill-level-badge level-${lvl}" style="background-color: var(--level-${lvl}); color: ${lvl >= 5 ? 'white' : '#1e293b'};">Level ${lvl}</span>
            </div>`).join('')}
        </div>
        ${missingSkills.length > 0 ? `
          <h4 style="margin-top: 2rem; color: var(--danger-color);">Skills Gaps (${missingSkills.length})</h4>
          <div class="skills-list">
            ${missingSkills.map(s => `<div class="skill-item"><span>${s}</span><span style="color: var(--secondary-color);">Not acquired</span></div>`).join('')}
          </div>` : ''}
    </div>`;
    categories.forEach(cat => {
        const items = resource.subSkills[cat] || {};
        const datesForCat = lastAssessed[cat] || {};
        panelsHtml += `<div class="profile-tab-panel" data-panel="${cat.replace(/"/g, '&quot;')}">
          <h4>${cat}</h4>
          <div class="skills-list">
            ${Object.entries(items).sort((a, b) => b[1] - a[1]).map(([sub, lvl]) => `
              <div class="skill-item">
                <span>${sub} ${staleHint(datesForCat[sub])}</span>
                <span class="skill-level-badge level-${lvl}" style="background-color: var(--level-${lvl}); color: ${lvl >= 5 ? 'white' : '#1e293b'};">Level ${lvl}</span>
              </div>`).join('')}
          </div>
        </div>`;
    });

    let html = `
        <div class="profile-header">
            <h3>${resource.name}</h3>
            <p>${resource.email}</p>
        </div>

        <div class="profile-chart">
            <canvas id="resourceRadarChart"></canvas>
        </div>

        ${tabsHtml}
        ${panelsHtml}
    `;

    // Display in modal instead of inline
    const modalContent = document.getElementById('modalProfileContent');
    modalContent.innerHTML = html;

    // Wire tab clicks
    modalContent.querySelectorAll('.profile-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            modalContent.querySelectorAll('.profile-tab').forEach(b => b.classList.toggle('active', b === btn));
            modalContent.querySelectorAll('.profile-tab-panel').forEach(p => {
                p.classList.toggle('active', p.dataset.panel === tab);
            });
        });
    });

    // Show modal
    const modal = document.getElementById('profileModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Render individual radar chart
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
    displaySkillCards(data.skills, data.resources);

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
            displaySkillCards(filtered, currentData.resources);
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

function displaySkillCards(skills, resources = []) {
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
        // Expert (L4+) count at the main-skill level — same definition the
        // dashboard SPOF tile uses. Only flag main skills that actually have
        // sub-skills (orphan parents are not actionable).
        const expertCount = resources.filter(r => r.skills && r.skills[skill.name] >= 4).length;
        const flagNoExperts = expertCount === 0 && subSkillCount > 0;
        const noExpertsBadge = flagNoExperts
            ? `<div class="skill-no-experts-badge" title="No team member is rated L4+ in ${safeName}.">
                  <span class="spof-icon" aria-hidden="true">⚠</span>
                  <span class="spof-label">No experts (L4+)</span>
               </div>`
            : '';

        return `
            <div class="resource-card${flagNoExperts ? ' is-no-experts' : ''}" data-skill-id="${skill.id}" style="position: relative;">
                <button class="delete-skill-btn" data-skill-id="${skill.id}" data-skill-name="${safeName}">×</button>
                <h4 style="margin: 0 2rem 0.4rem 0;">${skill.name}</h4>
                <span style="display: inline-block; background: ${typeColor}; color: white; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.5rem;">${typeBadge}</span>
                ${noExpertsBadge}
                <p style="color: var(--text-light); font-size: 0.9rem; margin: 0.25rem 0;"><strong>Weight:</strong> ${skill.weight || 5}/10</p>
                <p style="color: var(--text-light); font-size: 0.9rem; margin: 0;"><strong>${subSkillCount}</strong> sub-skills</p>
                <div class="resource-card-actions">
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
        showToast('Please enter a skill name', 'error');
        return;
    }

    if (isNaN(newWeight) || newWeight < 1 || newWeight > 10) {
        showToast('Please enter a weight between 1 and 10', 'error');
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
        showToast('Skill updated successfully', 'success');
    } catch (error) {
        console.error('Failed to save skill changes:', error);
        showToast(`Error saving skill changes: ${error.message}`, 'error');
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
    try {
        const confirmed = await showConfirmModal(`Are you sure you want to delete "${skillName}"? This will remove it from all resources and delete all its sub-skills.`, { title: 'Delete Skill', confirmLabel: 'Delete' });

        if (!confirmed) return;

        await API.deleteSkill(skillId);
        clearDataCache();
        await renderSkills();
        showToast(`"${skillName}" deleted`, 'success');
    } catch (error) {
        console.error('Error in deleteMainSkill:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function deleteResource(resourceId, resourceName) {
    try {
        const confirmed = await showConfirmModal(`Are you sure you want to delete "${resourceName}"? This will permanently remove this resource and all their skill data.`, { title: 'Delete Resource', confirmLabel: 'Delete' });

        if (!confirmed) return;

        await API.deleteResource(resourceId);
        clearDataCache();
        await renderSearch();
        showToast(`"${resourceName}" removed`, 'success');
    } catch (error) {
        console.error('Error in deleteResource:', error);
        showToast(`Error: ${error.message}`, 'error');
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
            showToast('Please enter a skill name', 'error');
            return;
        }

        if (isNaN(weight) || weight < 1 || weight > 10) {
            showToast('Please enter a weight between 1 and 10', 'error');
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
            await API.createSkill(skillData);
            clearDataCache();
            await renderSkills();
            closeAddSkillModal();
            newSkillSubSkills = []; // Clear the array
            showToast(`Skill "${name}" created`, 'success');
        } catch (error) {
            console.error('Failed to create skill:', error);
            showToast(`Error creating skill: ${error.message}`, 'error');
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
            showToast('Please enter a name', 'error');
            return;
        }

        if (!email) {
            showToast('Please enter a username', 'error');
            return;
        }

        if (!password) {
            showToast('Please enter a password', 'error');
            return;
        }

        try {
            const resourceData = {
                id: `eng-${Date.now()}`,
                name: name,
                email: email,
                password: password,
                job_role: document.getElementById('newResourceJobRole').value || null,
            };
            await API.createResource(resourceData);
            clearDataCache();
            await renderSearch();
            closeAddResourceModal();
            showToast(`Resource "${name}" added`, 'success');
        } catch (error) {
            console.error('Failed to create resource:', error);
            showToast(`Error creating resource: ${error.message}`, 'error');
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

let managementListenersInit = false;

function renderManagement() {
    loadAdminUsers();
    loadApiKeyStatus();
    if (!managementListenersInit) {
        managementListenersInit = true;
        document.getElementById('addAdminUser').addEventListener('click', addAdminUser);
        document.getElementById('exportData').addEventListener('click', exportData);
        const csvBtn = document.getElementById('exportCsv');
        if (csvBtn) csvBtn.addEventListener('click', exportCsv);
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', importData);
        document.getElementById('resetData').addEventListener('click', resetData);

        document.getElementById('anthropicSaveBtn').addEventListener('click', () => saveApiKey('anthropic_api_key'));
        document.getElementById('anthropicRevokeBtn').addEventListener('click', () => revokeApiKey('anthropic_api_key'));
    }
}

async function loadApiKeyStatus() {
    try {
        const r = await fetch(`${API_BASE}/settings/api-keys`);
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'failed');
        const a = j.data.anthropic_api_key || { configured: false };
        const statusEl = document.getElementById('anthropicStatus');
        const revokeBtn = document.getElementById('anthropicRevokeBtn');
        if (statusEl) {
            if (a.configured) {
                statusEl.innerHTML = `<span class="apikey-ok">● Configured${a.source === 'env' ? ' (from .env)' : ''}</span>`;
                revokeBtn.hidden = a.source === 'env';   // can't revoke env vars from UI
            } else {
                statusEl.innerHTML = '<span class="apikey-off">○ Not set</span>';
                revokeBtn.hidden = true;
            }
        }
    } catch (err) {
        const statusEl = document.getElementById('anthropicStatus');
        if (statusEl) statusEl.innerHTML = `<span class="apikey-off">load failed: ${escapeHtml(err.message)}</span>`;
    }
}

async function saveApiKey(name) {
    const input = name === 'anthropic_api_key' ? document.getElementById('anthropicKeyInput') : null;
    if (!input) return;
    const value = input.value.trim();
    if (!value) {
        showToast('Paste a key first', 'error');
        return;
    }
    try {
        const r = await fetch(`${API_BASE}/settings/api-keys/${name}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
        input.value = '';
        showToast('API key saved', 'success');
        loadApiKeyStatus();
    } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
    }
}

async function revokeApiKey(name) {
    if (!(await showConfirmModal('Revoke this API key? Any AI feature using it will stop working until a new key is set.', { title: 'Revoke API key' }))) return;
    try {
        const r = await fetch(`${API_BASE}/settings/api-keys/${name}`, { method: 'DELETE' });
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'revoke failed');
        showToast('API key revoked', 'success');
        loadApiKeyStatus();
    } catch (err) {
        showToast(`Revoke failed: ${err.message}`, 'error');
    }
}

async function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">Loading...</p>';
    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const users = await response.json();

        if (users.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 0.5rem 0; font-size: 0.9rem;">No administrators configured.</p>';
            return;
        }

        container.innerHTML = users.map(u => `
            <div class="admin-user-row">
                <span class="admin-username">${u.username}</span>
                <button class="btn-danger btn-sm" onclick="removeAdminUser('${u.username.replace(/'/g, "\\'")}')">Remove</button>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p style="color: var(--danger); font-size: 0.9rem;">Error loading users: ${error.message}</p>`;
    }
}

async function addAdminUser() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!username || !password) {
        showToast('Please enter both username and password.', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to add user');
        }

        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        await loadAdminUsers();
        showToast(`User "${username}" added`, 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function removeAdminUser(username) {
    const confirmed = await showConfirmModal(`Remove administrator "${username}"?`, { title: 'Remove User', confirmLabel: 'Remove' });
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to remove user');
        }

        await loadAdminUsers();
        showToast(`User "${username}" removed`, 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}


async function exportCsv() {
    try {
        const res = await fetch('/api/export/csv');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `skills-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        showToast('CSV export downloaded', 'success');
    } catch (err) {
        showToast('CSV export failed: ' + err.message, 'error');
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

            const confirmed = await showConfirmModal('This will replace all current data. Continue?', { title: 'Import Data', confirmLabel: 'Import' });
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
    const confirmed = await showConfirmModal('This will reset all data to sample data. Continue?', { title: 'Reset Data', confirmLabel: 'Reset' });
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
            const stype = skillCategory.skillType || 'technical';
            categorySection.className = `collapsible-category type-${stype}`;
            categorySection.dataset.skillType = stype;

            // Create category header with select-all
            const header = document.createElement('div');
            header.className = 'category-header';

            // Toggle icon
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.textContent = '▶'; // Collapsed by default

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
        const canvas = document.getElementById('customRadarChart');
        const placeholder = document.getElementById('radarPlaceholder');
        if (canvas) canvas.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
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

    // Show chart canvas, hide placeholder
    const canvas = document.getElementById('customRadarChart');
    const placeholder = document.getElementById('radarPlaceholder');
    if (canvas) canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

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

// Suitable Resources panel beneath the Custom Radar chart. Computed live as
// sub-skill checkboxes toggle: average each resource's rating across the
// selected sub-skills (missing rating counts as 0 so coverage matters), then
// rank descending. Re-uses the role accent palette from the rest of the app.
async function renderRadarResourceList() {
    const panel = document.getElementById('radarResourcePanel');
    const list = document.getElementById('radarResourceList');
    const countEl = document.getElementById('radarResourceCount');
    if (!panel || !list) return;

    const container = document.getElementById('subSkillCheckboxes');
    const selected = Array.from(container.querySelectorAll('input.subskill-checkbox:checked'))
        .map(cb => ({ name: cb.value, category: cb.dataset.category }));

    if (selected.length === 0) {
        panel.style.display = 'none';
        list.innerHTML = '';
        if (countEl) countEl.textContent = '';
        return;
    }

    const data = await getData();
    const pmRoles = new Set(['Project Manager', 'Project Coordinator', 'Senior Project Manager']);

    const scored = (data.resources || []).map(r => {
        const perSkill = selected.map(sel => {
            const lvl = (r.subSkills && r.subSkills[sel.category] && r.subSkills[sel.category][sel.name]) || 0;
            return { name: sel.name, level: lvl };
        });
        const sum = perSkill.reduce((a, s) => a + s.level, 0);
        const avg = sum / selected.length;
        const coverage = perSkill.filter(s => s.level > 0).length;
        const proficient = perSkill.filter(s => s.level >= 3).length;
        return { resource: r, perSkill, avg, sum, coverage, proficient };
    })
    .filter(row => row.sum > 0) // only show resources with at least one rating
    .sort((a, b) => {
        if (b.avg !== a.avg) return b.avg - a.avg;
        if (b.coverage !== a.coverage) return b.coverage - a.coverage;
        return a.resource.name.localeCompare(b.resource.name);
    });

    panel.style.display = 'block';
    if (countEl) {
        countEl.textContent = scored.length === 1
            ? '1 match'
            : `${scored.length} matches`;
    }

    if (scored.length === 0) {
        list.innerHTML = '<p class="radar-resource-empty">No resources have any of the selected sub-skills yet.</p>';
        return;
    }

    list.innerHTML = scored.map(row => {
        const r = row.resource;
        const roleClass = pmRoles.has(r.job_role) ? 'role-nontech'
                       : (r.job_role ? 'role-tech' : '');
        const chips = row.perSkill.map(s => {
            const cls = s.level > 0 ? `level-${s.level}` : 'level-empty';
            return `<span class="radar-rr-chip ${cls}" title="${escapeHtml(s.name)} — L${s.level}">${escapeHtml(s.name)}<span class="lvl">L${s.level}</span></span>`;
        }).join('');
        return `
            <div class="radar-rr-row ${roleClass}">
                <div class="radar-rr-head">
                    <span class="radar-rr-name">${escapeHtml(r.name)}</span>
                    ${r.job_role ? `<span class="radar-rr-role">${escapeHtml(r.job_role)}</span>` : ''}
                    <span class="radar-rr-score">avg ${row.avg.toFixed(2)}</span>
                    <span class="radar-rr-meta">${row.coverage}/${selected.length} rated · ${row.proficient} at L3+</span>
                </div>
                <div class="radar-rr-chips">${chips}</div>
            </div>
        `;
    }).join('');
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
        await renderRadarResourceList();
    });

    clearBtn.addEventListener('click', () => {
        console.log('Clear selections clicked');
        const checkboxes = document.querySelectorAll('#subSkillCheckboxes input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        if (customRadarChart) {
            customRadarChart.destroy();
            customRadarChart = null;
        }

        // Hide chart canvas, show placeholder
        const canvas = document.getElementById('customRadarChart');
        const placeholder = document.getElementById('radarPlaceholder');
        if (canvas) canvas.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        // Clear the suitable-resources panel too
        renderRadarResourceList();
    });

    // Live update of the suitable-resources panel as sub-skill boxes toggle.
    // Delegated so it covers dynamically-rendered category trees, debounced
    // because rapid select-all toggles can fire many events at once.
    const checkboxesContainer = document.getElementById('subSkillCheckboxes');
    if (checkboxesContainer) {
        const debouncedRender = debounce(() => renderRadarResourceList(), 120);
        checkboxesContainer.addEventListener('change', (e) => {
            if (e.target && e.target.matches('input.subskill-checkbox, input.select-all-checkbox')) {
                debouncedRender();
            }
        });
    }

    // Setup search filter (debounced)
    searchInput.addEventListener('input', debounce(() => {
        filterSubSkills();
    }, 150));

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

    // Set resource name, email, password, and job role
    document.getElementById('modalResourceName').textContent = resource.name;
    document.getElementById('modalResourceEmail').value = resource.email || '';
    document.getElementById('modalResourcePassword').value = resource.password || '';
    const roleSelect = document.getElementById('modalResourceJobRole');
    if (roleSelect) roleSelect.value = resource.job_role || '';

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

function showConfirmModal(message, { title = 'Confirm Action', confirmLabel = 'Yes' } = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmModalMessage');
        const titleEl = document.getElementById('confirmModalTitle');
        const yesBtn = document.getElementById('confirmModalYes');
        const noBtn = document.getElementById('confirmModalNo');

        if (!modal || !messageEl || !yesBtn || !noBtn) {
            resolve(false);
            return;
        }

        messageEl.textContent = message;
        if (titleEl) titleEl.textContent = title;
        yesBtn.textContent = confirmLabel;
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

    // Pick up job-role change from the dropdown
    const roleSelect = document.getElementById('modalResourceJobRole');
    if (roleSelect) resource.job_role = roleSelect.value || null;

    // Save to API
    try {
        await API.updateResource(currentModalResourceId, resource);

        // Close modal
        closeResourceModal();

        // Clear cache and refresh the search results
        clearDataCache();
        await renderSearch();
        showToast('Skills saved successfully', 'success');
    } catch (error) {
        console.error('Error saving skills:', error);
        showToast('Failed to save skills. Please try again.', 'error');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('resourceModal');
    if (e.target === modal) {
        closeResourceModal();
    }
});

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // Trigger slide-in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Auto-remove after 3.5s
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    setupNavigation();
    await updateLastUpdated();
    await renderDashboard();
    wireSignOut();
});

/**
 * HTTP-basic-auth sign-out is browser-quirky. The reliable trick:
 *   1. Send a fetch with intentionally-invalid Authorization to force browsers
 *      to drop the cached credentials.
 *   2. Redirect to the public /welcome page so the user can't see protected
 *      content while the prompt is suppressed.
 */
function wireSignOut() {
    const btn = document.getElementById('signOutBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        try {
            // Fire-and-forget bad-creds request; we ignore the rejection
            await fetch('/api/health', {
                headers: { 'Authorization': 'Basic ' + btoa('logout:logout') },
                cache: 'no-store',
            }).catch(() => {});
        } catch (_) { /* ignore */ }
        window.location.href = '/welcome.html';
    });
}

// ==================== STAFFING VIEW ====================

let staffingReqRows = [];
let staffingInitialized = false;

async function renderStaffing() {
    const data = await getData();
    const list = document.getElementById('staffingRequirements');
    if (!list) return;

    // Seed with one row if empty
    if (staffingReqRows.length === 0) {
        staffingReqRows = [{ mainSkill: data.skills[0] ? data.skills[0].name : '', minLevel: 3 }];
    }

    renderStaffingRows(data);

    if (!staffingInitialized) {
        document.getElementById('addStaffingReq').addEventListener('click', () => {
            const cur = getData ? data : null;
            staffingReqRows.push({ mainSkill: cur && cur.skills[0] ? cur.skills[0].name : '', minLevel: 3 });
            renderStaffingRows(cur);
        });
        document.getElementById('runStaffingMatch').addEventListener('click', async () => {
            await runStaffingMatch();
        });
        staffingInitialized = true;
    }
}

function renderStaffingRows(data) {
    const list = document.getElementById('staffingRequirements');
    if (!list || !data) return;
    list.innerHTML = staffingReqRows.map((req, i) => `
        <div class="staffing-row" data-index="${i}">
            <select class="staffing-skill">
                ${data.skills.map(s => `<option value="${s.name}" ${s.name === req.mainSkill ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
            <span>≥</span>
            <select class="staffing-level">
                ${[1,2,3,4,5].map(n => `<option value="${n}" ${n === req.minLevel ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
            <button type="button" class="btn-secondary staffing-remove" aria-label="remove">×</button>
        </div>
    `).join('');

    list.querySelectorAll('.staffing-row').forEach(row => {
        const idx = Number(row.dataset.index);
        row.querySelector('.staffing-skill').addEventListener('change', e => {
            staffingReqRows[idx].mainSkill = e.target.value;
        });
        row.querySelector('.staffing-level').addEventListener('change', e => {
            staffingReqRows[idx].minLevel = Number(e.target.value);
        });
        row.querySelector('.staffing-remove').addEventListener('click', () => {
            staffingReqRows.splice(idx, 1);
            renderStaffingRows(data);
        });
    });
}

async function runStaffingMatch() {
    const out = document.getElementById('staffingResults');
    out.innerHTML = '<p>Searching…</p>';
    try {
        const [matches, oneAway] = await Promise.all([
            StaffingAPI.search(staffingReqRows, 'match'),
            StaffingAPI.search(staffingReqRows, 'one-away'),
        ]);
        const renderList = (title, items, cssClass) => {
            if (items.length === 0) return `<h3>${title}</h3><p class="empty">None.</p>`;
            return `<h3>${title} <span class="badge">${items.length}</span></h3>
              <ul class="staffing-list ${cssClass}">
                ${items.map(r => {
                    const gaps = r.gaps && r.gaps.length
                        ? `<small>needs +1 in: ${r.gaps.map(g => g.mainSkill).join(', ')}</small>`
                        : '';
                    return `<li><strong>${r.name}</strong> <span class="muted">${r.email || ''}</span>${gaps ? '<br>' + gaps : ''}</li>`;
                }).join('')}
              </ul>`;
        };
        out.innerHTML =
            renderList('Team members who meet every requirement', matches, 'staffing-list--match') +
            renderList('Team members one level away', oneAway, 'staffing-list--away');
    } catch (err) {
        out.innerHTML = `<p class="error">Search failed: ${err.message}</p>`;
    }
}

// ==================== COMPARE VIEW ====================

let comparePickedIds = [];

async function renderCompare() {
    const data = await getData();
    const picker = document.getElementById('compareResourcePicker');
    if (!picker) return;

    if (comparePickedIds.length === 0) {
        comparePickedIds = data.resources.slice(0, 2).map(r => r.id);
    }

    // Colour each name by role family (blue=engineering, green=project-management)
    const pmRoles = new Set(['Project Manager', 'Project Coordinator', 'Senior Project Manager']);
    const roleCls = (r) => pmRoles.has(r.job_role) ? 'role-nontech'
                        : (r.job_role ? 'role-tech' : '');

    picker.innerHTML = '<p style="margin: 0 0 0.5rem;">Pick 2–4 users:</p>' +
        data.resources.map(r => `
            <label class="compare-pick ${roleCls(r)}">
                <input type="checkbox" value="${r.id}" ${comparePickedIds.includes(r.id) ? 'checked' : ''}>
                <span class="compare-pick-name">${escapeHtml(r.name)}</span>
            </label>
        `).join('');

    picker.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', async () => {
            const checked = Array.from(picker.querySelectorAll('input:checked')).map(x => x.value);
            if (checked.length > 4) {
                cb.checked = false;
                showToast('Maximum 4 users can be compared at once.', 'info');
                return;
            }
            comparePickedIds = checked;
            drawCompareHeatmap(data);
        });
    });
    drawCompareHeatmap(data);
}

function drawCompareHeatmap(data) {
    const host = document.getElementById('compareHeatmap');
    if (!host) return;
    if (comparePickedIds.length < 2) {
        host.innerHTML = '<p class="empty">Pick at least 2 users above.</p>';
        return;
    }
    const cols = (data.skills || []).filter(s => s.subSkills && s.subSkills.length > 0);
    if (cols.length === 0) {
        host.innerHTML = '<p class="empty">No skills tracked yet.</p>';
        return;
    }
    const pmRoles = new Set(['Project Manager', 'Project Coordinator', 'Senior Project Manager']);
    const rows = comparePickedIds
        .map(id => data.resources.find(r => r.id === id))
        .filter(Boolean);

    let html = '<table class="compare-heatmap"><thead><tr><th class="sticky-col">User</th>';
    cols.forEach(c => {
        html += `<th title="weight ${c.weight}">${escapeHtml(c.name)}</th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach(r => {
        const rcls = pmRoles.has(r.job_role) ? 'name-nontech'
                    : (r.job_role ? 'name-tech' : '');
        html += `<tr><td class="resource-name sticky-col ${rcls}">${escapeHtml(r.name)}</td>`;
        cols.forEach(c => {
            const lvl = (r.skills && r.skills[c.name]) || 0;
            html += `<td class="skill-cell level-${lvl}" title="${escapeHtml(r.name)} — ${escapeHtml(c.name)}: ${lvl || 'none'}">${lvl || '-'}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';

    // Footer: per-skill average across the SELECTED users
    html += '<tfoot><tr><th class="sticky-col">Group avg</th>';
    cols.forEach(c => {
        const vals = rows.map(r => (r.skills && r.skills[c.name]) || 0).filter(v => v > 0);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        html += `<th class="hm-foot-cell"><div class="hm-foot-avg">${avg ? avg.toFixed(1) : '—'}</div></th>`;
    });
    html += '</tr></tfoot></table>';

    host.innerHTML = html;
}

// ==================== DATA QUALITY VIEW ====================

async function renderQuality() {
    const summary = document.getElementById('qualitySummary');
    const detail = document.getElementById('qualityDetail');
    if (!summary || !detail) return;
    summary.innerHTML = '<p>Loading…</p>';
    detail.innerHTML = '';

    try {
        const dq = await DataQualityAPI.get(365);
        const s = dq.summary;
        summary.innerHTML = `
            <div class="quality-card ${s.noSkillsCount ? 'warn' : 'ok'}">
              <div class="qc-num">${s.noSkillsCount}</div>
              <div class="qc-label">Resources with no ratings</div>
            </div>
            <div class="quality-card ${s.noEmailCount ? 'warn' : 'ok'}">
              <div class="qc-num">${s.noEmailCount}</div>
              <div class="qc-label">Resources with no username</div>
            </div>
            <div class="quality-card ${s.emptySkillCount ? 'warn' : 'ok'}">
              <div class="qc-num">${s.emptySkillCount}</div>
              <div class="qc-label">Skills with no sub-skills</div>
            </div>
            <div class="quality-card ${s.staleRatingCount ? 'warn' : 'ok'}">
              <div class="qc-num">${s.staleRatingCount}</div>
              <div class="qc-label">Ratings &gt; 365 days old</div>
            </div>
            <div class="quality-card ${s.expiringCertCount ? 'warn' : 'ok'}">
              <div class="qc-num">${s.expiringCertCount || 0}</div>
              <div class="qc-label">Certs expiring &lt; 90 days</div>
            </div>
        `;
        detail.innerHTML = `
            ${renderQualityList('Resources with no ratings', dq.resourcesWithNoSkills, r => `${r.name} <span class="muted">(${r.id})</span>`)}
            ${renderQualityList('Resources without a username', dq.resourcesWithNoEmail, r => r.name)}
            ${renderQualityList('Empty main skills', dq.emptyMainSkills, r => `${r.name} <span class="muted">(${r.id})</span>`)}
            ${renderQualityList('Stale ratings (oldest first)', dq.staleRatings.slice(0, 20),
                r => `${r.resource_name} — ${r.main_skill} :: ${r.sub_skill} <span class="muted">${r.days_old} days old</span>`)}
            ${renderQualityList('Certifications expiring within 90 days', (dq.expiringCerts || []),
                r => {
                    const d = r.days_until_expiry;
                    const tag = d < 0 ? `<span class="muted">expired ${Math.abs(d)}d ago</span>`
                              : d === 0 ? `<span class="muted">expires today</span>`
                              : `<span class="muted">${d}d to go</span>`;
                    return `${escapeHtml(r.resource_name)} — ${escapeHtml(r.training_name)}${r.training_code ? ' (' + escapeHtml(r.training_code) + ')' : ''} ${tag}`;
                })}
        `;
    } catch (err) {
        summary.innerHTML = `<p class="error">Could not load data quality: ${err.message}</p>`;
    }
}

function renderQualityList(title, items, formatter) {
    if (!items || items.length === 0) {
        return `<section class="quality-section"><h3>${title}</h3><p class="empty">Nothing flagged.</p></section>`;
    }
    return `<section class="quality-section">
        <h3>${title} <span class="badge">${items.length}</span></h3>
        <ul class="quality-list">${items.map(it => `<li>${formatter(it)}</li>`).join('')}</ul>
    </section>`;
}

// Dashboard tile populator (training)
async function populateTrainingTile() {
    const valueEl = document.getElementById('trainingActive');
    const hintEl  = document.getElementById('trainingHint');
    if (!valueEl || !hintEl) return;
    try {
        const r = await fetch(`${API_BASE}/trainings/assignments/all`);
        const j = await r.json();
        const items = j && j.data ? j.data : [];
        const counts = { 'in-progress': 0, planned: 0, achieved: 0, expired: 0 };
        items.forEach(a => { if (counts[a.status] !== undefined) counts[a.status] += 1; });
        valueEl.textContent = counts['in-progress'];
        hintEl.textContent  = `${counts.planned} planned · ${counts.achieved} achieved`;
    } catch (err) {
        valueEl.textContent = '—';
        hintEl.textContent  = 'training data unavailable';
    }
    // Also surface the "certs expiring soon" banner on the dashboard
    populateExpiryBanner().catch(() => {});
}

async function populateExpiryBanner() {
    const banner = document.getElementById('expiryBanner');
    if (!banner) return;
    const WINDOW_DAYS = 90;
    try {
        const r = await fetch(`${API_BASE}/trainings/assignments/expiring?within=${WINDOW_DAYS}`);
        const j = await r.json();
        const items = (j && j.data) || [];
        if (!items.length) {
            banner.hidden = true;
            banner.innerHTML = '';
            return;
        }
        const overdue = items.filter(i => i.days_until_expiry < 0).length;
        const soon = items.filter(i => i.days_until_expiry >= 0 && i.days_until_expiry <= 30).length;
        const within90 = items.length - overdue - soon;
        let summary = '';
        if (overdue)  summary += `${overdue} expired · `;
        if (soon)     summary += `${soon} within 30 days · `;
        if (within90) summary += `${within90} within 90 days · `;
        summary = summary.replace(/ · $/, '');
        banner.hidden = false;
        banner.innerHTML = `
          <span class="alert-icon">⚠</span>
          <span class="alert-text"><strong>${items.length} certification${items.length === 1 ? ' is' : 's are'} expiring soon</strong> — ${summary}</span>
          <button class="btn-secondary alert-action" onclick="navigateToTraining(); setTimeout(() => { const t = document.querySelector('#training-view .t-tab[data-t-tab=\\'certifications\\']'); if (t) t.click(); }, 400);">Review</button>
        `;
    } catch (err) {
        banner.hidden = true;
    }
}

// ==================== TRAINING ====================

const TrainingsAPI = {
    list: () => fetch(`${API_BASE}/trainings`).then(r => r.json()).then(j => j.data || []),
    create: (body) => apiJson(`${API_BASE}/trainings`, 'POST', body),
    update: (id, body) => apiJson(`${API_BASE}/trainings/${id}`, 'PUT', body),
    delete: (id) => apiJson(`${API_BASE}/trainings/${id}`, 'DELETE'),
    assignmentsAll: () => fetch(`${API_BASE}/trainings/assignments/all`).then(r => r.json()).then(j => j.data || []),
    expiring: (within = 365) => fetch(`${API_BASE}/trainings/assignments/expiring?within=${within}`).then(r => r.json()).then(j => j.data || []),
    assignmentsFor: (rid) => fetch(`${API_BASE}/trainings/assignments/resource/${rid}`).then(r => r.json()).then(j => j.data || []),
    assign: (body) => apiJson(`${API_BASE}/trainings/assignments`, 'POST', body),
    updateAssignment: (aid, body) => apiJson(`${API_BASE}/trainings/assignments/${aid}`, 'PUT', body),
    deleteAssignment: (aid) => apiJson(`${API_BASE}/trainings/assignments/${aid}`, 'DELETE'),
};

async function apiJson(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await r.json() : null;
    if (!r.ok || (payload && payload.success === false)) {
        throw new Error((payload && payload.error) || `HTTP ${r.status}`);
    }
    return payload && payload.data;
}

let trainingState = {
    catalogue: [],
    assignmentsResourceId: '',     // '' = ALL resources (default)
    assignments: [],
    activeTab: 'assignments',
    editingTrainingId: null,
    editingAssignmentId: null,
    catalogueSearch: '',
};
let trainingListenersBound = false;

async function renderTraining() {
    const data = await getData();
    trainingState.catalogue = await TrainingsAPI.list();
    // Resource filter: "" = all resources (default)
    const select = document.getElementById('trainingResourceSelect');
    if (select) {
        select.innerHTML = '<option value="">All resources</option>' +
            data.resources.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`).join('');
        select.value = trainingState.assignmentsResourceId || '';
    }
    bindTrainingListeners();
    await loadAssignmentsForCurrent();
    renderTrainingCatalogue();
    renderTrainingAssignments();
    applyTrainingTabState();
}

function bindTrainingListeners() {
    if (trainingListenersBound) return;
    trainingListenersBound = true;

    // Tab switching
    document.querySelectorAll('#training-view .t-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            trainingState.activeTab = btn.dataset.tTab;
            applyTrainingTabState();
        });
    });

    // Resource filter: empty string = all resources
    document.getElementById('trainingResourceSelect').addEventListener('change', async (e) => {
        trainingState.assignmentsResourceId = e.target.value || '';
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
    });

    // Catalogue add button
    document.getElementById('trainingAddBtn').addEventListener('click', () => openTrainingEditModal(null));
    // Catalogue search (debounced)
    document.getElementById('trainingCatalogueSearch').addEventListener('input', debounce(e => {
        trainingState.catalogueSearch = (e.target.value || '').toLowerCase();
        renderTrainingCatalogue();
    }, 150));

    // Assignment "Assign Training" button
    document.getElementById('trainingAssignBtn').addEventListener('click', () => openTrainingAssignModal(null));

    // Modal save buttons
    document.getElementById('trEditSaveBtn').addEventListener('click', saveTrainingEdit);
    document.getElementById('trAssignSaveBtn').addEventListener('click', saveTrainingAssignment);

    // Delegated click handling on catalogue + assignments lists
    document.getElementById('trainingCatalogueList').addEventListener('click', onCatalogueClick);
    document.getElementById('trainingAssignmentsList').addEventListener('click', onAssignmentsClick);
}

function applyTrainingTabState() {
    document.querySelectorAll('#training-view .t-tab').forEach(b => {
        b.classList.toggle('t-tab-active', b.dataset.tTab === trainingState.activeTab);
    });
    document.querySelectorAll('#training-view .t-pane').forEach(p => {
        p.classList.toggle('t-pane-active', p.dataset.tPane === trainingState.activeTab);
    });
    if (trainingState.activeTab === 'certifications') {
        renderCertifications().catch(() => {});
    }
}

let certStatusChart = null;
async function renderCertifications() {
    const list = document.getElementById('certExpiryList');
    const canvas = document.getElementById('certStatusChart');
    if (!canvas || !list) return;

    let assignments = [];
    try {
        assignments = await TrainingsAPI.assignmentsAll();
    } catch (err) {
        list.innerHTML = `<p class="empty">Could not load assignments: ${err.message}</p>`;
        return;
    }

    // Group by training_name, count statuses
    const byTraining = new Map();
    assignments.forEach(a => {
        const key = a.training_name;
        if (!byTraining.has(key)) byTraining.set(key, { planned: 0, 'in-progress': 0, achieved: 0, expired: 0, code: a.training_code, vendor: a.vendor });
        const bucket = byTraining.get(key);
        if (bucket[a.status] !== undefined) bucket[a.status] += 1;
    });

    // Show every training that has at least one assignment, so an individual's
    // less-common certs (e.g. a single Meraki Solutions Specialist) still appear.
    // Stable sort: total desc, then name asc — ties don't shuffle between renders.
    const entries = Array.from(byTraining.entries())
        .map(([name, c]) => ({ name, ...c, total: c.planned + c['in-progress'] + c.achieved + c.expired }))
        .sort((a, b) => (b.total - a.total) || a.name.localeCompare(b.name));

    // Grow the chart container so horizontal bars stay readable as the catalogue grows.
    const chartHost = canvas.parentElement;
    if (chartHost) {
        const target = Math.max(280, entries.length * 32 + 80);
        chartHost.style.height = target + 'px';
    }

    if (certStatusChart) certStatusChart.destroy();
    if (entries.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No assignments yet — assign a training to start tracking.', canvas.width / 2, canvas.height / 2);
    } else {
        const labels = entries.map(e => e.name);
        const mkSet = (key, label, color) => ({
            label, data: entries.map(e => e[key]),
            backgroundColor: color, borderWidth: 0,
        });
        certStatusChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    mkSet('achieved',    'Achieved',    'rgba(22, 163, 74, 0.85)'),
                    mkSet('in-progress', 'In progress', 'rgba(37, 99, 235, 0.85)'),
                    mkSet('planned',     'Planned',     'rgba(160, 174, 192, 0.75)'),
                    mkSet('expired',     'Expired',     'rgba(220, 38, 38, 0.85)'),
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, ticks: { precision: 0 } },
                    y: { stacked: true },
                },
                plugins: { legend: { position: 'bottom' } },
            },
        });
    }

    // Expiry timeline
    let expiring = [];
    try {
        expiring = await TrainingsAPI.expiring(365);
    } catch (err) {
        // non-fatal
    }
    if (!expiring.length) {
        list.innerHTML = '<p class="empty">No certifications are expiring in the next 12 months.</p>';
        return;
    }
    list.innerHTML = `<ul class="cert-expiry-list">${expiring.map(e => {
        const days = e.days_until_expiry;
        const klass = days < 0 ? 'expired' : days <= 30 ? 'expiring-soon' : days <= 90 ? 'expiring' : '';
        const label = days < 0 ? `expired ${Math.abs(days)}d ago`
                    : days === 0 ? 'expires today'
                    : `expires in ${days}d`;
        return `<li class="${klass}">
            <div class="cert-expiry-main">
                <strong>${escapeHtml(e.training_name)}</strong>
                ${e.training_code ? `<span class="training-code">${escapeHtml(e.training_code)}</span>` : ''}
                <span class="muted"> · ${escapeHtml(e.resource_name)}</span>
            </div>
            <div class="cert-expiry-date">${new Date(e.expiry_date).toLocaleDateString()} <span class="muted">(${label})</span></div>
        </li>`;
    }).join('')}</ul>`;
}

function renderTrainingCatalogue() {
    const list = document.getElementById('trainingCatalogueList');
    if (!list) return;
    const q = trainingState.catalogueSearch;
    const items = (trainingState.catalogue || []).filter(t => {
        if (!q) return true;
        return [t.name, t.code, t.vendor, t.category, t.description]
            .filter(Boolean).join(' ').toLowerCase().includes(q);
    });

    if (items.length === 0) {
        list.innerHTML = '<p class="empty">No trainings in catalogue. Click "Add Training" to add one.</p>';
        return;
    }

    // Group by vendor for readability
    const byVendor = items.reduce((acc, t) => {
        const v = t.vendor || 'Other';
        (acc[v] = acc[v] || []).push(t);
        return acc;
    }, {});

    list.innerHTML = Object.entries(byVendor).map(([vendor, ts]) => `
        <section class="training-group">
            <h3>${escapeHtml(vendor)} <span class="badge">${ts.length}</span></h3>
            <div class="training-cards">
                ${ts.map(t => `
                    <div class="training-card" data-id="${t.id}">
                        <div class="training-card-head">
                            <h4>${escapeHtml(t.name)}</h4>
                            ${t.code ? `<span class="training-code">${escapeHtml(t.code)}</span>` : ''}
                        </div>
                        <div class="training-meta">
                            <span class="training-pill training-pill--${escapeHtml((t.category || 'other').replace(/[^a-z-]/gi, ''))}">${escapeHtml(t.category || 'other')}</span>
                            <span class="training-pill training-pill--type">${escapeHtml(t.type || 'certification')}</span>
                        </div>
                        ${t.description ? `<p class="training-desc">${escapeHtml(t.description)}</p>` : ''}
                        <div class="training-actions">
                            <button class="btn-secondary t-edit-btn" data-id="${t.id}">Edit</button>
                            <button class="btn-danger t-del-btn" data-id="${t.id}">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `).join('');
}

function onCatalogueClick(e) {
    const editBtn = e.target.closest('.t-edit-btn');
    if (editBtn) return openTrainingEditModal(parseInt(editBtn.dataset.id, 10));
    const delBtn = e.target.closest('.t-del-btn');
    if (delBtn) return confirmDeleteTraining(parseInt(delBtn.dataset.id, 10));
}

async function confirmDeleteTraining(id) {
    const item = (trainingState.catalogue || []).find(t => t.id === id);
    if (!item) return;
    const ok = await showConfirmModal(
        `Delete "${item.name}"? This will also remove the training from every resource it is assigned to.`,
        { title: 'Delete training' }
    );
    if (!ok) return;
    try {
        await TrainingsAPI.delete(id);
        trainingState.catalogue = trainingState.catalogue.filter(t => t.id !== id);
        renderTrainingCatalogue();
        // Refresh current resource's assignments — one may have just disappeared
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        showToast(`Deleted "${item.name}"`, 'success');
    } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
    }
}

function openTrainingEditModal(id) {
    trainingState.editingTrainingId = id;
    const existing = id ? trainingState.catalogue.find(t => t.id === id) : null;
    document.getElementById('trainingEditTitle').textContent = existing ? 'Edit Training' : 'Add Training';
    document.getElementById('trEditName').value        = existing ? (existing.name || '') : '';
    document.getElementById('trEditCode').value        = existing ? (existing.code || '') : '';
    document.getElementById('trEditVendor').value      = existing ? (existing.vendor || '') : '';
    document.getElementById('trEditCategory').value    = existing ? (existing.category || 'other') : 'cisco';
    document.getElementById('trEditType').value        = existing ? (existing.type || 'certification') : 'certification';
    document.getElementById('trEditDescription').value = existing ? (existing.description || '') : '';

    // Augment the datalist with any custom categories already used in the catalogue
    refreshCategorySuggestions();

    document.getElementById('trainingEditModal').classList.add('show');
}

function refreshCategorySuggestions() {
    const dl = document.getElementById('trCategorySuggestions');
    if (!dl) return;
    const baseline = new Set(
        Array.from(dl.querySelectorAll('option')).map(o => o.value)
    );
    (trainingState.catalogue || []).forEach(t => {
        if (t.category && !baseline.has(t.category)) {
            const opt = document.createElement('option');
            opt.value = t.category;
            dl.appendChild(opt);
            baseline.add(t.category);
        }
    });
}

function closeTrainingEditModal() {
    document.getElementById('trainingEditModal').classList.remove('show');
    trainingState.editingTrainingId = null;
}
window.closeTrainingEditModal = closeTrainingEditModal;

async function saveTrainingEdit() {
    // Normalise category: lower-case, spaces/underscores → hyphens, strip junk.
    // Keeps the slug-based pill CSS classes well-behaved.
    const rawCat = (document.getElementById('trEditCategory').value || '').trim().toLowerCase();
    const category = rawCat.replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '') || 'other';
    const body = {
        name: document.getElementById('trEditName').value.trim(),
        code: document.getElementById('trEditCode').value.trim() || null,
        vendor: document.getElementById('trEditVendor').value.trim() || null,
        category,
        type: document.getElementById('trEditType').value,
        description: document.getElementById('trEditDescription').value.trim() || null,
    };
    if (!body.name) {
        showToast('Name is required', 'error');
        return;
    }
    try {
        const data = trainingState.editingTrainingId
            ? await TrainingsAPI.update(trainingState.editingTrainingId, body)
            : await TrainingsAPI.create(body);
        // Refresh the in-memory catalogue
        trainingState.catalogue = await TrainingsAPI.list();
        renderTrainingCatalogue();
        closeTrainingEditModal();
        showToast(trainingState.editingTrainingId ? 'Training updated' : 'Training added', 'success');
    } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
    }
}

async function loadAssignmentsForCurrent() {
    try {
        if (trainingState.assignmentsResourceId) {
            trainingState.assignments = await TrainingsAPI.assignmentsFor(trainingState.assignmentsResourceId);
        } else {
            trainingState.assignments = await TrainingsAPI.assignmentsAll();
        }
    } catch (err) {
        trainingState.assignments = [];
    }
}

function renderTrainingAssignments() {
    const list = document.getElementById('trainingAssignmentsList');
    if (!list) return;
    const items = trainingState.assignments;

    // Resource name is always shown on assignment cards so you can tell at a
    // glance whose planned/in-progress/achieved training it is.
    const showResource = true;
    // Empty filter = looking at all resources at once; can't "assign" without
    // picking a specific one first.
    const allResources = !trainingState.assignmentsResourceId;

    const assignBtn = document.getElementById('trainingAssignBtn');
    if (assignBtn) {
        assignBtn.disabled = allResources;
        assignBtn.title = allResources ? 'Pick a resource first to assign a training' : '';
    }

    if (!items.length) {
        list.innerHTML = allResources
            ? '<p class="empty">No trainings assigned to anyone yet. Pick a resource and click "Assign Training" to start.</p>'
            : '<p class="empty">No trainings assigned. Click "Assign Training" to start.</p>';
        return;
    }

    // Group by status for clarity
    const groups = {
        'in-progress': [], 'planned': [], 'achieved': [], 'expired': [],
    };
    items.forEach(it => { if (groups[it.status]) groups[it.status].push(it); });

    const today = new Date();
    list.innerHTML = Object.entries(groups).filter(([, arr]) => arr.length).map(([status, arr]) => `
        <section class="training-group">
            <h3>${formatStatus(status)} <span class="badge">${arr.length}</span></h3>
            <div class="training-cards">
                ${arr.map(a => {
                    const td = a.target_date ? new Date(a.target_date) : null;
                    const overdue = td && status !== 'achieved' && td < today;
                    const ex = a.expiry_date ? new Date(a.expiry_date) : null;
                    const daysToExpiry = ex ? Math.floor((ex - today) / 86400000) : null;
                    const expClass = daysToExpiry === null ? '' :
                        (daysToExpiry < 0 ? 'expired' :
                         daysToExpiry <= 30 ? 'expiring-soon' :
                         daysToExpiry <= 90 ? 'expiring' : '');
                    return `
                    <div class="training-card assignment-card status-${escapeHtml(a.status)}">
                        <div class="training-card-head">
                            <h4>${escapeHtml(a.training_name)}</h4>
                            ${a.training_code ? `<span class="training-code">${escapeHtml(a.training_code)}</span>` : ''}
                        </div>
                        ${showResource && a.resource_name ? `<div class="assignment-resource">${escapeHtml(a.resource_name)}</div>` : ''}
                        <div class="training-meta">
                            <span class="training-pill training-pill--${escapeHtml((a.category || 'other').replace(/[^a-z-]/gi, ''))}">${escapeHtml(a.category || 'other')}</span>
                            <span class="training-pill assignment-pill--${escapeHtml(a.status)}">${formatStatus(a.status)}</span>
                            ${td ? `<span class="training-date ${overdue ? 'overdue' : ''}">target ${td.toLocaleDateString()}</span>` : ''}
                            ${a.completed_date ? `<span class="training-date">completed ${new Date(a.completed_date).toLocaleDateString()}</span>` : ''}
                            ${ex ? `<span class="training-date ${expClass}">expires ${ex.toLocaleDateString()}${daysToExpiry !== null ? ' (' + (daysToExpiry < 0 ? Math.abs(daysToExpiry) + 'd ago' : daysToExpiry + 'd') + ')' : ''}</span>` : ''}
                        </div>
                        ${a.notes ? `<p class="training-desc">${escapeHtml(a.notes)}</p>` : ''}
                        <div class="training-actions">
                            <button class="btn-secondary t-asgn-edit-btn" data-id="${a.id}">Edit</button>
                            <button class="btn-danger t-asgn-del-btn" data-id="${a.id}">Unassign</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </section>
    `).join('');
}

function formatStatus(s) {
    return ({
        'planned': 'Planned',
        'in-progress': 'In progress',
        'achieved': 'Achieved',
        'expired': 'Expired',
    })[s] || s;
}

function onAssignmentsClick(e) {
    const editBtn = e.target.closest('.t-asgn-edit-btn');
    if (editBtn) return openTrainingAssignModal(parseInt(editBtn.dataset.id, 10));
    const delBtn = e.target.closest('.t-asgn-del-btn');
    if (delBtn) return confirmDeleteAssignment(parseInt(delBtn.dataset.id, 10));
}

async function confirmDeleteAssignment(id) {
    const a = trainingState.assignments.find(x => x.id === id);
    if (!a) return;
    const ok = await showConfirmModal(
        `Unassign "${a.training_name}" from this resource?`,
        { title: 'Unassign training' }
    );
    if (!ok) return;
    try {
        await TrainingsAPI.deleteAssignment(id);
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        showToast('Unassigned', 'success');
    } catch (err) {
        showToast(`Unassign failed: ${err.message}`, 'error');
    }
}

function openTrainingAssignModal(assignmentId) {
    trainingState.editingAssignmentId = assignmentId;
    const existing = assignmentId ? trainingState.assignments.find(a => a.id === assignmentId) : null;
    document.getElementById('trainingAssignTitle').textContent =
        existing ? 'Edit Assignment' : 'Assign Training';

    // Populate training dropdown
    const sel = document.getElementById('trAssignTraining');
    const assignedIds = new Set((trainingState.assignments || []).map(a => a.training_id));
    sel.innerHTML = trainingState.catalogue
        .filter(t => existing ? true : !assignedIds.has(t.id))   // when editing, allow current
        .map(t => `<option value="${t.id}">${escapeHtml(t.vendor || 'Other')} — ${escapeHtml(t.name)}${t.code ? ' (' + escapeHtml(t.code) + ')' : ''}</option>`)
        .join('');
    sel.value = existing ? existing.training_id : (sel.options[0] ? sel.options[0].value : '');
    sel.disabled = !!existing;   // can't change training mid-assignment

    document.getElementById('trAssignStatus').value         = existing ? existing.status : 'planned';
    document.getElementById('trAssignTargetDate').value     = existing && existing.target_date ? existing.target_date.slice(0, 10) : '';
    document.getElementById('trAssignCompletedDate').value  = existing && existing.completed_date ? existing.completed_date.slice(0, 10) : '';
    document.getElementById('trAssignExpiryDate').value     = existing && existing.expiry_date ? existing.expiry_date.slice(0, 10) : '';
    document.getElementById('trAssignNotes').value          = existing ? (existing.notes || '') : '';
    updateAssignExpiryVisibility();
    document.getElementById('trAssignStatus').onchange = updateAssignExpiryVisibility;
    document.getElementById('trainingAssignModal').classList.add('show');
}

function updateAssignExpiryVisibility() {
    const status = document.getElementById('trAssignStatus').value;
    const row = document.getElementById('trAssignExpiryRow');
    // Show expiry on Achieved (the main case) AND on In-progress (so you can set
    // the target expiry up-front when the cert is in flight).
    if (row) row.style.display = (status === 'achieved' || status === 'in-progress') ? '' : 'none';
}

function closeTrainingAssignModal() {
    document.getElementById('trainingAssignModal').classList.remove('show');
    trainingState.editingAssignmentId = null;
}
window.closeTrainingAssignModal = closeTrainingAssignModal;

async function saveTrainingAssignment() {
    const status = document.getElementById('trAssignStatus').value;
    const target = document.getElementById('trAssignTargetDate').value || null;
    const completed = document.getElementById('trAssignCompletedDate').value || null;
    const expiry = document.getElementById('trAssignExpiryDate').value || null;
    const notes = document.getElementById('trAssignNotes').value.trim() || null;
    try {
        if (trainingState.editingAssignmentId) {
            await TrainingsAPI.updateAssignment(trainingState.editingAssignmentId,
                { status, target_date: target, completed_date: completed, expiry_date: expiry, notes });
        } else {
            const training_id = parseInt(document.getElementById('trAssignTraining').value, 10);
            if (!training_id) {
                showToast('Pick a training first', 'error');
                return;
            }
            await TrainingsAPI.assign({
                resource_id: trainingState.assignmentsResourceId,
                training_id,
                status, target_date: target, completed_date: completed, expiry_date: expiry, notes,
            });
        }
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        closeTrainingAssignModal();
        showToast(trainingState.editingAssignmentId ? 'Assignment updated' : 'Assignment created', 'success');
    } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
    }
}

// ==================== INSIGHTS ====================

let insightsBound = false;
async function renderInsights() {
    const grid = document.getElementById('insightsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="insights-loading">Loading insights…</div>';

    let insights = [];
    try {
        const r = await fetch(`${API_BASE}/insights`);
        const j = await r.json();
        insights = (j && j.data) || [];
    } catch (err) {
        grid.innerHTML = `<p class="empty">Could not load insights: ${escapeHtml(err.message)}</p>`;
        return;
    }

    grid.innerHTML = insights.map(i => `
        <div class="insight-card insight-${escapeHtml(i.severity || 'info')}">
            <div class="insight-card-head">
                <span class="insight-severity-dot"></span>
                <h4>${escapeHtml(i.title)}</h4>
            </div>
            <p class="insight-body">${escapeHtml(i.body)}</p>
            ${(i.detail && i.detail.length) ? `
                <ul class="insight-detail">
                    ${i.detail.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                </ul>` : ''}
        </div>
    `).join('');

    if (!insightsBound) {
        insightsBound = true;
        document.getElementById('matchSpecBtn').addEventListener('click', runProjectMatch);
        document.getElementById('matchSpecAiBtn').addEventListener('click', runProjectMatchAI);
        document.getElementById('matchSpec').addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runProjectMatch();
        });
    }
}

async function runProjectMatchAI() {
    const spec = (document.getElementById('matchSpec').value || '').trim();
    const out = document.getElementById('matchOutput');
    if (!spec || spec.length < 5) {
        out.innerHTML = '<p class="empty">Give me at least a sentence to work with.</p>';
        return;
    }
    out.innerHTML = '<p class="empty">Asking Claude to analyse…</p>';
    try {
        const r = await fetch(`${API_BASE}/insights/match/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec }),
        });
        const j = await r.json();
        if (r.status === 503) {
            out.innerHTML = '<p class="empty">No Anthropic API key configured. Set one in <strong>Settings → AI / API Keys</strong>, then try again.</p>';
            return;
        }
        if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);

        const rb = j.data.rule_based;
        let html = '';
        // AI analysis first — it's the value-add
        html += `<div class="ai-analysis">
            <h4>✨ AI analysis</h4>
            <div class="ai-prose">${escapeHtml(j.data.ai_analysis || '(no analysis returned)').replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</div>
            <small class="muted">Model: ${escapeHtml(j.data.model || '?')} · ${j.data.usage ? (j.data.usage.input_tokens + ' input + ' + j.data.usage.output_tokens + ' output tokens') : ''}</small>
        </div>`;

        // And the underlying rule-based pick for transparency
        html += '<details class="ai-rulebased"><summary>Rule-based matcher output</summary>';
        html += '<h4>Inferred requirements</h4>';
        html += '<ul class="match-reqs">' + (rb.requirements || []).map(r => `
            <li><strong>${escapeHtml(r.mainSkill)}</strong> <span class="muted">≥ ${r.minLevel}</span></li>`).join('') + '</ul>';
        html += '<h4>Top candidates</h4>';
        html += '<ol class="match-candidates">';
        for (const c of (rb.candidates || [])) {
            const pct = Math.round((c.requirements_met / c.requirements_total) * 100);
            html += `<li>
                <div class="match-cand-head">
                    <strong>${escapeHtml(c.name)}</strong>
                    <span class="match-met">${c.requirements_met} / ${c.requirements_total} requirements met</span>
                    <span class="match-bar"><span class="match-bar-fill" style="width:${pct}%"></span></span>
                </div>
            </li>`;
        }
        html += '</ol></details>';

        out.innerHTML = html;
    } catch (err) {
        out.innerHTML = `<p class="empty">AI analysis failed: ${escapeHtml(err.message)}</p>`;
    }
}

async function runProjectMatch() {
    const spec = (document.getElementById('matchSpec').value || '').trim();
    const out = document.getElementById('matchOutput');
    if (!spec || spec.length < 5) {
        out.innerHTML = '<p class="empty">Give me at least a sentence to work with.</p>';
        return;
    }
    out.innerHTML = '<p class="empty">Matching…</p>';
    try {
        const r = await fetch(`${API_BASE}/insights/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
        const d = j.data;
        if (!d.matched_skills.length) {
            out.innerHTML = `<p class="empty">${escapeHtml(d.note || 'No matching skills found.')}</p>`;
            return;
        }
        let html = '<div class="match-results">';
        html += '<h4>Inferred requirements</h4>';
        html += '<ul class="match-reqs">' + d.requirements.map(r => `
            <li>
                <strong>${escapeHtml(r.mainSkill)}</strong>
                <span class="muted">≥ ${r.minLevel}</span>
                ${r.matched_terms.length ? `<span class="muted">— matched on: ${r.matched_terms.map(escapeHtml).join(', ')}</span>` : ''}
            </li>`).join('') + '</ul>';

        html += '<h4>Top candidates</h4>';
        if (!d.candidates.length) {
            html += '<p class="empty">No team members match these requirements yet.</p>';
        } else {
            html += '<ol class="match-candidates">';
            for (const c of d.candidates) {
                const pct = Math.round((c.requirements_met / c.requirements_total) * 100);
                html += `
                    <li>
                        <div class="match-cand-head">
                            <strong>${escapeHtml(c.name)}</strong>
                            <span class="match-met">${c.requirements_met} / ${c.requirements_total} requirements met</span>
                            <span class="match-bar" title="${pct}% match"><span class="match-bar-fill" style="width:${pct}%"></span></span>
                        </div>
                        ${c.matched.length ? `<div class="match-meta">✓ ${c.matched.map(m => `${escapeHtml(m.skill)} (L${m.level})`).join(', ')}</div>` : ''}
                        ${c.gaps.length ? `<div class="match-meta match-gap">✗ ${c.gaps.map(g => `${escapeHtml(g.skill)} (L${g.level}, ${g.gap} short)`).join(', ')}</div>` : ''}
                    </li>`;
            }
            html += '</ol>';
        }
        html += '</div>';
        out.innerHTML = html;
    } catch (err) {
        out.innerHTML = `<p class="empty">Match failed: ${escapeHtml(err.message)}</p>`;
    }
}

// ==================== FLOATING CHAT WIDGET ====================

const Chat = {
    bound: false,
    history: [],   // [{role:'user'|'assistant', content}]
    busy: false,
    keyChecked: false,
    keyConfigured: false,

    init() {
        if (this.bound) return;
        this.bound = true;
        const launcher = document.getElementById('chatLauncher');
        const closeBtn = document.getElementById('chatCloseBtn');
        const resetBtn = document.getElementById('chatResetBtn');
        const form = document.getElementById('chatForm');
        const input = document.getElementById('chatInput');
        if (!launcher || !closeBtn || !form || !input) return;

        launcher.addEventListener('click', () => this.open());
        closeBtn.addEventListener('click', () => this.close());
        resetBtn.addEventListener('click', () => this.reset());

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.send();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        this.renderEmpty();
    },

    async open() {
        const widget = document.getElementById('chatWidget');
        const panel = document.getElementById('chatPanel');
        widget.dataset.open = 'true';
        panel.hidden = false;
        setTimeout(() => document.getElementById('chatInput')?.focus(), 50);
        // Always re-check key status when opening — user may have just configured it.
        await this.checkKey();
        if (this.history.length === 0) this.renderEmpty();
    },

    close() {
        const widget = document.getElementById('chatWidget');
        const panel = document.getElementById('chatPanel');
        widget.dataset.open = 'false';
        panel.hidden = true;
    },

    reset() {
        this.history = [];
        this.renderEmpty();
    },

    async checkKey() {
        try {
            const r = await fetch(`${API_BASE}/settings/api-keys`);
            const j = await r.json();
            this.keyConfigured = !!(j && j.data && j.data.anthropic_api_key && j.data.anthropic_api_key.configured);
        } catch {
            this.keyConfigured = false;
        }
        this.keyChecked = true;
    },

    renderEmpty() {
        const body = document.getElementById('chatBody');
        if (!body) return;
        if (this.keyChecked && !this.keyConfigured) {
            body.innerHTML = `
                <div class="chat-msg chat-msg-error">
                    <strong>Add an API key to get chat features.</strong><br>
                    No Anthropic API key is configured. Go to <a href="#" id="chatGotoSettings">Settings → AI / API Keys</a> to add one, then come back here.
                </div>`;
            const link = document.getElementById('chatGotoSettings');
            if (link) link.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
                const settingsBtn = document.querySelector('.nav-btn[data-view="management"]');
                if (settingsBtn) settingsBtn.click();
            });
            return;
        }
        const suggestions = [
            'Who are the experts in Cisco ISE?',
            'Which certifications expire in the next 90 days?',
            'Suggest someone for a Kubernetes + Azure project.',
            'Where are our biggest skill gaps?',
        ];
        body.innerHTML = `
            <div class="chat-empty">
                <strong>Ask me anything about the team.</strong><br>
                I can answer questions about resources, skills, sub-skills, certifications, training, and project staffing.
                <div class="chat-suggestions">
                    ${suggestions.map(s => `<button type="button" class="chat-suggest-btn">${escapeHtml(s)}</button>`).join('')}
                </div>
            </div>`;
        body.querySelectorAll('.chat-suggest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                input.value = btn.textContent;
                this.send();
            });
        });
    },

    renderHistory() {
        const body = document.getElementById('chatBody');
        if (!body) return;
        body.innerHTML = this.history.map(m => `
            <div class="chat-msg chat-msg-${m.role === 'user' ? 'user' : 'bot'}">${escapeHtml(m.content)}</div>
        `).join('');
        body.scrollTop = body.scrollHeight;
    },

    showTyping() {
        const body = document.getElementById('chatBody');
        if (!body) return;
        const el = document.createElement('div');
        el.className = 'chat-typing';
        el.id = 'chatTyping';
        el.innerHTML = '<span></span><span></span><span></span>';
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
    },

    hideTyping() {
        document.getElementById('chatTyping')?.remove();
    },

    showError(message, isMissingKey = false) {
        const body = document.getElementById('chatBody');
        if (!body) return;
        const el = document.createElement('div');
        el.className = 'chat-msg chat-msg-error';
        if (isMissingKey) {
            el.innerHTML = `<strong>Add an API key to get chat features.</strong><br>
                ${escapeHtml(message)} Go to <a href="#" class="chat-goto-settings">Settings → AI / API Keys</a> to add one.`;
        } else {
            el.textContent = message;
        }
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
        el.querySelector('.chat-goto-settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
            document.querySelector('.nav-btn[data-view="management"]')?.click();
        });
    },

    async send() {
        if (this.busy) return;
        const input = document.getElementById('chatInput');
        const text = (input.value || '').trim();
        if (!text) return;

        if (this.keyChecked && !this.keyConfigured) {
            this.showError('No Anthropic API key configured.', true);
            return;
        }

        input.value = '';
        input.style.height = 'auto';
        this.history.push({ role: 'user', content: text });
        this.renderHistory();
        this.showTyping();
        this.busy = true;
        document.getElementById('chatSendBtn').disabled = true;

        try {
            const r = await fetch(`${API_BASE}/insights/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.history }),
            });
            const j = await r.json().catch(() => ({}));
            this.hideTyping();

            if (r.status === 503) {
                // Key was revoked or never set — flag and show prominent prompt.
                this.keyConfigured = false;
                this.keyChecked = true;
                this.showError(j.error || 'No Anthropic API key configured.', true);
                return;
            }
            if (!r.ok || !j.success) {
                this.showError(j.error || `Request failed (HTTP ${r.status})`);
                return;
            }
            const reply = (j.data && j.data.reply) || '(no reply)';
            this.history.push({ role: 'assistant', content: reply });
            this.renderHistory();
        } catch (err) {
            this.hideTyping();
            this.showError(`Network error: ${err.message}`);
        } finally {
            this.busy = false;
            document.getElementById('chatSendBtn').disabled = false;
            document.getElementById('chatInput')?.focus();
        }
    },
};

document.addEventListener('DOMContentLoaded', () => Chat.init());

// ==================== UTILITIES ====================

function debounce(fn, wait = 200) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function updateChartTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const labelColor = isDark ? '#a0aec0' : '#4a5568';

    [window._teamRadarChartTech, window._teamRadarChartNonTech, window._customRadarChart].forEach(function (chart) {
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
