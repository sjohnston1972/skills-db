#!/usr/bin/env python3
"""
Import Skills Matrix data from Excel file to PostgreSQL database
"""

import openpyxl
import json
import sys

def parse_excel(filepath):
    """Parse the Excel file and extract all data"""
    print(f"Reading Excel file: {filepath}")
    wb = openpyxl.load_workbook(filepath, data_only=True)

    print(f"Sheets found: {wb.sheetnames}")

    data = {
        'main_skills': {},
        'resources': {}
    }

    # Process each sheet (each sheet represents a main skill category)
    for sheet_name in wb.sheetnames:
        if sheet_name in ['Summary', 'Instructions', 'Template']:
            continue

        sheet = wb[sheet_name]
        print(f"\nProcessing sheet: {sheet_name}")

        # Find header row (look for "Name" and "Email")
        header_row = None
        name_col = None
        email_col = None

        for row_idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=20), start=1):
            for col_idx, cell in enumerate(row, start=1):
                if cell.value and str(cell.value).strip().lower() == 'name':
                    header_row = row_idx
                    name_col = col_idx
                if cell.value and str(cell.value).strip().lower() == 'email':
                    email_col = col_idx
            if header_row:
                break

        if not header_row:
            print(f"  Skipping {sheet_name} - no header found")
            continue

        print(f"  Header row: {header_row}, Name col: {name_col}, Email col: {email_col}")

        # Extract sub-skill names from header
        header = list(sheet.iter_rows(min_row=header_row, max_row=header_row, values_only=True))[0]
        sub_skills = []
        sub_skill_cols = []

        for col_idx, value in enumerate(header, start=1):
            if col_idx > (email_col or name_col + 1):
                if value and str(value).strip():
                    sub_skill_name = str(value).strip()
                    # Skip column if it looks like metadata
                    if sub_skill_name.lower() not in ['notes', 'comments', 'date', 'updated']:
                        sub_skills.append(sub_skill_name)
                        sub_skill_cols.append(col_idx)

        print(f"  Sub-skills found: {len(sub_skills)}")
        if sub_skills:
            print(f"    {', '.join(sub_skills[:5])}{'...' if len(sub_skills) > 5 else ''}")

        # Store main skill info
        if sheet_name not in data['main_skills']:
            data['main_skills'][sheet_name] = {
                'name': sheet_name,
                'sub_skills': sub_skills
            }

        # Extract resource data
        for row in sheet.iter_rows(min_row=header_row + 1, values_only=True):
            name = row[name_col - 1] if name_col and len(row) >= name_col else None
            email = row[email_col - 1] if email_col and len(row) >= email_col else None

            if not name or str(name).strip() == '':
                continue

            name = str(name).strip()
            email = str(email).strip() if email else ''

            # Initialize resource if not exists
            if name not in data['resources']:
                data['resources'][name] = {
                    'name': name,
                    'email': email,
                    'skills': {}
                }

            # Extract skill levels for this resource
            if sheet_name not in data['resources'][name]['skills']:
                data['resources'][name]['skills'][sheet_name] = {}

            for i, col_idx in enumerate(sub_skill_cols):
                if len(row) >= col_idx:
                    level = row[col_idx - 1]
                    if level is not None and str(level).strip() != '':
                        try:
                            level_int = int(float(str(level)))
                            if 0 <= level_int <= 5:
                                data['resources'][name]['skills'][sheet_name][sub_skills[i]] = level_int
                        except (ValueError, TypeError):
                            pass

    return data

