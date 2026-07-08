const { csvCell } = require('../../lib/csv');

describe('csvCell', () => {
    test('null and undefined become empty string', () => {
        expect(csvCell(null)).toBe('');
        expect(csvCell(undefined)).toBe('');
    });

    test('embedded quotes are doubled and wrapped', () => {
        expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    });

    test('commas and newlines are wrapped', () => {
        expect(csvCell('a,b')).toBe('"a,b"');
        expect(csvCell('a\nb')).toBe('"a\nb"');
    });

    test('plain strings and numbers are untouched', () => {
        expect(csvCell('plain')).toBe('plain');
        expect(csvCell(42)).toBe('42');
    });
});
