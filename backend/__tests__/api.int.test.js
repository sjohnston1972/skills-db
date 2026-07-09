// API integration tests (#22): resources CRUD, skills + sub-skills CRUD,
// training assignment upsert, and the GET /api/data envelope shape.
// Runs in the 'cyber' department so it can't disturb other suites' data.
const request = require('supertest');
const app = require('../server');
const db = require('../db');

const DEPT = 'cyber';
const api = method => (path) => request(app)[method](path).set('X-Department', DEPT);
const get = api('get'), post = api('post'), put = api('put'), del = api('delete');

let deptId;

beforeAll(async () => {
    deptId = (await db.query("SELECT id FROM departments WHERE slug = $1", [DEPT])).rows[0].id;
    await db.query(
        `DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [deptId]);
    await db.query(`DELETE FROM resources WHERE department_id = $1`, [deptId]);
    await db.query(
        `DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [deptId]);
    await db.query(`DELETE FROM main_skills WHERE department_id = $1`, [deptId]);
    await db.query(`DELETE FROM trainings WHERE department_id = $1`, [deptId]);
});

afterAll(() => db.pool.end());

describe('resources CRUD', () => {
    test('POST creates → 201 with the new resource', async () => {
        const res = await post('/api/resources')
            .send({ id: 'it-bob', name: 'Bob Integration', email: 'bob@example.com', job_role: 'Engineer' });
        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ id: 'it-bob', name: 'Bob Integration', job_role: 'Engineer' });
    });

    test('POST duplicate id → 409', async () => {
        const res = await post('/api/resources').send({ id: 'it-bob', name: 'Bob Again' });
        expect(res.status).toBe(409);
    });

    test('POST without name → 400', async () => {
        const res = await post('/api/resources').send({ id: 'it-nameless' });
        expect(res.status).toBe(400);
    });

    test('GET by id → 200, unknown id → 404', async () => {
        const ok = await get('/api/resources/it-bob');
        expect(ok.status).toBe(200);
        expect(ok.body.data.name).toBe('Bob Integration');

        const missing = await get('/api/resources/it-nobody');
        expect(missing.status).toBe(404);
    });

    test('PUT updates fields → job_role changed', async () => {
        const res = await put('/api/resources/it-bob').send({ job_role: 'Principal Engineer' });
        expect(res.status).toBe(200);
        const check = await get('/api/resources/it-bob');
        expect(check.body.data.job_role).toBe('Principal Engineer');
    });

    test('DELETE removes → subsequent GET 404', async () => {
        const victim = await post('/api/resources').send({ id: 'it-temp', name: 'Temp' });
        expect(victim.status).toBe(201);
        const res = await del('/api/resources/it-temp');
        expect(res.status).toBe(200);
        expect((await get('/api/resources/it-temp')).status).toBe(404);
    });
});

describe('skills + sub-skills CRUD', () => {
    let skillId;
    let subId;

    test('POST creates a skill with metadata + sub-skills → 201', async () => {
        const res = await post('/api/skills')
            .send({ name: 'Threat Intel', category: 'Security', weight: 7, skillType: 'technical', subSkills: ['OSINT'] });
        expect(res.status).toBe(201);
        skillId = res.body.data.id;
        expect(res.body.data.weight).toBe(7);
    });

    test('POST with weight outside 1-10 → 400', async () => {
        const res = await post('/api/skills').send({ name: 'Bad Weight', weight: 99 });
        expect(res.status).toBe(400);
    });

    test('POST duplicate name → 409', async () => {
        const res = await post('/api/skills').send({ name: 'Threat Intel' });
        expect(res.status).toBe(409);
    });

    test('POST /:id/sub-skills adds → 201; duplicate → 409', async () => {
        const res = await post(`/api/skills/${skillId}/sub-skills`).send({ name: 'SIEM' });
        expect(res.status).toBe(201);
        subId = res.body.data.id;

        const dup = await post(`/api/skills/${skillId}/sub-skills`).send({ name: 'SIEM' });
        expect(dup.status).toBe(409);
    });

    test('PUT /:id/sub-skills/:subId renames → 200', async () => {
        const res = await put(`/api/skills/${skillId}/sub-skills/${subId}`).send({ name: 'SIEM Ops' });
        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('SIEM Ops');
    });

    test('DELETE /:id/sub-skills/:subId removes it and its ratings', async () => {
        await db.query(
            `INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level) VALUES ('it-bob', $1, 3)`, [subId]);
        const res = await del(`/api/skills/${skillId}/sub-skills/${subId}`);
        expect(res.status).toBe(200);
        const orphans = await db.query(
            `SELECT 1 FROM resource_sub_skills WHERE sub_skill_id = $1`, [subId]);
        expect(orphans.rows).toHaveLength(0);
    });

    test('DELETE /:id cascades to remaining sub-skills', async () => {
        const res = await del(`/api/skills/${skillId}`);
        expect(res.status).toBe(200);
        const subs = await db.query(
            `SELECT 1 FROM sub_skills WHERE main_skill_id = $1`, [skillId]);
        expect(subs.rows).toHaveLength(0);
    });
});

describe('training assignment upsert', () => {
    let trainingId;

    test('POST /api/trainings + assignment → 201', async () => {
        const t = await post('/api/trainings').send({ name: 'CISSP Integration', category: 'other' });
        expect(t.status).toBe(201);
        trainingId = t.body.data.id;

        const a = await post('/api/trainings/assignments')
            .send({ resource_id: 'it-bob', training_id: trainingId, status: 'planned' });
        expect(a.status).toBe(201);
    });

    test('re-POST same pair upserts (one row, new status) — idempotent', async () => {
        const a = await post('/api/trainings/assignments')
            .send({ resource_id: 'it-bob', training_id: trainingId, status: 'achieved' });
        expect(a.status).toBe(201);
        const rows = await db.query(
            `SELECT status FROM resource_trainings WHERE resource_id = 'it-bob' AND training_id = $1`,
            [trainingId]);
        expect(rows.rows).toHaveLength(1);
        expect(rows.rows[0].status).toBe('achieved');
    });
});

describe('GET /api/data envelope', () => {
    test('returns the localStorage-compatible shape', async () => {
        const res = await get('/api/data');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.resources)).toBe(true);
        expect(Array.isArray(res.body.data.skills)).toBe(true);
        expect(res.body.data.metadata).toMatchObject({
            version: '3.0',
            source: 'PostgreSQL Database',
        });
        const bob = res.body.data.resources.find(r => r.id === 'it-bob');
        expect(bob).toBeDefined();
        expect(bob).toHaveProperty('subSkills');
        expect(bob).toHaveProperty('lastAssessed');
    });
});
