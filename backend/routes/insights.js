const express = require('express');
const router = express.Router();
const db = require('../db');
const { getApiKey } = require('./settings');

/**
 * Rule-based team insights — no LLM required.
 * Each insight returns: { id, title, body, detail, severity }
 * severity: 'ok' | 'info' | 'warn' | 'risk'
 */
router.get('/', async (req, res) => {
    try {
        const insights = [];

        // Pull the data we need in one shot
        const [resourcesR, skillsR, ratingsR, certsR, expiringR] = await Promise.all([
            db.query(`SELECT id, name FROM resources`),
            db.query(`
                SELECT ms.id, ms.name, ms.weight, ms.skill_type,
                       COUNT(DISTINCT ss.id) AS sub_skill_count
                FROM main_skills ms
                LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
                GROUP BY ms.id
            `),
            db.query(`
                SELECT rss.resource_id, ss.main_skill_id, rss.level, r.name AS resource_name, ms.name AS main_skill, ms.weight, ms.skill_type
                FROM resource_sub_skills rss
                JOIN sub_skills ss ON ss.id = rss.sub_skill_id
                JOIN main_skills ms ON ms.id = ss.main_skill_id
                JOIN resources r ON r.id = rss.resource_id
            `),
            db.query(`
                SELECT rt.status, COUNT(*)::int AS n
                FROM resource_trainings rt
                GROUP BY rt.status
            `),
            db.query(`
                SELECT COUNT(*)::int AS n
                FROM resource_trainings rt
                WHERE rt.expiry_date IS NOT NULL
                  AND rt.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
                  AND rt.status IN ('achieved', 'in-progress')
            `),
        ]);

        const totalResources = resourcesR.rows.length;
        const skills = skillsR.rows;
        const ratings = ratingsR.rows;

        // Compute main-skill levels = round(avg of sub-skill levels) per (resource, main_skill)
        const byResourceMain = new Map();   // "rid::mainName" -> { sum, count }
        ratings.forEach(r => {
            const key = `${r.resource_id}::${r.main_skill}`;
            if (!byResourceMain.has(key)) byResourceMain.set(key, { sum: 0, count: 0, name: r.resource_name, weight: r.weight, type: r.skill_type });
            const v = byResourceMain.get(key);
            v.sum += r.level;
            v.count += 1;
        });
        const mainLevels = []; // {resource_id, resource_name, main_skill, level, weight, type}
        byResourceMain.forEach((v, key) => {
            const [rid, main] = key.split('::');
            mainLevels.push({
                resource_id: rid,
                resource_name: v.name,
                main_skill: main,
                level: Math.round(v.sum / v.count),
                weight: v.weight,
                type: v.type,
            });
        });

        // -----------------------------------------------------------
        // 1. Single Points of Failure
        // -----------------------------------------------------------
        const expertsBySkill = new Map();
        skills.forEach(s => expertsBySkill.set(s.name, []));
        mainLevels.forEach(ml => {
            if (ml.level >= 4) expertsBySkill.get(ml.main_skill)?.push(ml.resource_name);
        });
        const spofSkills = [];
        const noCoverage = [];
        expertsBySkill.forEach((names, skill) => {
            const skillRow = skills.find(s => s.name === skill);
            if (!skillRow || skillRow.sub_skill_count == 0) return;  // skip orphan main skills
            if (names.length === 0) noCoverage.push({ skill, weight: skillRow.weight });
            else if (names.length === 1) spofSkills.push({ skill, expert: names[0], weight: skillRow.weight });
        });
        insights.push({
            id: 'spof',
            title: 'Bus-factor risk',
            severity: spofSkills.length + noCoverage.length > 5 ? 'risk' : (spofSkills.length + noCoverage.length > 0 ? 'warn' : 'ok'),
            body: `${spofSkills.length} ${spofSkills.length === 1 ? 'skill is' : 'skills are'} held by exactly one expert; ${noCoverage.length} ${noCoverage.length === 1 ? 'has' : 'have'} no expert at all.`,
            detail: [
                ...spofSkills.sort((a, b) => b.weight - a.weight).slice(0, 5).map(s => `Sole expert in ${s.skill}: ${s.expert} (weight ${s.weight})`),
                ...noCoverage.sort((a, b) => b.weight - a.weight).slice(0, 5).map(s => `No expert in ${s.skill} (weight ${s.weight})`),
            ],
        });

        // -----------------------------------------------------------
        // 2. Weight vs capability gap (demand-supply mismatch)
        // -----------------------------------------------------------
        const skillAvg = {};
        skills.forEach(s => {
            const levels = mainLevels.filter(ml => ml.main_skill === s.name).map(ml => ml.level);
            skillAvg[s.name] = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
        });
        const mismatches = skills
            .filter(s => Number(s.sub_skill_count) > 0 && skillAvg[s.name] > 0)
            .map(s => ({
                name: s.name,
                weight: s.weight,
                avg: skillAvg[s.name],
                gap: (5 - skillAvg[s.name]) * s.weight,
            }))
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 3);
        insights.push({
            id: 'demand-mismatch',
            title: 'Highest demand-deficit skills',
            severity: 'info',
            body: 'These skills are the most painful: high weight, low team average. Investing here yields the biggest team-wide lift.',
            detail: mismatches.map(s => `${s.name} — weight ${s.weight}, team avg ${s.avg.toFixed(1)} (gap score ${s.gap.toFixed(1)})`),
        });

        // -----------------------------------------------------------
        // 3. Coverage imbalance (which skills have the most/fewest experts)
        // -----------------------------------------------------------
        const expertCounts = [...expertsBySkill.entries()]
            .filter(([sk]) => {
                const r = skills.find(s => s.name === sk);
                return r && Number(r.sub_skill_count) > 0;
            })
            .map(([sk, list]) => ({ name: sk, n: list.length }))
            .sort((a, b) => b.n - a.n);
        const mostExperts = expertCounts.slice(0, 3);
        const fewestExperts = expertCounts.slice(-3).reverse();
        insights.push({
            id: 'imbalance',
            title: 'Coverage imbalance',
            severity: 'info',
            body: 'Where you have the most expert depth and where you have the least.',
            detail: [
                ...mostExperts.map(s => `Strong: ${s.name} — ${s.n} expert${s.n === 1 ? '' : 's'}`),
                ...fewestExperts.map(s => `Thin:   ${s.name} — ${s.n} expert${s.n === 1 ? '' : 's'}`),
            ],
        });

        // -----------------------------------------------------------
        // 4. Cert pipeline
        // -----------------------------------------------------------
        const certCounts = certsR.rows.reduce((acc, row) => { acc[row.status] = row.n; return acc; }, {});
        const expiring90 = expiringR.rows[0]?.n || 0;
        const totalCerts = (certCounts.achieved || 0) + (certCounts['in-progress'] || 0) + (certCounts.planned || 0) + (certCounts.expired || 0);
        insights.push({
            id: 'cert-pipeline',
            title: 'Certification pipeline',
            severity: expiring90 > 5 ? 'warn' : 'info',
            body: `${totalCerts} certification assignments tracked across the team. ${expiring90} expire within 90 days.`,
            detail: [
                `${certCounts.achieved || 0} achieved`,
                `${certCounts['in-progress'] || 0} in progress`,
                `${certCounts.planned || 0} planned`,
                `${certCounts.expired || 0} expired`,
                `${expiring90} expiring in the next 90 days`,
            ],
        });

        // -----------------------------------------------------------
        // 5. Team specialization vs. breadth
        // -----------------------------------------------------------
        const byResource = new Map();
        mainLevels.forEach(ml => {
            const arr = byResource.get(ml.resource_name) || [];
            arr.push(ml);
            byResource.set(ml.resource_name, arr);
        });
        const breadthScores = [];
        byResource.forEach((arr, name) => {
            const proficient = arr.filter(ml => ml.level >= 3).length;
            breadthScores.push({ name, proficient });
        });
        breadthScores.sort((a, b) => b.proficient - a.proficient);
        const mostBroad = breadthScores.slice(0, 3);
        const avgBreadth = breadthScores.length ? breadthScores.reduce((a, b) => a + b.proficient, 0) / breadthScores.length : 0;
        insights.push({
            id: 'breadth',
            title: 'Specialists vs. generalists',
            severity: 'info',
            body: `Team-wide each person is proficient (L3+) in ${avgBreadth.toFixed(1)} main skills on average.`,
            detail: mostBroad.map(b => `${b.name} — proficient in ${b.proficient} main skills`),
        });

        // -----------------------------------------------------------
        // 6. Upskilling candidates — people one level away from expert
        // -----------------------------------------------------------
        const closeToExpert = mainLevels
            .filter(ml => ml.level === 3)
            .map(ml => ({ resource: ml.resource_name, skill: ml.main_skill, weight: ml.weight }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 6);
        insights.push({
            id: 'upskill',
            title: 'Quickest wins for upskilling',
            severity: 'ok',
            body: 'People who are one level away from expert in a high-demand skill — cheapest investment for team uplift.',
            detail: closeToExpert.map(c => `${c.resource} → could reach expert in ${c.skill} (weight ${c.weight})`),
        });

        // -----------------------------------------------------------
        // 7. People with no skills rated
        // -----------------------------------------------------------
        const ratedResourceIds = new Set(mainLevels.map(ml => ml.resource_id));
        const unrated = resourcesR.rows.filter(r => !ratedResourceIds.has(r.id));
        insights.push({
            id: 'unrated',
            title: 'Resources without ratings',
            severity: unrated.length ? 'warn' : 'ok',
            body: unrated.length
                ? `${unrated.length} resource${unrated.length === 1 ? '' : 's'} have no skill ratings yet — they're invisible in every average and gap calculation until you fill them in.`
                : `All ${totalResources} resources have at least some skill ratings recorded.`,
            detail: unrated.map(r => r.name),
        });

        // -----------------------------------------------------------
        // 8. "Quick action" summary — top 3 things to do
        // -----------------------------------------------------------
        const actions = [];
        if (noCoverage.length) actions.push(`Hire or train someone in ${noCoverage[0].skill} (no expert today).`);
        if (spofSkills.length) actions.push(`Cross-train a second person on ${spofSkills[0].skill} (currently only ${spofSkills[0].expert}).`);
        if (expiring90 > 0) actions.push(`Schedule ${expiring90} certification renewals expiring in the next 90 days.`);
        if (mismatches.length) actions.push(`Invest in ${mismatches[0].name} — biggest demand-deficit (gap score ${mismatches[0].gap.toFixed(1)}).`);
        if (unrated.length) actions.push(`Rate the ${unrated.length} unrated resource${unrated.length === 1 ? '' : 's'} so they appear in team averages.`);
        insights.unshift({
            id: 'actions',
            title: 'Recommended actions',
            severity: 'info',
            body: 'Top things to do based on the team\'s current state:',
            detail: actions.slice(0, 5),
        });

        res.json({ success: true, data: insights });
    } catch (err) {
        console.error('insights error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/insights/match
 * Body: { spec: "free-form text describing the project" }
 * Returns: { matched_skills: [...], requirements: [...], candidates: [...] }
 *
 * Uses fuzzy keyword matching against main-skill and sub-skill names.
 * No LLM — just a tokenizer + lookup.
 */
router.post('/match', async (req, res) => {
    try {
        const { spec = '' } = req.body || {};
        if (!spec || spec.length < 5) {
            return res.status(400).json({ success: false, error: 'Provide a spec of at least 5 characters' });
        }

        const skillsR = await db.query(`
            SELECT ms.id, ms.name, ms.weight, ms.skill_type,
                   ARRAY_AGG(ss.name) FILTER (WHERE ss.name IS NOT NULL) AS sub_names
            FROM main_skills ms
            LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
            GROUP BY ms.id
        `);

        // Synonym aliases: when the user uses a common shorthand or alternative
        // name, rewrite it to the canonical phrase that appears in our skill
        // catalogue. Add lower-case both sides.
        const ALIASES = {
            'dot1x': '802.1x',
            '8021x': '802.1x',
            'k8s': 'kubernetes',
            'aad': 'azure ad',
            'aks': 'azure kubernetes',
            'eks': 'aws kubernetes',
            'gke': 'gcp kubernetes',
            'radius': 'cisco ise',           // closest catalogued skill
            'tacacs': 'cisco ise',
            'sdwan': 'sd-wan',
            'sd wan': 'sd-wan',
            'iam': 'identity',
            'vlans': 'vlan',
            'routers': 'routing',
            'switches': 'switching',
            'pmp': 'project management professional',
            'csm': 'certified scrum master',
        };

        // Normalise spec: lowercase, non-alphanumeric → space, collapse runs.
        // Apply alias substitutions on the normalised string, then re-normalise
        // because aliases can introduce punctuation (e.g. "802.1x").
        const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
        let normSpec = normalise(spec);
        for (const [alias, canonical] of Object.entries(ALIASES)) {
            const re = new RegExp('(^|\\s)' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)', 'g');
            normSpec = normSpec.replace(re, `$1${canonical}$2`);
        }
        normSpec = normalise(normSpec);
        const specWords = new Set(normSpec.split(' ').filter(Boolean));

        // Common English filler that creates false positives (e.g. "and"
        // would match a sub-skill containing "and").
        const STOPWORDS = new Set([
            'and','or','the','for','with','a','an','to','of','in','on','at','as','be','is',
            'are','was','were','this','that','these','those','it','its','our','their','from',
            'we','you','i','need','want','someone','engineer','engineers','team','project',
        ]);

        // Helper: does the normalised spec contain a phrase (sequence of whole words)?
        // Built with leading/trailing space so substring inclusion is word-bounded.
        const paddedSpec = ' ' + normSpec + ' ';
        const phraseInSpec = (phrase) => paddedSpec.includes(' ' + phrase + ' ');

        const matches = [];
        for (const sk of skillsR.rows) {
            const candidates = [sk.name, ...(sk.sub_names || [])];
            let hits = 0;
            const matchedTerms = [];

            for (const c of candidates) {
                const t = c.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
                if (!t) continue;

                // Strong signal: the whole candidate appears as a contiguous
                // word sequence in the spec.
                if (phraseInSpec(t)) {
                    hits += 2;
                    matchedTerms.push(c);
                    continue;
                }

                // Weak signal: at least one significant word of a multi-word
                // candidate appears as a whole word in the spec.
                // Threshold: >=3 chars (so acronyms like BGP, VPN, AWS still
                // count); reject stopwords explicitly.
                const words = t.split(' ').filter(w => w.length >= 3 && !STOPWORDS.has(w));
                const matchedWords = words.filter(w => specWords.has(w));
                if (matchedWords.length > 0) {
                    hits += 1;
                    matchedTerms.push(c);
                }
            }

            if (hits > 0) {
                matches.push({
                    skill_id: sk.id,
                    skill: sk.name,
                    weight: sk.weight,
                    type: sk.skill_type,
                    hits,
                    matched_terms: Array.from(new Set(matchedTerms)).slice(0, 4),
                });
            }
        }

        if (matches.length === 0) {
            return res.json({
                success: true,
                data: {
                    matched_skills: [],
                    requirements: [],
                    candidates: [],
                    note: 'No skills could be inferred from the spec. Try mentioning specific technologies or roles.',
                },
            });
        }

        // Top matched skills become requirements at minLevel = 3 (proficient+)
        matches.sort((a, b) => b.hits - a.hits || b.weight - a.weight);
        const requirements = matches.slice(0, 6).map(m => ({
            mainSkill: m.skill,
            minLevel: 3,
            matched_terms: m.matched_terms,
        }));

        // Run a staffing-like query: compute each resource's main-skill levels,
        // score them against the requirements, return top.
        const allMainLevels = (await db.query(`
            SELECT r.id AS resource_id, r.name,
                   ms.name AS main_skill,
                   COALESCE(ROUND(AVG(rss.level)::numeric)::int, 0) AS level
            FROM resources r
            CROSS JOIN main_skills ms
            LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
            LEFT JOIN resource_sub_skills rss
                   ON rss.sub_skill_id = ss.id AND rss.resource_id = r.id
            GROUP BY r.id, r.name, ms.name
        `)).rows;

        const byResource = new Map();
        for (const row of allMainLevels) {
            if (!byResource.has(row.resource_id)) byResource.set(row.resource_id, { id: row.resource_id, name: row.name, levels: {} });
            byResource.get(row.resource_id).levels[row.main_skill] = Number(row.level);
        }

        const candidates = [];
        for (const r of byResource.values()) {
            let met = 0;
            let totalScore = 0;
            const matchedSkills = [];
            const gapSkills = [];
            for (const req of requirements) {
                const lvl = r.levels[req.mainSkill] || 0;
                const skillRow = matches.find(m => m.skill === req.mainSkill);
                const wt = skillRow ? skillRow.weight : 5;
                if (lvl >= req.minLevel) {
                    met += 1;
                    totalScore += lvl * wt;
                    matchedSkills.push({ skill: req.mainSkill, level: lvl });
                } else {
                    gapSkills.push({ skill: req.mainSkill, level: lvl, gap: req.minLevel - lvl });
                }
            }
            candidates.push({
                resource_id: r.id,
                name: r.name,
                requirements_met: met,
                requirements_total: requirements.length,
                score: totalScore,
                matched: matchedSkills,
                gaps: gapSkills,
            });
        }

        // Sort: requirements met desc, then total weighted score desc
        candidates.sort((a, b) => b.requirements_met - a.requirements_met || b.score - a.score);

        res.json({
            success: true,
            data: {
                matched_skills: matches.slice(0, 6),
                requirements,
                candidates: candidates.slice(0, 8),
            },
        });
    } catch (err) {
        console.error('insights.match error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/insights/match/ai
 * Body: { spec }
 * Runs the rule-based matcher to extract requirements + candidates, then asks
 * Claude to write a short hiring-manager-style recommendation paragraph and
 * re-rank or annotate the top candidates with reasoning.
 * Returns: { rule_based: {...}, ai_analysis: "..." } or 503 if no API key.
 */
router.post('/match/ai', async (req, res) => {
    try {
        const apiKey = await getApiKey('anthropic_api_key');
        if (!apiKey) {
            return res.status(503).json({
                success: false,
                error: 'No Anthropic API key configured. Set one in Settings.',
            });
        }
        const { spec = '' } = req.body || {};
        if (!spec || spec.length < 5) {
            return res.status(400).json({ success: false, error: 'Provide a spec' });
        }

        // Reuse the rule-based matcher by calling our own /match handler logic.
        // Cleanest: fetch the data the rule-based path produces directly.
        const ruleReq = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec }),
        };
        // Call internally rather than over HTTP
        const fakeReq = { body: { spec } };
        let ruleData;
        await new Promise((resolve) => {
            const fakeRes = {
                status: () => fakeRes,
                json: (payload) => { ruleData = payload && payload.data; resolve(); },
            };
            // Find the /match handler registered above on this router and invoke it
            const handler = router.stack
                .map(l => l.route)
                .filter(Boolean)
                .find(r => r.path === '/match');
            if (!handler) return resolve();
            handler.stack[0].handle(fakeReq, fakeRes, () => resolve());
        });

        if (!ruleData) {
            return res.status(500).json({ success: false, error: 'Rule-based matcher failed' });
        }

        // Fetch the full catalogue + team data so the AI can match synonyms /
        // domain-equivalent terms even when the rule-based path returned little.
        const catalogueRows = (await db.query(`
            SELECT ms.name AS main_name, ms.weight, ms.skill_type,
                   ARRAY_AGG(ss.name ORDER BY ss.name) FILTER (WHERE ss.name IS NOT NULL) AS subs
            FROM main_skills ms
            LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
            GROUP BY ms.id
            ORDER BY ms.skill_type, ms.name
        `)).rows;
        const catalogueText = catalogueRows.map(r =>
            `- ${r.main_name} (${r.skill_type}, weight ${r.weight}): ${(r.subs || []).join(', ') || '—'}`
        ).join('\n');

        const teamRows = (await db.query(`
            SELECT r.name, r.job_role,
                   ms.name AS main_skill,
                   COALESCE(ROUND(AVG(rss.level)::numeric)::int, 0) AS level
            FROM resources r
            CROSS JOIN main_skills ms
            LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
            LEFT JOIN resource_sub_skills rss ON rss.sub_skill_id = ss.id AND rss.resource_id = r.id
            GROUP BY r.id, r.name, r.job_role, ms.name
            ORDER BY r.name, ms.name
        `)).rows;
        const byPerson = new Map();
        for (const row of teamRows) {
            if (!byPerson.has(row.name)) byPerson.set(row.name, { role: row.job_role, skills: [] });
            if (Number(row.level) > 0) byPerson.get(row.name).skills.push(`${row.main_skill}=${row.level}`);
        }
        const teamText = Array.from(byPerson.entries())
            .map(([name, info]) => `- ${name} (${info.role || 'unknown role'}): ${info.skills.join(', ') || 'no ratings'}`)
            .join('\n');

        const reqsText = (ruleData.requirements || []).map(r =>
            `- ${r.mainSkill} ≥ ${r.minLevel}`
        ).join('\n');
        const candsText = (ruleData.candidates || []).slice(0, 8).map((c, i) =>
            `${i + 1}. ${c.name} — met ${c.requirements_met}/${c.requirements_total} requirements`
        ).join('\n');

        const prompt = `You are a delivery manager picking the right team member for a project.
You have access to the full skill catalogue and every team member's main-skill levels (0-5).

PROJECT SPEC:
"""
${spec}
"""

SKILL CATALOGUE (use this to map the spec to specific skills — apply your own
domain knowledge for synonyms, e.g. "dot1x" → "802.1x", "K8s" → "Kubernetes",
"RADIUS" → "Cisco ISE", "Prisma" → "Palo Alto Prisma"):
${catalogueText}

TEAM (each person's MAIN-skill levels, 1-5, only non-zero shown):
${teamText}

RULE-BASED MATCHER inferred these skills from the spec:
${reqsText || '(nothing)'}

RULE-BASED MATCHER top candidates:
${candsText || '(none)'}

Write a short, plain-English recommendation (≤ 200 words, no headers, no bullet salad):

1. Confirm or refine which skills the project really needs. If the rule-based
   matcher missed something obvious (synonyms, acronyms, domain shorthand),
   call that out. If the spec is too vague to map to a specific catalogue
   skill, name what you'd ask for to clarify.
2. Pick the top 1-2 people and justify each in one sentence with concrete
   levels (e.g. "Steven Johnston — L4 Security, L3 Cisco Enterprise").
3. Flag any meaningful tradeoff (e.g. sole expert / bus-factor risk).

Be direct and concrete.`;

        // Call Anthropic
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
                max_tokens: 600,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            console.error('Anthropic API error:', aiRes.status, errBody);
            return res.status(502).json({
                success: false,
                error: `Anthropic API returned ${aiRes.status}: ${errBody.slice(0, 200)}`,
            });
        }
        const aiBody = await aiRes.json();
        const analysis = (aiBody.content || [])
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n')
            .trim();

        res.json({
            success: true,
            data: {
                rule_based: ruleData,
                ai_analysis: analysis,
                model: aiBody.model,
                usage: aiBody.usage,
            },
        });
    } catch (err) {
        console.error('match/ai error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/insights/chat
 * Body: { messages: [{ role: 'user'|'assistant', content: string }, ...] }
 * Sends the team/skills/training snapshot plus the conversation to Claude and
 * returns the assistant's next reply. Used by the floating chat widget.
 * Returns: { reply, model, usage } or 503 if no API key.
 */
router.post('/chat', async (req, res) => {
    try {
        const apiKey = await getApiKey('anthropic_api_key');
        if (!apiKey) {
            return res.status(503).json({
                success: false,
                error: 'No Anthropic API key configured. Set one in Settings → AI / API Keys.',
            });
        }

        const messages = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
        const cleanMessages = messages
            .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))
            .slice(-20);

        if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
            return res.status(400).json({ success: false, error: 'Conversation must end with a user message.' });
        }

        // Snapshot the data the assistant can reason about.
        const [catalogueRows, subSkillRows, trainingsRows] = await Promise.all([
            db.query(`
                SELECT ms.name AS main_name, ms.weight, ms.skill_type,
                       ARRAY_AGG(ss.name ORDER BY ss.name) FILTER (WHERE ss.name IS NOT NULL) AS subs
                FROM main_skills ms
                LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
                GROUP BY ms.id
                ORDER BY ms.skill_type, ms.name
            `),
            // Raw per-sub-skill ratings (level > 0 only) so the assistant can
            // answer questions like "who's an expert in Cisco ISE specifically?"
            db.query(`
                SELECT r.id AS resource_id, r.name AS resource_name, r.job_role,
                       ms.name AS main_skill, ms.skill_type,
                       ss.name AS sub_skill, rss.level
                FROM resource_sub_skills rss
                JOIN sub_skills ss ON ss.id = rss.sub_skill_id
                JOIN main_skills ms ON ms.id = ss.main_skill_id
                JOIN resources r ON r.id = rss.resource_id
                WHERE rss.level > 0
                ORDER BY r.name, ms.skill_type, ms.name, ss.name
            `),
            db.query(`
                SELECT r.name AS resource_name, t.name AS training_name, t.code, t.vendor, t.category,
                       rt.status, rt.target_date, rt.completed_date, rt.expiry_date
                FROM resource_trainings rt
                JOIN resources r ON r.id = rt.resource_id
                JOIN trainings t ON t.id = rt.training_id
                ORDER BY r.name, t.name
            `).catch(() => ({ rows: [] })),
        ]);

        const catalogueText = catalogueRows.rows.map(r =>
            `- ${r.main_name} (${r.skill_type}, weight ${r.weight}): ${(r.subs || []).join(', ') || '—'}`
        ).join('\n');

        // Group sub-skill ratings by person → main skill → list of "sub=level"
        // and compute the rounded main-skill average per (person, main_skill).
        const byPerson = new Map();
        for (const row of subSkillRows.rows) {
            if (!byPerson.has(row.resource_name)) {
                byPerson.set(row.resource_name, { role: row.job_role, mains: new Map() });
            }
            const person = byPerson.get(row.resource_name);
            if (!person.mains.has(row.main_skill)) {
                person.mains.set(row.main_skill, { type: row.skill_type, subs: [] });
            }
            person.mains.get(row.main_skill).subs.push({ name: row.sub_skill, level: Number(row.level) });
        }
        const teamText = Array.from(byPerson.entries()).map(([name, info]) => {
            if (info.mains.size === 0) return `- ${name} (${info.role || 'unknown role'}): no ratings`;
            const techLines = [];
            const ntLines = [];
            for (const [main, m] of info.mains.entries()) {
                const avg = Math.round(m.subs.reduce((a, b) => a + b.level, 0) / m.subs.length);
                const subStr = m.subs.map(s => `${s.name}=${s.level}`).join(', ');
                const line = `    ${main} (main avg ${avg}): ${subStr}`;
                if (m.type === 'non-technical') ntLines.push(line);
                else techLines.push(line);
            }
            const sections = [];
            if (techLines.length) sections.push('  Technical:\n' + techLines.join('\n'));
            if (ntLines.length) sections.push('  Non-technical:\n' + ntLines.join('\n'));
            return `- ${name} (${info.role || 'unknown role'}):\n${sections.join('\n')}`;
        }).join('\n');

        const trainingsText = trainingsRows.rows.length
            ? trainingsRows.rows.map(t => {
                const parts = [`${t.resource_name} → ${t.training_name}${t.code ? ` (${t.code})` : ''}`, t.status];
                if (t.target_date) parts.push(`target ${String(t.target_date).slice(0, 10)}`);
                if (t.completed_date) parts.push(`done ${String(t.completed_date).slice(0, 10)}`);
                if (t.expiry_date) parts.push(`expires ${String(t.expiry_date).slice(0, 10)}`);
                return `- ${parts.join(', ')}`;
            }).join('\n')
            : '(no training assignments)';

        const systemPrompt = `You are the in-app assistant for a "Project Team Skills Matrix" web app. Answer the user's questions about the team, resources, skills, sub-skills, certifications, training, and project staffing. Use ONLY the snapshot below as ground truth. If the answer isn't in the data, say so plainly rather than guessing.

Skill levels: 0=none, 1=elementary, 2=basic, 3=proficient, 4=advanced, 5=expert. A "main skill" level is the rounded average of its sub-skill ratings — the snapshot below shows both.

Be concise and direct. Prefer short paragraphs or compact bullet lists. When a user asks about a specific sub-skill (e.g. "Cisco ISE", "BGP", "Kubernetes") look at the sub-skill ratings under each person's main-skill group — do NOT fall back to the main-skill average. When naming people, give concrete levels (e.g. "Steven Johnston — Cisco ISE L5"). Apply your own domain knowledge for synonyms (e.g. "dot1x" → "802.1x", "K8s" → "Kubernetes") when mapping a user's words to catalogue entries. Today's date is ${new Date().toISOString().slice(0, 10)}.

=== SKILL CATALOGUE ===
${catalogueText || '(empty)'}

=== TEAM (each person's sub-skill ratings grouped by main skill; only level > 0 shown) ===
${teamText || '(empty)'}

=== TRAINING & CERTIFICATION ASSIGNMENTS ===
${trainingsText}`;

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
                max_tokens: 800,
                system: systemPrompt,
                messages: cleanMessages,
            }),
        });
        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            console.error('Anthropic API error:', aiRes.status, errBody);
            return res.status(502).json({
                success: false,
                error: `Anthropic API returned ${aiRes.status}: ${errBody.slice(0, 200)}`,
            });
        }
        const aiBody = await aiRes.json();
        const reply = (aiBody.content || [])
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n')
            .trim();

        res.json({
            success: true,
            data: { reply, model: aiBody.model, usage: aiBody.usage },
        });
    } catch (err) {
        console.error('chat error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
