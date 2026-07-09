// Integration tests for the Express-layer auth hardening:
//   #9  — settings mutations require admin auth
//   #10 — AI endpoints require auth
//   #12 — /api/data/reset requires admin auth + an explicit confirm token
// Uses the real test database (global-setup) and the fixture htpasswd
// (user `testadmin`; verifyAdminAuth checks username presence only).
const request = require('supertest');
const app = require('../server');
const db = require('../db');

const AUTH = 'Basic ' + Buffer.from('testadmin:anything').toString('base64');
const UNKNOWN = 'Basic ' + Buffer.from('nosuchuser:pw').toString('base64');

afterAll(() => db.pool.end());

describe('settings mutations require admin auth (#9)', () => {
    test('PUT /api/settings/api-keys/:name without auth → 401', async () => {
        const res = await request(app)
            .put('/api/settings/api-keys/anthropic_api_key')
            .send({ value: 'sk-ant-dummy-key' });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('DELETE /api/settings/api-keys/:name without auth → 401', async () => {
        const res = await request(app).delete('/api/settings/api-keys/anthropic_api_key');
        expect(res.status).toBe(401);
    });

    test('PUT /api/settings/flags/:name without auth → 401', async () => {
        const res = await request(app)
            .put('/api/settings/flags/ai_enabled')
            .send({ value: true });
        expect(res.status).toBe(401);
    });

    test('PUT /api/settings/flags/:name with unknown user → 401', async () => {
        const res = await request(app)
            .put('/api/settings/flags/ai_enabled')
            .set('Authorization', UNKNOWN)
            .send({ value: true });
        expect(res.status).toBe(401);
    });

    test('PUT /api/settings/flags/:name with known user succeeds', async () => {
        const res = await request(app)
            .put('/api/settings/flags/ai_enabled')
            .set('Authorization', AUTH)
            .send({ value: true });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('GET /api/settings/api-keys stays open at the Express layer (nginx covers it)', async () => {
        const res = await request(app).get('/api/settings/api-keys');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('AI endpoints require auth (#10)', () => {
    test('POST /api/insights/chat anonymous → 401', async () => {
        const res = await request(app)
            .post('/api/insights/chat')
            .send({ messages: [{ role: 'user', content: 'hi' }] });
        expect(res.status).toBe(401);
    });

    test('POST /api/insights/match/ai anonymous → 401', async () => {
        const res = await request(app)
            .post('/api/insights/match/ai')
            .send({ spec: 'Senior network engineer with BGP' });
        expect(res.status).toBe(401);
    });

    // Empty bodies stop the handlers before any Anthropic call: no API key
    // configured → 503, key present in env → 400 (missing messages/spec).
    test('POST /api/insights/chat authenticated is not rejected as 401', async () => {
        const res = await request(app)
            .post('/api/insights/chat')
            .set('Authorization', AUTH)
            .send({});
        expect(res.status).not.toBe(401);
        expect([400, 403, 503]).toContain(res.status);
    });

    test('POST /api/insights/match/ai authenticated is not rejected as 401', async () => {
        const res = await request(app)
            .post('/api/insights/match/ai')
            .set('Authorization', AUTH)
            .send({});
        expect(res.status).not.toBe(401);
        expect([400, 403, 503]).toContain(res.status);
    });
});

describe('reset requires admin auth + confirmation token (#12)', () => {
    test('POST /api/data/reset anonymous → 401', async () => {
        const res = await request(app).post('/api/data/reset').send({});
        expect(res.status).toBe(401);
    });

    test('POST /api/data/reset authed without confirm → 400 and does not wipe', async () => {
        const res = await request(app)
            .post('/api/data/reset')
            .set('Authorization', AUTH)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/confirm/i);
        // Schema untouched: departments table (added by migrations, dropped
        // by a real reset's init-db.sql run) must still be populated.
        const r = await db.query("SELECT COUNT(*)::int AS n FROM departments");
        expect(r.rows[0].n).toBeGreaterThan(0);
    });

    // Deliberately NO confirmed-reset test: it would rebuild the schema in
    // the middle of the jest run and destroy other suites' data.
});
