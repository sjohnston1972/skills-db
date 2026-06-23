const { test } = require('node:test');
const assert = require('node:assert');
const { resolveDepartmentId } = require('./department');

const map = { 'projects-team': 1, 'sales': 2, 'cyber': 3, 'engineering': 4 };

test('returns the id for a known slug', () => {
  assert.strictEqual(resolveDepartmentId('sales', map, 'projects-team'), 2);
});

test('falls back when slug is unknown', () => {
  assert.strictEqual(resolveDepartmentId('nope', map, 'projects-team'), 1);
});

test('falls back when slug is missing/empty', () => {
  assert.strictEqual(resolveDepartmentId(undefined, map, 'projects-team'), 1);
  assert.strictEqual(resolveDepartmentId('', map, 'projects-team'), 1);
});
