# Implementation Status - 9 Feature Requests

## Date: 2026-01-29
## Status: BACKEND COMPLETE | FRONTEND IN PROGRESS

---

## ✅ COMPLETED - Backend Infrastructure

### Database Schema Updates (init-db.sql)
- ✅ Added `weight` column to `main_skills` table (INTEGER, 1-10, default 5)
- ✅ Added `skill_type` column to `main_skills` table (VARCHAR, 'technical'/'non-technical', default 'technical')
- ✅ Added `password_hash` column to `resources` table (VARCHAR NULL)

### Backend API Updates

#### Skills API (routes/skills.js)
- ✅ GET /api/skills - Returns weight and skillType for all skills
- ✅ GET /api/skills/:id - Returns weight and skillType for single skill
- ✅ POST /api/skills - Accepts weight (1-10) and skillType (technical/non-technical)
- ✅ PUT /api/skills/:id - Updates weight and skillType
- ✅ Validation: weight must be 1-10, skillType must be technical/non-technical

#### Resources API (routes/resources.js)
- ✅ Added bcrypt dependency for password hashing
- ✅ POST /api/resources - Accepts password, hashes with bcrypt (10 rounds)
- ✅ PUT /api/resources/:id - Accepts password for updates, re-hashes if provided
- ✅ Password stored as bcrypt hash, never plaintext

#### Dependencies (package.json)
- ✅ Added bcrypt@^5.1.1 for password hashing

---

## 🚧 IN PROGRESS - Frontend Implementation

### Task #1: Dashboard - Select-All Checkboxes & Collapsible Sections
**Status:** ⏳ PENDING
**Files:** frontend/index.html, frontend/styles.css, frontend/script.js

**Requirements:**
- Add "select-all" checkbox next to each main skill heading (AWS, Azure, etc.)
- Make each skill category section collapsible/expandable
- Click heading to expand/collapse
- Store expanded/collapsed state

**Implementation Steps:**
1. Update HTML to add checkbox and collapse icon to each skill category header
2. Add CSS for collapse animations and checkbox styling
3. Add JavaScript:
   - Click handler for select-all checkbox (checks/unchecks all sub-skills in category)
   - Click handler for category header (toggles expand/collapse)
   - Store state in local variable or data attribute

---

### Task #2: Dashboard - Most/Least Skilled Resource Summary on Radar Hover
**Status:** ⏳ PENDING
**Files:** frontend/script.js

**Requirements:**
- When hovering on radar chart data points, show popup with:
  - Keep existing popup content
  - Add "Most Skilled" section: Top 3 resources for that skill
  - Add "Least Skilled" section: Bottom 3 resources for that skill
- Only show for selected sub-skills

**Implementation Steps:**
1. Modify Chart.js tooltip configuration in radar chart initialization
2. Create custom tooltip callback function
3. Query all resources' levels for the hovered skill
4. Sort by level (desc for most skilled, asc for least skilled)
5. Format tooltip HTML with resource names and levels
6. Style tooltip appropriately

---

### Task #3: Data Management - Skill Weight Field
**Status:** ✅ BACKEND COMPLETE | ⏳ FRONTEND PENDING
**Files:** frontend/index.html, frontend/script.js

**Requirements:**
- Add "Skill Weight" input field (1-10) when adding/editing main skills
- Default value: 5
- Use weight in heatmap and skills gaps calculations
- Rename "Edit Name" button to "Edit"

**Backend:** ✅ Complete
**Frontend Steps:**
1. Update "Add Main Skill" form in HTML:
   - Add number input for weight (min=1, max=10, default=5)
   - Add label "Skill Weight (1=least demand, 10=most demand)"
2. Update skill edit modal/form:
   - Add weight field to edit form
   - Pre-populate with current weight value
   - Rename button from "Edit Name" to "Edit"
3. Update JavaScript:
   - Include weight in POST /api/skills
   - Include weight in PUT /api/skills/:id
   - Display weight in skills list
4. Update heatmap calculations to factor in weight
5. Update skills gaps analysis to prioritize by weight

---

### Task #4: Data Management - Skill Type Field & Dual Radar Overlays
**Status:** ✅ BACKEND COMPLETE | ⏳ FRONTEND PENDING
**Files:** frontend/index.html, frontend/script.js, frontend/styles.css

**Requirements:**
- Add "Skill Type" dropdown (technical/non-technical) when adding/editing main skills
- Update radar charts to show TWO overlays:
  - Overlay 1: Technical skills (rename from "team average skill level")
  - Overlay 2: Non-Technical skills (new)
- Keep strikethrough ability on both overlays

**Backend:** ✅ Complete
**Frontend Steps:**
1. Update "Add Main Skill" form:
   - Add dropdown select for skill_type
   - Options: "Technical" (default), "Non-Technical"
2. Update skill edit form:
   - Add skillType dropdown
   - Pre-populate with current value
3. Update JavaScript:
   - Include skillType in POST /api/skills
   - Include skillType in PUT /api/skills/:id
