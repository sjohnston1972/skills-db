const { calculateMainSkillLevel } = require('../../lib/skill-levels');

describe('calculateMainSkillLevel', () => {
    test('empty or missing sub-skills give 0', () => {
        expect(calculateMainSkillLevel({})).toBe(0);
        expect(calculateMainSkillLevel(null)).toBe(0);
        expect(calculateMainSkillLevel(undefined)).toBe(0);
    });

    test('rounds the average (3.5 -> 4)', () => {
        expect(calculateMainSkillLevel({ a: 3, b: 4 })).toBe(4);
    });

    test('single value passes through', () => {
        expect(calculateMainSkillLevel({ only: 5 })).toBe(5);
        expect(calculateMainSkillLevel({ only: 0 })).toBe(0);
    });
});
