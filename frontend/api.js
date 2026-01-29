// API Service Layer for Skills Matrix
// Handles all communication with the backend API

const API_BASE = '/api';

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
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API request failed');
        }

        return result.data;
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
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
     * Reset to default sample data
     */
    async reset() {
        return await apiRequest('/data/reset', 'POST');
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

// Export APIs
window.DataAPI = DataAPI;
window.ResourcesAPI = ResourcesAPI;
window.SkillsAPI = SkillsAPI;
window.checkHealth = checkHealth;