4. Update radar chart generation:
   - Separate skills into technical and non-technical arrays
   - Create two datasets instead of one
   - Dataset 1: Technical skills (blue/existing color)
   - Dataset 2: Non-Technical skills (different color, e.g., orange)
   - Both datasets support strikethrough toggle
5. Update legend/labels to show "Technical" and "Non-Technical"

---

### Task #5: Data Management - Resource Passwords & User Login
**Status:** ✅ BACKEND COMPLETE | ⏳ FRONTEND PENDING
**Files:** frontend/index.html, frontend/script.js, backend/server.js (auth endpoints)

**Requirements:**
- Add password field to "Add Resource" form
- Add "Change Password" function in resource editing
- Allow resources to log in with email + password (like admin)
- Keep existing admin login

**Backend:** ✅ Password hashing complete, auth endpoints needed
**Frontend Steps:**
1. Update "Add Resource" form:
   - Add password input field (type="password")
   - Label: "Password (optional)"
   - Help text: "Leave blank if resource should not have login access"
2. Update "Edit Resource" form:
   - Add "Change Password" button
   - Opens password change modal/form
   - Fields: New Password, Confirm Password
3. Create authentication endpoints in backend/server.js:
   ```javascript
   POST /api/auth/login
   - Body: { email, password, role }
   - role: 'admin' or 'resource'
   - Returns: { success, token/session, user: { id, name, email, role } }

   POST /api/auth/logout
   - Clears session

   GET /api/auth/me
   - Returns current authenticated user
   ```
4. Update login modal:
   - Add "Resource Login" tab (in addition to existing Admin tab)
   - Fields: Email, Password
   - Login button calls POST /api/auth/login with role='resource'
5. Implement session management:
   - Store auth token/session in sessionStorage or localStorage
   - Add Authorization header to all API requests
   - Redirect to appropriate page based on role
6. Implement role-based access control:
   - Admin: Full access
   - Resource: Can only view/edit own profile

---

### Task #6: Search Tab - Hover Delay & Fade-In Animation
**Status:** ⏳ PENDING
**Files:** frontend/script.js, frontend/styles.css

**Requirements:**
- 250ms delay before popup appears on hover
- 250ms fade-in animation
- Instant "pop away" on mouse leave

**Implementation Steps:**
1. Update CSS:
   ```css
   .user-popup {
     opacity: 0;
     transition: opacity 250ms ease-in;
     pointer-events: none;
   }

   .user-popup.show {
     opacity: 1;
     pointer-events: auto;
   }
   ```
2. Update JavaScript:
   ```javascript
   let hoverTimeout;

   userElement.addEventListener('mouseenter', () => {
     hoverTimeout = setTimeout(() => {
       popup.classList.add('show');
     }, 250);
   });

   userElement.addEventListener('mouseleave', () => {
     clearTimeout(hoverTimeout);
     popup.classList.remove('show'); // Instant removal
   });
   ```

---

### Task #7: Search Tab - Convert Profile to Modal
**Status:** ⏳ PENDING
**Files:** frontend/index.html, frontend/script.js, frontend/styles.css

**Requirements:**
- Display radar chart + skills + skills gaps in a modal popup
- Remove from bottom of page
- Add close button (X) and backdrop click to close

**Implementation Steps:**
1. Create modal HTML structure:
   ```html
   <div id="profileModal" class="modal">
     <div class="modal-backdrop" onclick="closeProfileModal()"></div>
     <div class="modal-content">
       <button class="modal-close" onclick="closeProfileModal()">&times;</button>
       <div id="modalProfileContent">
         <!-- Radar chart, skills list, gaps go here -->
       </div>
     </div>
   </div>
   ```
2. Add CSS for modal:
   - Full screen overlay
   - Centered content box
   - Fade-in animation
   - Responsive sizing
3. Update JavaScript:
   - Move profile rendering logic into modal
   - Show modal when user clicks on search result
   - Close modal on backdrop click, X button, or ESC key

---

### Task #8: Dashboard - Display Detailed Rating Scale
**Status:** ⏳ PENDING
**Files:** frontend/index.html, frontend/styles.css

**Requirements:**
Display comprehensive rating scale on dashboard:
```
Rating Scale:
0 – None/No Proficiency: No knowledge or experience with the skill.
1 – Limited/Elementary Proficiency: Basic awareness or limited, supervised use.
2 – Basic/Limited Working Proficiency: Can handle routine tasks with some guidance.
3 – Proficient/Professional Working Proficiency: Capable of working independently, handles non-routine problems, and requires minimal supervision.
4 – Advanced/Full Professional Proficiency: Highly developed skill, can apply knowledge broadly and coach others.
5 – Expert/Native or Bilingual Proficiency: Total mastery, able to innovate, and considered a subject matter expert.
```

**Implementation Steps:**
1. Add HTML section on dashboard:
   ```html
   <div class="rating-scale-section">
     <h3>Rating Scale</h3>
     <div class="rating-scale-item">
       <span class="rating-badge level-0">0</span>
       <strong>None/No Proficiency:</strong> No knowledge or experience with the skill.
     </div>
     <!-- Repeat for levels 1-5 -->
   </div>
   ```
