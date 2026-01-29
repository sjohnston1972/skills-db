// Sample Data Loader for Skills Matrix
// Loads sample data into PostgreSQL database via API

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

// Sample data structure (extracted from frontend)
const sampleData = {
    skills: [
        {
            id: 'skill-cisco-sdwan',
            name: 'Cisco Enterprise and SD-WAN',
            category: 'Networking',
            weight: 8,
            skillType: 'technical',
            subSkills: [
                'Cisco Switching',
                'Meraki Switching',
                'Cisco Wireless',
                'Meraki Wireless',
                'Cisco Routing EIGRP/OSPF',
                'BGP',
                'MPLS',
                'QOS Implementation'
            ]
        },
        {
            id: 'skill-security',
            name: 'Security Products',
            category: 'Security',
            weight: 9,
            skillType: 'technical',
            subSkills: [
                'ASA Firewalls',
                'Firepower Firewall/IPS',
                'Palo Alto Strata(Firewalls)',
                'Palo Alto (Panorama)',
                'Cisco ISE',
                'VPNs',
                'Certificates',
                'DUO MFA'
            ]
        },
        {
            id: 'skill-network-ops',
            name: 'Network Lifecycle and operation',
            category: 'Operations',
            weight: 7,
            skillType: 'technical',
            subSkills: [
                'Network Programabilty Python',
                'Network Programability Ansible',
                'Wireshark Tracing',
                'Smart Licensing setup and administration',
                'Solarwinds Operations'
            ]
        },
        {
            id: 'skill-azure',
            name: 'Azure',
            category: 'Cloud',
            weight: 9,
            skillType: 'technical',
            subSkills: [
                'vnets',
                'vnet peering',
                'expressroute',
                'virtual wan',
                'load balancers',
                's2s vpn',
                'user defined routes',
                'terraform',
                'arm templates',
                'palo alto firewalls',
                'cisco secure firewall'
            ]
        },
        {
            id: 'skill-aws',
            name: 'AWS',
            category: 'Cloud',
            weight: 9,
            skillType: 'technical',
            subSkills: [
                "vpc's",
                'vpc peering',
                'vpn gateways',
                'custom route tables',
                'load balancers',
                'palo alto firewalls'
            ]
        },
        {
            id: 'skill-collaboration',
            name: 'Collaboration',
            category: 'Communication',
            weight: 6,
            skillType: 'technical',
            subSkills: [
                'Cisco Call Manager',
                'Cisco Unity Connection',
                'Cisco IM&P',
                'Cisco Meeting Server',
                'Teams Direct Routing'
            ]
        }
    ],
    resources: [
        {
            id: 'eng-001',
            name: 'Jessica Martinez',
            email: 'jessica.martinez@company.com',
            skillLevels: {
                'Cisco Enterprise and SD-WAN': {
                    'Cisco Switching': 5,
                    'Meraki Switching': 5,
                    'Cisco Wireless': 5,
                    'Meraki Wireless': 4,
                    'Cisco Routing EIGRP/OSPF': 5,
                    'BGP': 5,
                    'MPLS': 4,
                    'QOS Implementation': 5
                },
                'Security Products': {
                    'ASA Firewalls': 5,
                    'Firepower Firewall/IPS': 4,
                    'Palo Alto Strata(Firewalls)': 4,
                    'Palo Alto (Panorama)': 4,
                    'Cisco ISE': 5,
                    'VPNs': 5,
                    'Certificates': 4,
                    'DUO MFA': 4
                },
                'Network Lifecycle and operation': {
                    'Network Programabilty Python': 4,
                    'Network Programability Ansible': 3,
                    'Wireshark Tracing': 5,
                    'Smart Licensing setup and administration': 4,
                    'Solarwinds Operations': 4
                }
            }
        },
        {
            id: 'eng-002',
            name: 'David Chen',
            email: 'david.chen@company.com',
            skillLevels: {
                'Azure': {
                    'vnets': 5,
                    'vnet peering': 5,
                    'expressroute': 4,
                    'virtual wan': 4,
                    'load balancers': 4,
                    's2s vpn': 5,
                    'user defined routes': 5,
                    'terraform': 5,
                    'arm templates': 4,
                    'palo alto firewalls': 4,
                    'cisco secure firewall': 3
                },
                'AWS': {
                    "vpc's": 5,
                    'vpc peering': 4,
                    'vpn gateways': 4,
                    'custom route tables': 4,
                    'load balancers': 4,
                    'palo alto firewalls': 4
                },
                'Security Products': {
                    'Palo Alto Strata(Firewalls)': 4,
                    'Palo Alto (Panorama)': 3,
                    'VPNs': 4,
                    'Certificates': 3
                }
            }
        },
        {
            id: 'eng-003',
            name: 'Sarah Thompson',
            email: 'sarah.thompson@company.com',
            skillLevels: {
                'Collaboration': {
                    'Cisco Call Manager': 5,
                    'Cisco Unity Connection': 5,
                    'Cisco IM&P': 4,
                    'Cisco Meeting Server': 4,
                    'Teams Direct Routing': 3
                },
                'Cisco Enterprise and SD-WAN': {
                    'Cisco Switching': 3,
                    'Cisco Wireless': 3,
                    'Cisco Routing EIGRP/OSPF': 3
                }
            }
        }
    ]
};

