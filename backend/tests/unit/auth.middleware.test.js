const jwt = require('jsonwebtoken');

jest.mock('../../src/config', () => ({
  jwtAccessSecret: 'test-access-secret',
}));

const { authenticate, authorize } = require('../../src/middleware/auth');
const { UnauthorizedError, ForbiddenError } = require('../../src/errors');

/**
 * Helper: build a minimal Express req/res/next triple.
 */
function buildReqResNext(overrides = {}) {
  const req = { headers: {}, ...overrides };
  const res = {};
  const errors = [];
  const next = (err) => { if (err) errors.push(err); };
  return { req, res, next, errors };
}

const SECRET = 'test-access-secret';

describe('authenticate middleware', () => {
  it('should return 401 (UnauthorizedError) when Authorization header is missing', () => {
    const { req, res, next, errors } = buildReqResNext();

    authenticate(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnauthorizedError);
    expect(errors[0].statusCode).toBe(401);
  });

  it('should return 401 when Authorization header has no Bearer prefix', () => {
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: 'Basic abc123' },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('should return 401 for an invalid / malformed token', () => {
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: 'Bearer not-a-real-jwt' },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnauthorizedError);
    expect(errors[0].statusCode).toBe(401);
  });

  it('should return 401 for an expired token', () => {
    const token = jwt.sign(
      { sub: 'user-1', role: 'customer' },
      SECRET,
      { expiresIn: '-1s' } // already expired
    );
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnauthorizedError);
    expect(errors[0].statusCode).toBe(401);
  });

  it('should return 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ sub: 'user-1', role: 'customer' }, 'wrong-secret', { expiresIn: '15m' });
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('should attach user (sub, role) to req for a valid token and call next()', () => {
    const token = jwt.sign({ sub: 'user-42', role: 'customer' }, SECRET, { expiresIn: '15m' });
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(0);
    expect(req.user).toEqual({ sub: 'user-42', role: 'customer' });
  });

  it('should attach admin role correctly', () => {
    const token = jwt.sign({ sub: 'admin-1', role: 'admin' }, SECRET, { expiresIn: '15m' });
    const { req, res, next, errors } = buildReqResNext({
      headers: { authorization: `Bearer ${token}` },
    });

    authenticate(req, res, next);

    expect(errors).toHaveLength(0);
    expect(req.user).toEqual({ sub: 'admin-1', role: 'admin' });
  });
});

describe('authorize middleware', () => {
  it('should call next() without error when user has the required role', () => {
    const middleware = authorize('admin');
    const { req, res, next, errors } = buildReqResNext();
    req.user = { sub: 'admin-1', role: 'admin' };

    middleware(req, res, next);

    expect(errors).toHaveLength(0);
  });

  it('should return ForbiddenError (403) when user has a different role', () => {
    const middleware = authorize('admin');
    const { req, res, next, errors } = buildReqResNext();
    req.user = { sub: 'user-1', role: 'customer' };

    middleware(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(ForbiddenError);
    expect(errors[0].statusCode).toBe(403);
  });

  it('should return ForbiddenError when req.user is missing', () => {
    const middleware = authorize('admin');
    const { req, res, next, errors } = buildReqResNext();

    middleware(req, res, next);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(ForbiddenError);
  });
});
