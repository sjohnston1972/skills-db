// Pure string logic behind POST /api/insights/match: spec normalisation,
// synonym alias rewriting, and skill scoring. Extracted from routes/insights.js
// so it can be unit-tested without a database.

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

// Common English filler that creates false positives (e.g. "and"
// would match a sub-skill containing "and").
const STOPWORDS = new Set([
    'and','or','the','for','with','a','an','to','of','in','on','at','as','be','is',
    'are','was','were','this','that','these','those','it','its','our','their','from',
    'we','you','i','need','want','someone','engineer','engineers','team','project',
]);

// Normalise: lowercase, non-alphanumeric → space, collapse runs.
const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Normalise a spec and apply alias substitutions, then re-normalise because
// aliases can introduce punctuation (e.g. "802.1x").
function normaliseSpec(spec) {
    let normSpec = normalise(spec);
    for (const [alias, canonical] of Object.entries(ALIASES)) {
        const re = new RegExp('(^|\\s)' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)', 'g');
        normSpec = normSpec.replace(re, `$1${canonical}$2`);
    }
    return normalise(normSpec);
}

/**
 * Score catalogue skills against a normalised spec.
 * @param {string} normSpec output of normaliseSpec()
 * @param {Array<{id, name, weight, skill_type, sub_names}>} skillRows
 * @returns {Array<{skill_id, skill, weight, type, hits, matched_terms}>}
 */
function scoreSkillsAgainstSpec(normSpec, skillRows) {
    const specWords = new Set(normSpec.split(' ').filter(Boolean));

    // Helper: does the normalised spec contain a phrase (sequence of whole words)?
    // Built with leading/trailing space so substring inclusion is word-bounded.
    const paddedSpec = ' ' + normSpec + ' ';
    const phraseInSpec = (phrase) => paddedSpec.includes(' ' + phrase + ' ');

    const matches = [];
    for (const sk of skillRows) {
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
    return matches;
}

module.exports = { ALIASES, STOPWORDS, normalise, normaliseSpec, scoreSkillsAgainstSpec };
