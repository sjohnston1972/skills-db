// API Service Layer for Skills Matrix
// Handles all communication with the backend API

const API_BASE = '/api';

const ACTIVE_DEPT_KEY = 'activeDepartment';
const DEFAULT_DEPT_SLUG = 'projects-team';
function getActiveDepartment() {
    return localStorage.getItem(ACTIVE_DEPT_KEY) || DEFAULT_DEPT_SLUG;
}
function setActiveDepartment(slug) {
    localStorage.setItem(ACTIVE_DEPT_KEY, slug);
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/data', '/resources')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body (for POST/PUT)
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Department': getActiveDepartment()
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        // Some endpoints (e.g. /api/export/csv) return non-JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response;
        }
        const result = await response.json();
        if (!response.ok || (result && result.success === false)) {
            const msg = (result && (result.error || result.message)) || `HTTP ${response.status}`;
            throw new Error(msg);
        }
        return result.data !== undefined ? result.data : result;
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        if (typeof window.showToast === 'function') {
            window.showToast(`${method} ${endpoint} failed: ${error.message}`, 'error');
        }
        throw error;
    }
}

/**
 * Data API - Full data operations
 */
const DataAPI = {
    /**
     * Get all data (resources with skills)
     */
    async getAll() {
        return await apiRequest('/data', 'GET');
    },

    /**
     * Save/import complete data
     */
    async save(data) {
        return await apiRequest('/data', 'POST', data);
    },

    /**
     * Import data from JSON
     */
    async import(data) {
        return await apiRequest('/data/import', 'POST', data);
    },

    /**
     * Export data as JSON
     */
    async export() {
        return await apiRequest('/data/export', 'POST');
    },

    /**
     * Reset to default sample data.
     * The API refuses to run this destructive operation without the
     * explicit confirmation token.
     */
    async reset() {
        return await apiRequest('/data/reset', 'POST', { confirm: 'RESET' });
    }
};

/**
 * Resources API - CRUD operations for engineers/resources
 */
const ResourcesAPI = {
    /**
     * Get all resources (basic info only)
     */
    async getAll() {
        return await apiRequest('/resources', 'GET');
    },

    /**
     * Get single resource with full skills data
     */
    async getById(id) {
        return await apiRequest(`/resources/${id}`, 'GET');
    },

    /**
     * Create new resource
     */
    async create(resource) {
        return await apiRequest('/resources', 'POST', resource);
    },

    /**
     * Update resource and/or skill levels
     */
    async update(id, updates) {
        return await apiRequest(`/resources/${id}`, 'PUT', updates);
    },

    /**
     * Delete resource
     */
    async delete(id) {
        return await apiRequest(`/resources/${id}`, 'DELETE');
    }
};

/**
 * Skills API - CRUD operations for main skills and sub-skills
 */
const SkillsAPI = {
    /**
     * Get all main skills with sub-skills
     */
    async getAll() {
        return await apiRequest('/skills', 'GET');
    },

    /**
     * Get single main skill with sub-skills
     */
    async getById(id) {
        return await apiRequest(`/skills/${id}`, 'GET');
    },

    /**
     * Create new main skill category
     */
    async create(skill) {
        return await apiRequest('/skills', 'POST', skill);
    },

    /**
     * Update main skill
     */
    async update(id, updates) {
        return await apiRequest(`/skills/${id}`, 'PUT', updates);
    },

    /**
     * Delete main skill (cascades to sub-skills)
     */
    async delete(id) {
        return await apiRequest(`/skills/${id}`, 'DELETE');
    },

    /**
     * Add sub-skill to main skill
     */
    async addSubSkill(mainSkillId, subSkillName) {
        return await apiRequest(`/skills/${mainSkillId}/sub-skills`, 'POST', {
            name: subSkillName
        });
    },

    /**
     * Update sub-skill name
     */
    async updateSubSkill(mainSkillId, subSkillId, newName) {
        return await apiRequest(`/skills/${mainSkillId}/sub-skills/${subSkillId}`, 'PUT', {
            name: newName
        });
    },

    /**
     * Delete sub-skill (cascades to resource assignments)
     */
    async deleteSubSkill(mainSkillId, subSkillId) {
        return await apiRequest(`/skills/${mainSkillId}/sub-skills/${subSkillId}`, 'DELETE');
    }
};

/**
 * Health check
 */
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

/**
 * Staffing API
 */
const StaffingAPI = {
    async search(requirements, mode = 'match') {
        return await apiRequest('/staffing/search', 'POST', { requirements, mode });
    }
};

/**
 * Data Quality API
 */
const DataQualityAPI = {
    async get(staleDays = 365) {
        return await apiRequest(`/data-quality?staleDays=${staleDays}`, 'GET');
    }
};

/**
 * Departments API
 */
const DepartmentsAPI = {
    async getAll() { return await apiRequest('/departments', 'GET'); },
    async rename(id, name) { return await apiRequest(`/departments/${id}`, 'PATCH', { name }); }
};

// Export APIs
window.DataAPI = DataAPI;
window.ResourcesAPI = ResourcesAPI;
window.SkillsAPI = SkillsAPI;
window.StaffingAPI = StaffingAPI;
window.DataQualityAPI = DataQualityAPI;
window.DepartmentsAPI = DepartmentsAPI;
window.getActiveDepartment = getActiveDepartment;
window.setActiveDepartment = setActiveDepartment;
window.checkHealth = checkHealth;
window.apiRequest = apiRequest;
