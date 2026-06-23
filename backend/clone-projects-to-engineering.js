// Deep-clone the Projects Team department into Engineering: same skills,
// sub-skills, trainings, resources, skill levels and certification
// assignments (status + dates) — but with all people renamed to fresh UK
// names. Replaces Engineering's existing data.
//
// Run: node backend/clone-projects-to-engineering.js   (inside the container)
const db = require('./db');

// Fresh UK names (not used by the sales/cyber/engineering seeds).
const NEW_UK_NAMES = [
  'Edward Marsh', 'Florence Bell', 'Henry Caldwell', 'Imogen Fletcher',
  'Joseph Hayward', 'Katherine Lowe', 'Leo Bancroft', 'Martha Sutton',
  'Nicholas Reeves', 'Phoebe Hammond', 'Oscar Drummond', 'Rosie Whittaker',
  'Samuel Ashby', 'Tabitha Quinn', 'Victor Holloway', 'Beatrice Lane',
  'Charlie Pemberton', 'Daisy Maguire', 'Elliot Crawford', 'Georgia Whitlock',
  'Hugh Stanton', 'Isabelle Renton', 'Jacob Ainsworth', 'Lydia Marsden',
  'Maxwell Pike', 'Nadia Ellis', 'Owen Bradshaw', 'Penelope Vaughan',
  'Quentin Hale', 'Sienna Forsythe',
];

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const src = (await client.query(`SELECT id FROM departments WHERE slug = 'projects-team'`)).rows[0].id;
    const dst = (await client.query(`SELECT id FROM departments WHERE slug = 'engineering'`)).rows[0].id;

    // 1. Wipe Engineering's current data (children first, then roots).
    await client.query(`DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [dst]);
    await client.query(`DELETE FROM resource_trainings  WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [dst]);
    await client.query(`DELETE FROM resources WHERE department_id = $1`, [dst]);
    await client.query(`DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [dst]);
    await client.query(`DELETE FROM main_skills WHERE department_id = $1`, [dst]);
    await client.query(`DELETE FROM trainings WHERE department_id = $1`, [dst]);

    // 2. main_skills
    const ptSkills = (await client.query(
      `SELECT id, name, category, weight, skill_type FROM main_skills WHERE department_id = $1 ORDER BY name`, [src])).rows;
    const msMap = {};
    for (const s of ptSkills) {
      const newId = `engineering-${s.id}`;
      msMap[s.id] = newId;
      await client.query(
        `INSERT INTO main_skills (id, name, category, weight, skill_type, department_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        [newId, s.name, s.category, s.weight, s.skill_type, dst]);
    }

    // 3. sub_skills
    const ptSubs = (await client.query(
      `SELECT id, main_skill_id, name FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [src])).rows;
    const subMap = {};
    for (const ss of ptSubs) {
      const r = await client.query(
        `INSERT INTO sub_skills (main_skill_id, name) VALUES ($1,$2) RETURNING id`, [msMap[ss.main_skill_id], ss.name]);
      subMap[ss.id] = r.rows[0].id;
    }

    // 4. trainings
    const ptTr = (await client.query(
      `SELECT id, name, code, vendor, category, type, description FROM trainings WHERE department_id = $1`, [src])).rows;
    const trMap = {};
    for (const t of ptTr) {
      const r = await client.query(
        `INSERT INTO trainings (name, code, vendor, category, type, description, department_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [t.name, t.code, t.vendor, t.category, t.type, t.description, dst]);
      trMap[t.id] = r.rows[0].id;
    }

    // 5. resources (renamed)
    const ptRes = (await client.query(
      `SELECT id, name, email, job_role FROM resources WHERE department_id = $1 ORDER BY name`, [src])).rows;
    if (ptRes.length > NEW_UK_NAMES.length) {
      throw new Error(`Projects Team has ${ptRes.length} people but only ${NEW_UK_NAMES.length} replacement names are available`);
    }
    const resMap = {};
    for (let i = 0; i < ptRes.length; i++) {
      const r = ptRes[i];
      const newName = NEW_UK_NAMES[i];
      const newId = `engineering-${slugify(newName)}-${i + 1}`;
      resMap[r.id] = newId;
      const email = r.email ? `${slugify(newName).replace(/-/g, '.')}@example.com` : null;
      await client.query(
        `INSERT INTO resources (id, name, email, job_role, department_id) VALUES ($1,$2,$3,$4,$5)`,
        [newId, newName, email, r.job_role, dst]);
    }

    // 6. resource_sub_skills (levels + last_assessed_at)
    const ptRss = (await client.query(
      `SELECT resource_id, sub_skill_id, level, last_assessed_at FROM resource_sub_skills
       WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [src])).rows;
    let rssN = 0;
    for (const m of ptRss) {
      const nr = resMap[m.resource_id], ns = subMap[m.sub_skill_id];
      if (!nr || !ns) continue;
      await client.query(
        `INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level, last_assessed_at) VALUES ($1,$2,$3,$4)`,
        [nr, ns, m.level, m.last_assessed_at]);
      rssN++;
    }

    // 7. resource_trainings (status + all dates)
    const ptRt = (await client.query(
      `SELECT resource_id, training_id, status, target_date, completed_date, expiry_date, notes FROM resource_trainings
       WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [src])).rows;
    let rtN = 0;
    for (const a of ptRt) {
      const nr = resMap[a.resource_id], nt = trMap[a.training_id];
      if (!nr || !nt) continue;
      await client.query(
        `INSERT INTO resource_trainings (resource_id, training_id, status, target_date, completed_date, expiry_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [nr, nt, a.status, a.target_date, a.completed_date, a.expiry_date, a.notes]);
      rtN++;
    }

    await client.query('COMMIT');
    console.log(`Cloned projects-team -> engineering: ${ptSkills.length} skills, ${ptSubs.length} sub-skills, ` +
      `${ptTr.length} trainings, ${ptRes.length} resources (renamed), ${rssN} skill levels, ${rtN} cert assignments`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Clone failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}
main();
