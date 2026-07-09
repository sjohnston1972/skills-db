// Harness smoke test: the app must be requirable and serve its JSON 404
// without a live database (db is mocked, no port is opened).
jest.mock('../db', () => ({
    query: jest.fn().mockResolvedValue({ rows: [{ id: 1, slug: 'projects-team' }] }),
    getClient: jest.fn(),
    pool: { end: jest.fn() },
    initDatabase: jest.fn(),
}));

const request = require('supertest');
const app = require('../server');

test('unknown API route returns the JSON 404 without a database', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'API endpoint not found' });
});