2. Add CSS styling:
   - Color-coded badges (matching heatmap colors)
   - Clear typography
   - Compact but readable layout

---

### Task #9: Dashboard - Update Metric Card Click Actions
**Status:** ⏳ PENDING
**Files:** frontend/script.js, frontend/styles.css

**Requirements:**
- "Total Resources" → Navigate to Search tab
- "Skills Tracked" → Scroll to Custom Sub-Skills Radar Chart
- "Average Skill Level" → **REMOVE THIS METRIC ENTIRELY**

**Implementation Steps:**
1. Remove "Average Skill Level" metric:
   - Delete HTML for this metric card
   - Remove calculation logic from JavaScript
2. Update "Total Resources" click handler:
   ```javascript
   document.getElementById('totalResourcesCard').onclick = () => {
     switchTab('search'); // Or whatever the search tab ID is
   };
   ```
3. Update "Skills Tracked" click handler:
   ```javascript
   document.getElementById('skillsTrackedCard').onclick = () => {
     const radarChart = document.getElementById('customRadarChart');
     radarChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
   };
   ```
4. Add CSS to indicate cards are clickable:
   ```css
   .metric-card.clickable {
     cursor: pointer;
     transition: transform 0.2s;
   }
   .metric-card.clickable:hover {
     transform: translateY(-2px);
     box-shadow: 0 4px 8px rgba(0,0,0,0.2);
   }
   ```

---

## 📋 Implementation Priority

### Phase 1: Quick Wins (Low effort, high value)
1. Task #8: Display Rating Scale (HTML + CSS only)
2. Task #9: Update Metric Card Actions (JavaScript only)
3. Task #6: Hover Delay & Fade-In (CSS + simple JS)

### Phase 2: Medium Complexity
1. Task #1: Select-All & Collapsible Sections
2. Task #7: Modal for Profile Display
3. Task #3: Skill Weight UI (form fields + display)
4. Task #4: Skill Type UI (form fields only)

### Phase 3: Complex Features
1. Task #4: Dual Radar Overlays (Chart.js configuration)
2. Task #2: Most/Least Skilled Tooltip (data aggregation + tooltip)
3. Task #5: Resource Login System (auth endpoints + UI)

---

## 🔄 Next Steps

1. **Rebuild Docker Image:**
   ```bash
   cd /host-projects/web-projects/skills-db
   docker build --no-cache -t skills-matrix-db:latest .
   docker stop skills-matrix-db && docker rm skills-matrix-db
   docker run -d --name skills-matrix-db --network net_core -p 8098:80 --restart unless-stopped skills-matrix-db:latest
   ```

2. **Install bcrypt in container:** (automatic during build via package.json)

3. **Database Migration:** Since schema changed, need to run migration:
   ```sql
   ALTER TABLE main_skills ADD COLUMN weight INTEGER DEFAULT 5 CHECK (weight >= 1 AND weight <= 10);
   ALTER TABLE main_skills ADD COLUMN skill_type VARCHAR(20) DEFAULT 'technical' CHECK (skill_type IN ('technical', 'non-technical'));
   ALTER TABLE resources ADD COLUMN password_hash VARCHAR(255);
   ```

4. **Continue Frontend Implementation:** Follow tasks #1-#9 in priority order

---

## 📝 Notes

- All backend APIs are **READY** for frontend consumption
- Frontend changes are **DOCUMENTED** but not yet implemented
- Database schema changes require **MIGRATION** on existing container
- Comprehensive testing needed after frontend implementation

---

## 🧪 Testing Checklist (Post-Frontend Implementation)

### Backend (Ready for Testing)
- [ ] POST /api/skills with weight and skillType
- [ ] PUT /api/skills/:id with weight and skillType
- [ ] GET /api/skills returns weight and skillType
- [ ] POST /api/resources with password (verify bcrypt hash)
- [ ] PUT /api/resources/:id with password update
- [ ] Password authentication works

### Frontend (Awaiting Implementation)
- [ ] Select-all checkboxes work per category
- [ ] Collapsible sections expand/collapse
- [ ] Radar hover shows most/least skilled resources
- [ ] Weight field appears in skill forms (1-10)
- [ ] Type dropdown appears in skill forms (technical/non-technical)
- [ ] Dual radar overlays (technical + non-technical)
- [ ] Resource password field in add/edit forms
- [ ] Resource login works with email + password
- [ ] Change password function works
- [ ] Hover delay + fade-in on search results
- [ ] Profile displays in modal (not at bottom)
- [ ] Rating scale displays on dashboard
- [ ] Total Resources card → navigates to search
- [ ] Skills Tracked card → scrolls to radar chart
- [ ] Average Skill Level metric removed

---

**Last Updated:** 2026-01-29
**Backend Status:** ✅ Complete
**Frontend Status:** ⏳ In Progress
**Estimated Frontend Effort:** 8-12 hours