def generate_sql(data):
    """Generate SQL statements to insert data"""
    sql_statements = []

    # Clear existing data
    sql_statements.append("-- Clear existing data")
    sql_statements.append("TRUNCATE TABLE resource_sub_skills, sub_skills, main_skills, resources CASCADE;")
    sql_statements.append("")

    # Insert main skills
    sql_statements.append("-- Insert Main Skills")
    skill_id_map = {}
    for idx, (skill_name, skill_info) in enumerate(data['main_skills'].items(), start=1):
        skill_id = f"skill-{idx:03d}"
        skill_id_map[skill_name] = skill_id
        # Determine category based on skill name
        category = 'Technical'
        if 'azure' in skill_name.lower():
            category = 'Cloud'
        elif 'aws' in skill_name.lower():
            category = 'Cloud'
        elif 'security' in skill_name.lower():
            category = 'Security'
        elif 'network' in skill_name.lower():
            category = 'Networking'
        elif 'collaboration' in skill_name.lower() or 'cisco call' in skill_name.lower():
            category = 'Communication'

        skill_name_escaped = skill_name.replace("'", "''")
        sql_statements.append(f"INSERT INTO main_skills (id, name, category, weight, skill_type) VALUES ('{skill_id}', '{skill_name_escaped}', '{category}', 5, 'technical');")

    sql_statements.append("")

    # Insert sub-skills
    sql_statements.append("-- Insert Sub-Skills")
    sub_skill_id_map = {}
    for skill_name, skill_info in data['main_skills'].items():
        skill_id = skill_id_map[skill_name]
        for sub_skill in skill_info['sub_skills']:
            sub_skill_clean = sub_skill.replace("'", "''")
            sql_statements.append(f"INSERT INTO sub_skills (main_skill_id, name) VALUES ('{skill_id}', '{sub_skill_clean}');")
            sub_skill_id_map[f"{skill_name}::{sub_skill}"] = True

    sql_statements.append("")

    # Insert resources
    sql_statements.append("-- Insert Resources")
    resource_id_map = {}
    for idx, (name, resource_info) in enumerate(data['resources'].items(), start=1):
        resource_id = f"eng-{idx:03d}"
        resource_id_map[name] = resource_id
        email = resource_info['email'].replace("'", "''") if resource_info['email'] else f"user{idx}@company.com"
        name_escaped = name.replace("'", "''")
        sql_statements.append(f"INSERT INTO resources (id, name, email) VALUES ('{resource_id}', '{name_escaped}', '{email}');")

    sql_statements.append("")

    # Insert resource skill levels
    sql_statements.append("-- Insert Resource Skill Levels")
    for name, resource_info in data['resources'].items():
        resource_id = resource_id_map[name]
        for main_skill, sub_skills in resource_info['skills'].items():
            if main_skill in skill_id_map:
                skill_id = skill_id_map[main_skill]
                for sub_skill_name, level in sub_skills.items():
                    sub_skill_clean = sub_skill_name.replace("'", "''")
                    sql_statements.append(
                        f"INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level) "
                        f"SELECT '{resource_id}', id, {level} FROM sub_skills "
                        f"WHERE main_skill_id = '{skill_id}' AND name = '{sub_skill_clean}';"
                    )

    sql_statements.append("")
    sql_statements.append("-- Update metadata")
    sql_statements.append("UPDATE metadata SET value = CURRENT_TIMESTAMP::TEXT WHERE key = 'last_updated';")

    return '\n'.join(sql_statements)

def main():
    excel_file = '/host-projects/web-projects/skills-db/Project Services Engineers Skills Matrix.xlsx'

    try:
        # Parse Excel
        data = parse_excel(excel_file)

        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Main Skills: {len(data['main_skills'])}")
        for skill_name, skill_info in data['main_skills'].items():
            print(f"  - {skill_name}: {len(skill_info['sub_skills'])} sub-skills")

        print(f"\nResources: {len(data['resources'])}")
        for name in list(data['resources'].keys())[:5]:
            skill_count = sum(len(skills) for skills in data['resources'][name]['skills'].values())
            print(f"  - {name}: {skill_count} skill assignments")
        if len(data['resources']) > 5:
            print(f"  ... and {len(data['resources']) - 5} more")

        # Generate SQL
        sql = generate_sql(data)

        # Write to file
        output_file = '/host-projects/web-projects/skills-db/imported-data.sql'
        with open(output_file, 'w') as f:
            f.write(sql)

        print(f"\n✅ SQL file generated: {output_file}")
        print(f"   Total SQL statements: {len(sql.splitlines())}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
