# Network Engineer Skills Matrix Website Deployment

## Purpose
Deploy a comprehensive skills matrix website for tracking network engineering team capabilities, identifying skills gaps, and managing engineer profiles.

## Environment Understanding

### Step 1: Examine Existing Infrastructure
Before making any changes, you must understand the current setup:

1. **Read and understand `docker-compose.yml`**
   - Identify how other websites are configured
   - Note the volume mappings for web-projects
   - Understand the nginx service configuration
   - Identify any port mappings or network configurations

2. **Read and understand `nginx.conf`**
   - Examine existing server blocks for other websites (finance, helloworld, vigil, etc.)
   - Note the pattern used for:
     - Server name configuration
     - Root directory paths
     - Location blocks
     - Any proxy settings or headers

3. **Examine the web-projects folder structure**
   - List all existing website folders
   - Understand the folder organization pattern
   - Verify the path structure matches nginx configuration

### Step 2: Infrastructure Setup

1. **Update `nginx.conf`**
   - Add a new server block for the skills website following the exact same pattern as existing sites
   - Use the domain/subdomain pattern consistent with other projects
   - Set root directory to `/usr/share/nginx/html/skills` (or matching pattern)
   - Example pattern to follow:
   ```nginx
   server {
       listen 80;
       server_name skills.yourdomain.com;  # Adjust to match existing pattern
       root /usr/share/nginx/html/skills;
       index index.html;
       
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

2. **Update `docker-compose.yml`** (if required)
   - Only modify if other websites have specific docker-compose entries
   - Follow the exact same format as existing websites
   - Ensure volume mappings include the skills folder

3. **Create the skills folder**
   - Create `/web-projects/skills/` directory
   - Ensure it's at the same level as finance, helloworld, vigil, etc.

### Step 3: Restart Services
After configuration changes:
```bash
docker-compose restart nginx
# OR if that doesn't work:
docker-compose down && docker-compose up -d
```

---

## Website Specifications

### Data Source
- The agent will be provided with "Project Services Engineers Skills Matrix.xlsx"
- Extract all engineers and their skills data from this spreadsheet
- Use this data to populate the initial localStorage structure

### Skills Rating System
Use this 5-level proficiency scale:

- **Level 1: Beginner/Novice** - Needs significant supervision; understands basic concepts but struggles with application
- **Level 2: Advanced Beginner/Developing** - Can perform tasks with some guidance; understands fundamental principles
- **Level 3: Competent/Proficient** - Works independently on routine tasks; strong grasp of the skill; can troubleshoot
- **Level 4: Proficient/Expert** - Handles complex tasks confidently; can guide or teach others; sees the bigger picture
- **Level 5: Expert/Master** - Full mastery; innovator; can solve novel problems and mentor extensively

### Data Storage
- Use **localStorage** for all data persistence
- Structure data as JSON
- Include both engineers and skills in the data model

---

## Website Features & Requirements

### 1. Home Page - Overview Dashboard

**Primary Feature: Radar Chart**
- Display a large, prominent radar chart showing overall team skill coverage
- Each axis represents a different skill
- Plot the average proficiency level across all engineers for each skill
- Use color coding to make it visually striking

**Additional Metrics to Display:**
- Total number of engineers
- Total number of skills tracked
- Skills gap indicators (skills with low average scores)
- Top 5 strongest skills (highest average)
- Top 5 weakest skills (lowest average)
- Skills distribution bar chart or similar visualization

**Visual Design:**
- Professional, clean interface
- Dashboard-style layout
- Responsive design (works on desktop and tablet)
- Color-coded visual indicators (red for gaps, green for strengths)

### 2. Skills Heatmap View

**Full Team Heatmap:**
- Grid display: Engineers (rows) × Skills (columns)
- Color-coded cells based on proficiency level:
  - Level 1: Light red/pink
  - Level 2: Orange
  - Level 3: Yellow
  - Level 4: Light green
  - Level 5: Dark green
  - No skill/0: White or light gray
- Sortable by engineer name or skill
- Filterable by skill category (if skills are categorized)

**Interactive Features:**
- Click on any cell to see detailed information
- Hover tooltips showing exact level and description
- Export capability (to CSV or print-friendly format)

### 3. Engineer Search & Individual Profiles

**Search Functionality:**
- Search bar with auto-complete
- Filter by name
- Display search results as cards or list items

**Individual Engineer View:**
- When an engineer is selected, display:
  - Engineer name and details
  - Personal radar chart showing their skill profile
  - List view of all their skills with levels
  - Skills they lack (comparison against all available skills)
  - Strengths and areas for development

### 4. Data Management Interface

**Add Engineer:**
- Form with engineer name and contact details
- Ability to assign multiple skills with levels during creation
- Add to localStorage
- Refresh dashboard automatically

**Modify Engineer:**
- Select engineer from list
- Edit name, details, or skill levels
- Update skills (add new skills, modify existing levels, remove skills)
- Save changes to localStorage

**Delete Engineer:**
- Select engineer to delete
- Confirmation dialog ("Are you sure?")
- Remove from localStorage
- Update dashboard

**Add Skill:**
- Form to add new skill name
- Optional: skill category/domain
- Add to master skills list in localStorage

**Modify Skill:**
- Select skill to edit
- Rename or recategorize
- Update affects all engineers with that skill

**Delete Skill:**
- Select skill to delete
- Confirmation dialog
- Remove from all engineers
- Update localStorage

### 5. Data Import/Export (Optional Enhancement)

- Export current data to JSON file
- Import data from JSON file (to backup/restore)

---

## Technical Implementation Requirements

### File Structure
Create these three files in `/web-projects/skills/`:

1. **index.html**
   - Semantic HTML5
   - Separate sections for: Dashboard, Heatmap, Search, Data Management
   - Use navigation to switch between views
   - Link to styles.css and script.js

2. **styles.css**
   - Modern, professional styling
   - Responsive grid layouts
   - Color scheme for skill levels (as specified above)
   - Hover effects and transitions
   - Print-friendly styles (optional)

3. **script.js**
   - All JavaScript functionality
   - localStorage management functions
   - Data parsing from spreadsheet (convert to JSON structure)
   - Rendering functions for:
     - Radar chart (use Chart.js or similar library)
     - Heatmap grid
     - Search/filter logic
     - CRUD operations for engineers and skills
   - Event listeners for all interactive elements

### JavaScript Libraries to Include (via CDN)
- **Chart.js** - For radar charts and other visualizations
- **Optional: D3.js** - If more complex visualizations are needed
- **Optional: DataTables** or similar - For sortable/filterable tables

### LocalStorage Data Structure
Suggested JSON structure:
```javascript
{
  "engineers": [
    {
      "id": "unique-id-1",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "skills": {
        "Cisco Routing": 4,
        "Python Automation": 3,
        "Firewall Configuration": 5,
        // ... more skills
      }
    },
    // ... more engineers
  ],
  "skills": [
    {
      "id": "skill-1",
      "name": "Cisco Routing",
      "category": "Routing & Switching"
    },
    {
      "id": "skill-2",
      "name": "Python Automation",
      "category": "Automation"
    },
    // ... more skills
  ],
  "metadata": {
    "lastUpdated": "2025-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Initial Data Population
- Read "Project Services Engineers Skills Matrix.xlsx"
- Parse the spreadsheet data
- Convert to the JSON structure above
- Save to localStorage on first load
- Include a "Reset to Default" function that reloads spreadsheet data

---

## User Experience Guidelines

### Navigation
- Clear, intuitive menu/navigation bar
- Active state indication for current view
- Easy switching between Dashboard, Heatmap, Search, and Management views

### Responsive Design
- Must work on desktop (primary)
- Should work on tablets
- Mobile support is nice-to-have but not critical

### Performance
- Fast loading (all data local)
- Smooth transitions and animations
- Efficient rendering for large datasets (100+ engineers/skills)

### Accessibility
- Proper heading hierarchy
- ARIA labels where appropriate
- Keyboard navigation support
- Sufficient color contrast (especially in heatmap)

---

## Testing Checklist

Before considering the deployment complete, verify:

- [ ] Nginx configuration is correct and container restarts successfully
- [ ] Website loads at the configured URL
- [ ] Radar chart displays correctly with sample data
- [ ] Heatmap renders with proper color coding
- [ ] Search function finds engineers correctly
- [ ] Individual engineer profiles display personal radar charts
- [ ] Can add a new engineer and their skills
- [ ] Can modify an existing engineer's skill levels
- [ ] Can delete an engineer (with confirmation)
- [ ] Can add a new skill to the master list
- [ ] Can modify a skill name
- [ ] Can delete a skill (with confirmation)
- [ ] All changes persist in localStorage
- [ ] Dashboard metrics update dynamically after changes
- [ ] No console errors in browser developer tools
- [ ] Visual design is professional and consistent

---

## Error Handling

Implement proper error handling for:
- localStorage quota exceeded
- Invalid data formats
- Missing required fields in forms
- Duplicate engineer/skill names
- Browser compatibility issues

---

## Future Enhancement Ideas
(Not required for initial deployment, but document for future reference)

- Multi-user authentication and permissions
- Skills endorsement system (peer validation)
- Training recommendations based on gaps
- Historical tracking (skill progression over time)
- Integration with HR systems
- PDF report generation
- Skills certification tracking
- Team composition analysis ("Do we have enough Level 4+ in X?")

---

## Deployment Verification

After deployment, document:
1. The URL where the site is accessible
2. Any configuration changes made to nginx.conf
3. Any configuration changes made to docker-compose.yml
4. Confirmation that nginx container restarted successfully
5. Screenshot of the working dashboard (optional)

---

## Support Notes

If issues arise:
- Check nginx error logs: `docker logs <nginx-container-name>`
- Verify file permissions in web-projects/skills/
- Ensure nginx.conf syntax is valid: `docker exec <nginx-container> nginx -t`
- Check that the skills folder is properly mounted in the container
- Verify localStorage is enabled in the browser (not in incognito/private mode)


## CRITICAL ##

DO NOT:
- edit items in folders other than "skills"
- modify existing website configs in docker-compose.yml and nginx.conf  