module.exports = {
    testEnvironment: 'node',
    // Default DB/htpasswd env vars for tests (set only when unset, so CI can override).
    setupFiles: ['<rootDir>/backend/__tests__/setup-env.js'],
    // Creates role + schema + migrations in the test database once per run.
    globalSetup: '<rootDir>/backend/__tests__/global-setup.js',
    testMatch: ['**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
};
