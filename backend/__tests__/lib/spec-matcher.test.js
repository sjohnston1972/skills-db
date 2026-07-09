const { normaliseSpec, scoreSkillsAgainstSpec } = require('../../lib/spec-matcher');

const skillRow = (name, subs = [], extra = {}) => ({
    id: `id-${name}`,
    name,
    weight: 5,
    skill_type: 'technical',
    sub_names: subs,
    ...extra,
});

describe('normaliseSpec', () => {
    test('rewrites aliases to canonical catalogue phrases (dot1x -> 802 1x)', () => {
        // "802.1x" is itself re-normalised: the dot becomes a space.
        expect(normaliseSpec('we need dot1x rollout')).toBe('we need 802 1x rollout');
    });

    test('lowercases and strips punctuation', () => {
        expect(normaliseSpec('K8s, please!')).toBe('kubernetes please');
    });

    test('aliases containing regex-special characters do not throw', () => {
        // "sd wan" alias includes a space; canonical "802.1x" includes a dot.
        expect(() => normaliseSpec('sd wan and 8021x (urgent)')).not.toThrow();
        expect(normaliseSpec('sdwan')).toBe('sd wan');
    });
});

describe('scoreSkillsAgainstSpec', () => {
    test('whole-phrase match scores 2, single-word match scores 1', () => {
        const spec = normaliseSpec('need azure networking experience');
        const rows = [
            skillRow('Azure Networking'),            // whole phrase in spec -> 2
            skillRow('Cisco Networking Fundamentals'), // only "networking" -> 1
        ];
        const matches = scoreSkillsAgainstSpec(spec, rows);
        expect(matches.find(m => m.skill === 'Azure Networking').hits).toBe(2);
        expect(matches.find(m => m.skill === 'Cisco Networking Fundamentals').hits).toBe(1);
    });

    test('stopword-only specs match nothing', () => {
        const spec = normaliseSpec('we need someone for the project');
        const rows = [skillRow('Project Management', ['Planning and Scheduling'])];
        expect(scoreSkillsAgainstSpec(spec, rows)).toEqual([]);
    });

    test('alias rewriting lets shorthand hit catalogue skills', () => {
        const spec = normaliseSpec('rollout of dot1x on campus switches');
        const rows = [skillRow('Cisco ISE', ['802.1x'])];
        const matches = scoreSkillsAgainstSpec(spec, rows);
        // sub-skill "802.1x" normalises to "802 1x" which appears as a phrase.
        expect(matches).toHaveLength(1);
        expect(matches[0].matched_terms).toContain('802.1x');
    });

    test('null sub_names are tolerated', () => {
        const spec = normaliseSpec('kubernetes migration');
        const rows = [skillRow('Kubernetes', null)];
        expect(scoreSkillsAgainstSpec(spec, rows)[0].hits).toBe(2);
    });
});
