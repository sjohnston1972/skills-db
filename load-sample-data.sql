-- Load Sample Data for Skills Matrix

-- Insert Main Skills
INSERT INTO main_skills (id, name, category, weight, skill_type) VALUES
('skill-cisco-sdwan', 'Cisco Enterprise and SD-WAN', 'Networking', 8, 'technical'),
('skill-security', 'Security Products', 'Security', 9, 'technical'),
('skill-network-ops', 'Network Lifecycle and operation', 'Operations', 7, 'technical'),
('skill-azure', 'Azure', 'Cloud', 9, 'technical'),
('skill-aws', 'AWS', 'Cloud', 9, 'technical'),
('skill-collaboration', 'Collaboration', 'Communication', 6, 'technical')
ON CONFLICT (id) DO NOTHING;

-- Insert Sub-Skills for Cisco Enterprise and SD-WAN
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-cisco-sdwan', 'Cisco Switching'),
('skill-cisco-sdwan', 'Meraki Switching'),
('skill-cisco-sdwan', 'Cisco Wireless'),
('skill-cisco-sdwan', 'Meraki Wireless'),
('skill-cisco-sdwan', 'Cisco Routing EIGRP/OSPF'),
('skill-cisco-sdwan', 'BGP'),
('skill-cisco-sdwan', 'MPLS'),
('skill-cisco-sdwan', 'QOS Implementation')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Sub-Skills for Security Products
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-security', 'ASA Firewalls'),
('skill-security', 'Firepower Firewall/IPS'),
('skill-security', 'Palo Alto Strata(Firewalls)'),
('skill-security', 'Palo Alto (Panorama)'),
('skill-security', 'Cisco ISE'),
('skill-security', 'VPNs'),
('skill-security', 'Certificates'),
('skill-security', 'DUO MFA')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Sub-Skills for Network Lifecycle and operation
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-network-ops', 'Network Programabilty Python'),
('skill-network-ops', 'Network Programability Ansible'),
('skill-network-ops', 'Wireshark Tracing'),
('skill-network-ops', 'Smart Licensing setup and administration'),
('skill-network-ops', 'Solarwinds Operations')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Sub-Skills for Azure
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-azure', 'vnets'),
('skill-azure', 'vnet peering'),
('skill-azure', 'expressroute'),
('skill-azure', 'virtual wan'),
('skill-azure', 'load balancers'),
('skill-azure', 's2s vpn'),
('skill-azure', 'user defined routes'),
('skill-azure', 'terraform'),
('skill-azure', 'arm templates'),
('skill-azure', 'palo alto firewalls'),
('skill-azure', 'cisco secure firewall')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Sub-Skills for AWS
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-aws', 'vpc''s'),
('skill-aws', 'vpc peering'),
('skill-aws', 'vpn gateways'),
('skill-aws', 'custom route tables'),
('skill-aws', 'load balancers'),
('skill-aws', 'palo alto firewalls')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Sub-Skills for Collaboration
INSERT INTO sub_skills (main_skill_id, name) VALUES
('skill-collaboration', 'Cisco Call Manager'),
('skill-collaboration', 'Cisco Unity Connection'),
('skill-collaboration', 'Cisco IM&P'),
('skill-collaboration', 'Cisco Meeting Server'),
('skill-collaboration', 'Teams Direct Routing')
ON CONFLICT (main_skill_id, name) DO NOTHING;

-- Insert Resources
INSERT INTO resources (id, name, email) VALUES
('eng-001', 'Jessica Martinez', 'jessica.martinez@company.com'),
('eng-002', 'David Chen', 'david.chen@company.com'),
('eng-003', 'Sarah Thompson', 'sarah.thompson@company.com')
ON CONFLICT (id) DO NOTHING;

-- Insert Resource Skill Levels for Jessica Martinez
INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level)
SELECT 'eng-001', id, level FROM (VALUES
    ('Cisco Switching', 5),
    ('Meraki Switching', 5),
    ('Cisco Wireless', 5),
    ('Meraki Wireless', 4),
    ('Cisco Routing EIGRP/OSPF', 5),
    ('BGP', 5),
    ('MPLS', 4),
    ('QOS Implementation', 5),
    ('ASA Firewalls', 5),
    ('Firepower Firewall/IPS', 4),
    ('Palo Alto Strata(Firewalls)', 4),
    ('Palo Alto (Panorama)', 4),
    ('Cisco ISE', 5),
    ('VPNs', 5),
    ('Certificates', 4),
    ('DUO MFA', 4),
    ('Network Programabilty Python', 4),
    ('Network Programability Ansible', 3),
    ('Wireshark Tracing', 5),
    ('Smart Licensing setup and administration', 4),
    ('Solarwinds Operations', 4)
) AS v(skill_name, level)
JOIN sub_skills ON sub_skills.name = v.skill_name
ON CONFLICT (resource_id, sub_skill_id) DO NOTHING;

-- Insert Resource Skill Levels for David Chen
INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level)
SELECT 'eng-002', id, level FROM (VALUES
    ('vnets', 5),
    ('vnet peering', 5),
    ('expressroute', 4),
    ('virtual wan', 4),
    ('load balancers', 4),
    ('s2s vpn', 5),
    ('user defined routes', 5),
    ('terraform', 5),
    ('arm templates', 4),
    ('palo alto firewalls', 4),
    ('cisco secure firewall', 3),
    ('vpc''s', 5),
    ('vpc peering', 4),
    ('vpn gateways', 4),
    ('custom route tables', 4),
    ('Palo Alto Strata(Firewalls)', 4),
    ('Palo Alto (Panorama)', 3),
    ('VPNs', 4),
    ('Certificates', 3)
) AS v(skill_name, level)
JOIN sub_skills ON sub_skills.name = v.skill_name
ON CONFLICT (resource_id, sub_skill_id) DO NOTHING;

-- Insert Resource Skill Levels for Sarah Thompson
INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level)
SELECT 'eng-003', id, level FROM (VALUES
    ('Cisco Call Manager', 5),
    ('Cisco Unity Connection', 5),
    ('Cisco IM&P', 4),
    ('Cisco Meeting Server', 4),
    ('Teams Direct Routing', 3),
    ('Cisco Switching', 3),
    ('Cisco Wireless', 3),
    ('Cisco Routing EIGRP/OSPF', 3)
) AS v(skill_name, level)
JOIN sub_skills ON sub_skills.name = v.skill_name
ON CONFLICT (resource_id, sub_skill_id) DO NOTHING;

-- Update metadata
UPDATE metadata SET value = CURRENT_TIMESTAMP::TEXT WHERE key = 'last_updated';
