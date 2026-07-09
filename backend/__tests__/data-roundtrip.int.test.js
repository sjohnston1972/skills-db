// Round-trip integration tests for the /api/data import/export rework:
//   #16 — main-skill category/weight/skill_type survive import
//   #17 — job_role, password_hash, last_assessed_at survive import
//   #18 — training assignments are NOT cascade-deleted by import
//   #19 — no router.handle() re-dispatch (import/export share real functions)
// Runs in the 'sales' department so it can't disturb other suites' data.
const request = require('supertest');
const app = require('../server');
const db = require('../db');

const DEPT = 'sales';
let deptId;
let trainingId;

// Strip DB-generated sub-skill ids: they legitimately change on re-import.
function comparableSkills(skills) {
    return skills.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        weight: s.weight,
        skillType: s.skillType,
        subSkills: s.subSkills.map(ss => ss.name).sort(),
    }));
}

beforeAll(async () => {
    deptId = (await db.query(
        "SELECT id FROM departments WHERE slug = $1", [DEPT]
    )).rows[0].id;

    // Clean slate for this department, then seed one fully-loaded resource.
    await db.query(
        `DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [deptId]);
    await db.query(`DELETE FROM resources WHERE department_id = $1`, [deptId]);
    await db.query(
        `DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [deptId]);
    await db.query(`DELETE FROM main_skills WHERE department_id = $1`, [deptId]);
    await db.query(`DELETE FROM trainings WHERE department_id = $1`, [deptId]);

    await db.query(
        `INSERT INTO resources (id, name, email, job_role, password_hash, department_id)
         VALUES ('rt-alice', 'Alice Roundtrip', 'alice@example.com', 'Network Architect', 'hash-must-survive', $1)`,
        [deptId]);
    await db.query(
        `INSERT INTO main_skills (id, name, category, weight, skill_type, department_id)
         VALUES ('sales-networking', 'Networking', 'Infrastructure', 9, 'non-technical', $1)`,
        [deptId]);
    const sub = await db.query(
        `INSERT INTO sub_skills (main_skill_id, name) VALUES ('sales-networking', 'BGP') RETURNING id`);
    await db.query(
        `INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level, last_assessed_at)
         VALUES ('rt-alice', $1, 4, '2025-03-15 10:00:00')`, [sub.rows[0].id]);

    trainingId = (await db.query(
        `INSERT INTO trainings (name, category, type, department_id)
         VALUES ('CCNP Roundtrip', 'cisco', 'certification', $1) RETURNING id`, [deptId])).rows[0].id;
    await db.query(
        `INSERT INTO resource_trainings (resource_id, training_id, status)
         VALUES ('rt-alice', $1, 'in-progress')`, [trainingId]);
});

afterAll(() => db.pool.end());

describe('export → import → re-export is lossless (#16 #17 #18)', () => {
    test('round-trip preserves skills metadata, job_role, lastAssessed, password_hash, trainings', async () => {
        const exp1 = await request(app).get('/api/data').set('X-Department', DEPT);
        expect(exp1.status).toBe(200);
        expect(exp1.body.data.skills).toHaveLength(1);
        expect(exp1.body.data.resources[0].job_role).toBe('Network Architect');

        const imp = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send(exp1.body.data);
        expect(imp.status).toBe(200);
        expect(imp.body.success).toBe(true);

        const exp2 = await request(app).get('/api/data').set('X-Department', DEPT);
        expect(exp2.status).toBe(200);

        // #16 — category/weight/skillType round-trip
        expect(comparableSkills(exp2.body.data.skills))
            .toEqual(comparableSkills(exp1.body.data.skills));

        // #17 — job_role and lastAssessed round-trip
        const [a1] = exp1.body.data.resources;
        const [a2] = exp2.body.data.resources;
        expect(a2.job_role).toBe('Network Architect');
        expect(a2.subSkills).toEqual(a1.subSkills);
        expect(a2.lastAssessed).toEqual(a1.lastAssessed);

        // #17 — password_hash untouched in the DB
        const hash = await db.query(
            `SELECT password_hash FROM resources WHERE id = 'rt-alice'`);
        expect(hash.rows[0].password_hash).toBe('hash-must-survive');

        // #18 — training assignment survives import
        const rt = await db.query(
            `SELECT status FROM resource_trainings WHERE resource_id = 'rt-alice' AND training_id = $1`,
            [trainingId]);
        expect(rt.rows).toHaveLength(1);
        expect(rt.rows[0].status).toBe('in-progress');
    });

    test('POST /api/data/import behaves identically to POST /api/data (#19)', async () => {
        const exp = await request(app).get('/api/data').set('X-Department', DEPT);
        const imp = await request(app)
            .post('/api/data/import')
            .set('X-Department', DEPT)
            .send(exp.body.data);
        expect(imp.status).toBe(200);
        expect(imp.body.success).toBe(true);
    });

    test('POST /api/data/export returns the attachment with the same payload (#19)', async () => {
        const exp = await request(app)
            .post('/api/data/export')
            .set('X-Department', DEPT)
            .send({});
        expect(exp.status).toBe(200);
        expect(exp.headers['content-disposition']).toMatch(/attachment/);
        expect(exp.body.success).toBe(true);
        expect(exp.body.data.resources[0].id).toBe('rt-alice');
    });
});

describe('import validation rejects bad payloads without touching data', () => {
    test('rating level outside 0-5 → 400, DB unchanged', async () => {
        const res = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send({ resources: [{ id: 'rt-alice', name: 'Alice', subSkills: { Networking: { BGP: 7 } } }] });
        expect(res.status).toBe(400);
        const level = await db.query(
            `SELECT level FROM resource_sub_skills WHERE resource_id = 'rt-alice'`);
        expect(level.rows[0].level).toBe(4);
    });

    test('resource missing id → 400', async () => {
        const res = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send({ resources: [{ name: 'No Id' }] });
        expect(res.status).toBe(400);
    });

    test('skills[] weight outside 1-10 → 400', async () => {
        const res = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send({
                resources: [{ id: 'rt-alice', name: 'Alice' }],
                skills: [{ name: 'Networking', weight: 99 }],
            });
        expect(res.status).toBe(400);
    });

    test('non-array resources → 400', async () => {
        const res = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send({ resources: 'nope' });
        expect(res.status).toBe(400);
    });
});

describe('legacy payloads (resources only, no skills catalogue)', () => {
    test('imports with default skill metadata and preserves job_role via upsert', async () => {
        const res = await request(app)
            .post('/api/data')
            .set('X-Department', DEPT)
            .send({
                resources: [{
                    id: 'rt-alice',
                    name: 'Alice Roundtrip',
                    email: 'alice@example.com',
                    subSkills: { Networking: { BGP: 5 } },
                }],
            });
        expect(res.status).toBe(200);

        const exp = await request(app).get('/api/data').set('X-Department', DEPT);
        const alice = exp.body.data.resources.find(r => r.id === 'rt-alice');
        expect(alice.subSkills.Networking.BGP).toBe(5);
        // Legacy payload has no job_role field — upsert must not null it out.
        expect(alice.job_role).toBe('Network Architect');
        // password_hash and the training assignment still survive.
        const hash = await db.query(`SELECT password_hash FROM resources WHERE id = 'rt-alice'`);
        expect(hash.rows[0].password_hash).toBe('hash-must-survive');
        const rt = await db.query(`SELECT 1 FROM resource_trainings WHERE resource_id = 'rt-alice'`);
        expect(rt.rows).toHaveLength(1);
    });
});
