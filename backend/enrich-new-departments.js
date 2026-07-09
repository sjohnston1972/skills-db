// One-off enrichment for the seeded departments (sales, cyber, engineering):
//   1. Re-randomise skill levels with a wider, more natural 0-5 spread
//      (the initial seed used a narrow, clustered 2-5 range).
//   2. Replace the flat "all achieved" training assignments with a realistic
//      mix of planned / in-progress / achieved / expired certs, with dates
//      (some achieved certs expire within 90 days so the expiry banner shows).
//
// Idempotent enough to re-run: the cert assignments are deterministic and
// fully replaced each run; skill levels are re-randomised each run (intended).
//
// Run: node backend/enrich-new-departments.js   (inside the container)
const db = require('./db');

const DEPTS = ['sales', 'cyber', 'engineering'];

// Cycle of statuses; extra 'achieved' so there's a healthy base of valid certs.
const STATUS_CYCLE = ['planned', 'in-progress', 'achieved', 'expired', 'achieved'];

function assignmentInsert(status, i) {
  // Returns { sql, params } for INSERT INTO resource_trainings, with
  // status-appropriate dates derived from the resource index for spread.
  if (status === 'planned') {
    const d = 30 + (i * 7) % 60;
    return {
      cols: '(resource_id, training_id, status, target_date)',
      vals: `($1, $2, 'planned', CURRENT_DATE + ($3 || ' days')::interval)`,
      params: [d],
    };
  }
  if (status === 'in-progress') {
    const d = 15 + (i * 5) % 30;
    return {
      cols: '(resource_id, training_id, status, target_date)',
      vals: `($1, $2, 'in-progress', CURRENT_DATE + ($3 || ' days')::interval)`,
      params: [d],
    };
  }
  if (status === 'expired') {
    const completed = 700 + (i * 13) % 200;
    const lapsed = 10 + (i * 11) % 120;
    return {
      cols: '(resource_id, training_id, status, completed_date, expiry_date)',
      vals: `($1, $2, 'expired', CURRENT_DATE - ($3 || ' days')::interval, CURRENT_DATE - ($4 || ' days')::interval)`,
      params: [completed, lapsed],
    };
  }
  // achieved — every 3rd one expires within 90 days (feeds the expiry banner)
  const completed = 120 + (i * 17) % 360;
  const expiresSoon = (i % 3 === 0);
  const expiry = expiresSoon ? (20 + (i * 9) % 60) : (180 + (i * 23) % 250);
  return {
    cols: '(resource_id, training_id, status, completed_date, expiry_date)',
    vals: `($1, $2, 'achieved', CURRENT_DATE - ($3 || ' days')::interval, CURRENT_DATE + ($4 || ' days')::interval)`,
    params: [completed, expiry],
  };
}

async function enrichDept(client, slug) {
  const d = await client.query('SELECT id FROM departments WHERE slug = $1', [slug]);
  if (d.rowCount === 0) { console.log(`Skip ${slug}: department missing`); return; }
  const deptId = d.rows[0].id;

  // 1) Wider, bell-ish 0-5 skill levels (round of two random()s → centred, full range).
  const lv = await client.query(
    `UPDATE resource_sub_skills
        SET level = LEAST(5, GREATEST(0, round((random() + random()) * 2.5)::int))
      WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`,
    [deptId]
  );

  // 2) Rebuild training assignments with a varied status mix.
  const resources = (await client.query(
    'SELECT id FROM resources WHERE department_id = $1 ORDER BY id', [deptId]
  )).rows.map(r => r.id);
  const trainings = (await client.query(
    'SELECT id FROM trainings WHERE department_id = $1 ORDER BY id', [deptId]
  )).rows.map(t => t.id);

  await client.query(
    `DELETE FROM resource_trainings
      WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`,
    [deptId]
  );

  const counts = { planned: 0, 'in-progress': 0, achieved: 0, expired: 0 };
  const m = trainings.length;
  for (let i = 0; i < resources.length; i++) {
    const rid = resources[i];
    // Pick 3 spread-out trainings for this person.
    const picks = [i % m, (i + Math.floor(m / 3)) % m, (i + Math.floor((2 * m) / 3)) % m];
    const seen = new Set();
    for (let k = 0; k < picks.length; k++) {
      const tIdx = picks[k];
      if (seen.has(tIdx)) continue;
      seen.add(tIdx);
      const status = STATUS_CYCLE[(i + k) % STATUS_CYCLE.length];
      const a = assignmentInsert(status, i + k);
      await client.query(
        `INSERT INTO resource_trainings ${a.cols} VALUES ${a.vals}`,
        [rid, trainings[tIdx], ...a.params]
      );
      counts[status] += 1;
    }
  }
  console.log(`Enriched ${slug}: ${lv.rowCount} skill levels re-randomised; ` +
    `certs → planned ${counts.planned}, in-progress ${counts['in-progress']}, achieved ${counts.achieved}, expired ${counts.expired}`);
}

async function main() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const slug of DEPTS) await enrichDept(client, slug);
    await client.query('COMMIT');
    console.log('Enrichment complete.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Enrichment failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}
main();
