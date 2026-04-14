const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../errors');

/**
 * Express middleware that verifies a JWT from the Authorization header
 * and attaches the decoded payload to req.user.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed token'));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret);
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Middleware factory that checks whether the authenticated user
 * has the required role.
 * @param {string} role - The required role (e.g. 'admin')
 * @returns {Function} Express middleware
 */
function authorize(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new ForbiddenError());
    }
    next();
  };
}

module.exports = { authenticate, authorize };
