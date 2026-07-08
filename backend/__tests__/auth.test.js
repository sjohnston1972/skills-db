// middleware/auth.js — HTPASSWD_FILE is pointed at the fixture by setup-env.js.
const { parseBasicAuth, verifyAdminAuth } = require('../middleware/auth');

const basic = (user, pass) =>
    'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

function run(headers) {
    const req = { headers };
    const res = {
        statusCode: null,
        body: null,
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
    };
    let nexted = false;
    verifyAdminAuth(req, res, () => { nexted = true; });
    return { req, res, nexted };
}

describe('parseBasicAuth', () => {
    test('decodes username and password', () => {
        expect(parseBasicAuth({ headers: { authorization: basic('alice', 'p:w') } }))
            .toEqual({ username: 'alice', password: 'p:w' });
    });

    test('rejects missing or non-Basic headers', () => {
        expect(parseBasicAuth({ headers: {} })).toBeNull();
        expect(parseBasicAuth({ headers: { authorization: 'Bearer x' } })).toBeNull();
    });
});

describe('verifyAdminAuth', () => {
    test('401 without an Authorization header', () => {
        const { res, nexted } = run({});
        expect(res.statusCode).toBe(401);
        expect(nexted).toBe(false);
    });

    test('401 for a username not present in .htpasswd', () => {
        const { res, nexted } = run({ authorization: basic('ghost', 'x') });
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Unknown user');
        expect(nexted).toBe(false);
    });

    test('passes for a known user and records req.authUser', () => {
        const { req, res, nexted } = run({ authorization: basic('testadmin', 'whatever') });
        expect(nexted).toBe(true);
        expect(res.statusCode).toBeNull();
        expect(req.authUser).toBe('testadmin');
    });
});