async function loadData() {
    console.log('Loading sample data into database...\n');

    try {
        // Step 1: Create main skills and sub-skills
        console.log('Step 1: Creating main skills and sub-skills...');
        const skillIdMap = {};

        for (const skill of sampleData.skills) {
            console.log(`  Creating skill: ${skill.name}`);
            const response = await fetch(`${API_BASE}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: skill.id,
                    name: skill.name,
                    category: skill.category,
                    weight: skill.weight,
                    skillType: skill.skillType
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`    Failed: ${error}`);
                continue;
            }

            const result = await response.json();
            skillIdMap[skill.name] = skill.id;
            console.log(`    ✓ Created`);

            // Create sub-skills
            for (const subSkillName of skill.subSkills) {
                console.log(`    Creating sub-skill: ${subSkillName}`);
                const subResponse = await fetch(`${API_BASE}/skills/${skill.id}/sub-skills`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: subSkillName
                    })
                });

                if (!subResponse.ok) {
                    const error = await subResponse.text();
                    console.error(`      Failed: ${error}`);
                    continue;
                }
                console.log(`      ✓ Created`);
            }
        }

        console.log('\nStep 2: Creating resources and assigning skill levels...');

        for (const resource of sampleData.resources) {
            console.log(`  Creating resource: ${resource.name}`);

            // Create resource
            const response = await fetch(`${API_BASE}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: resource.id,
                    name: resource.name,
                    email: resource.email
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`    Failed: ${error}`);
                continue;
            }
            console.log(`    ✓ Created`);

            // Update resource with skill levels
            console.log(`    Assigning skill levels...`);
            const updateResponse = await fetch(`${API_BASE}/resources/${resource.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subSkills: resource.skillLevels
                })
            });

            if (!updateResponse.ok) {
                const error = await updateResponse.text();
                console.error(`    Failed to assign skills: ${error}`);
                continue;
            }
            console.log(`    ✓ Skill levels assigned`);
        }

        console.log('\n✅ Sample data loaded successfully!');
        console.log(`   - ${sampleData.skills.length} main skills created`);
        console.log(`   - ${sampleData.skills.reduce((sum, s) => sum + s.subSkills.length, 0)} sub-skills created`);
        console.log(`   - ${sampleData.resources.length} resources created`);

    } catch (error) {
        console.error('\n❌ Error loading sample data:', error.message);
        process.exit(1);
    }
}

// Run the loader
loadData();
