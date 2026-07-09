// Seeds Sales, Cyber, Engineering with realistic content (UK names).
// Idempotent: a department that already has resources is skipped.
// Run: node backend/seed-departments.js
const db = require('./db');

// Deterministic 1..5 level from a string (stable across runs).
function hashLevel(str, lo = 2, hi = 5) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return lo + (h % (hi - lo + 1));
}
const slugify = (dept, name) => `${dept}-` + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function seedDept(client, dept, spec) {
  const d = await client.query('SELECT id FROM departments WHERE slug=$1', [dept]);
  if (d.rowCount === 0) throw new Error(`Department ${dept} missing — run migration 009 first`);
  const deptId = d.rows[0].id;

  const existing = await client.query('SELECT COUNT(*) c FROM resources WHERE department_id=$1', [deptId]);
  if (parseInt(existing.rows[0].c, 10) > 0) { console.log(`Skip ${dept}: already seeded`); return; }

  // main_skills + sub_skills
  const subIdByKey = {}; // `${mainName}::${subName}` -> sub_skill id
  for (const s of spec.skills) {
    const msId = slugify(dept, s.name);
    await client.query(
      'INSERT INTO main_skills (id, name, category, weight, skill_type, department_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [msId, s.name, s.category || null, s.weight || 5, s.type || 'technical', deptId]);
    for (const sub of s.subs) {
      const r = await client.query(
        'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1,$2) RETURNING id', [msId, sub]);
      subIdByKey[`${s.name}::${sub}`] = r.rows[0].id;
    }
  }

  // trainings
  const trainingIdByName = {};
  for (const t of spec.trainings) {
    const r = await client.query(
      'INSERT INTO trainings (name, code, vendor, category, type, department_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [t.name, t.code || null, t.vendor || null, t.category || 'other', t.type || 'certification', deptId]);
    trainingIdByName[t.name] = r.rows[0].id;
  }

  // people + skill levels + a couple of trainings each
  let i = 0;
  for (const p of spec.people) {
    const rid = slugify(dept, p.name) + '-' + (++i);
    await client.query(
      'INSERT INTO resources (id, name, email, job_role, department_id) VALUES ($1,$2,$3,$4,$5)',
      [rid, p.name, p.email || null, p.role || null, deptId]);
    for (const s of spec.skills) {
      for (const sub of s.subs) {
        const level = hashLevel(rid + s.name + sub);
        await client.query(
          'INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level) VALUES ($1,$2,$3)',
          [rid, subIdByKey[`${s.name}::${sub}`], level]);
      }
    }
    // assign 2 trainings deterministically
    const tNames = Object.keys(trainingIdByName);
    const t1 = tNames[hashLevel(rid + 'a', 0, tNames.length - 1)];
    const t2 = tNames[hashLevel(rid + 'b', 0, tNames.length - 1)];
    for (const tn of new Set([t1, t2])) {
      await client.query(
        `INSERT INTO resource_trainings (resource_id, training_id, status)
         VALUES ($1,$2,$3) ON CONFLICT (resource_id, training_id) DO NOTHING`,
        [rid, trainingIdByName[tn], 'achieved']);
    }
  }
  console.log(`Seeded ${dept}: ${spec.people.length} people, ${spec.skills.length} skills, ${spec.trainings.length} trainings`);
}

async function main() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await seedDept(client, 'sales', require('./seed-data/sales'));
    await seedDept(client, 'cyber', require('./seed-data/cyber'));
    await seedDept(client, 'engineering', require('./seed-data/engineering'));
    await client.query('COMMIT');
    console.log('Seeding complete.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}
main();
