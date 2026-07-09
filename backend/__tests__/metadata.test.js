// GET /api/metadata must never expose secret API keys (issue #8).
// db is mocked: the query itself carries the denylist, so we assert the
// SQL parameterisation rather than trusting JS-side filtering.
jest.mock('../db', () => ({
    query: jest.fn(),
    getClient: jest.fn(),
    pool: { end: jest.fn() },
    initDatabase: jest.fn(),
}));

const request = require('supertest');
const db = require('../db');
const app = require('../server');

test('metadata response excludes anthropic_api_key and keeps normal keys', async () => {
    db.query.mockImplementation(async (text, params) => {
        if (text.includes('FROM metadata')) {
            const rows = [
                { key: 'anthropic_api_key', value: 'sk-ant-test-1234' },
                { key: 'last_updated', value: '2026-01-01T00:00:00Z' },
                { key: 'ai_enabled', value: 'true' },
            ];
            const denied = (params && params[0]) || [];
            return { rows: rows.filter(r => !denied.includes(r.key)) };
        }
        return { rows: [{ id: 1, slug: 'projects-team' }] };
    });

    const res = await request(app).get('/api/metadata');
    expect(res.status).toBe(200);
    expect(res.body.data.anthropicApiKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('sk-ant-test-1234');
    expect(res.body.data.lastUpdated).toBe('2026-01-01T00:00:00Z');
    expect(res.body.data.aiEnabled).toBe('true');

    // The denylist must actually be passed to SQL.
    const call = db.query.mock.calls.find(([t]) => t.includes('FROM metadata'));
    expect(call[0]).toContain('key <> ALL($1)');
    expect(call[1][0]).toContain('anthropic_api_key');
});
