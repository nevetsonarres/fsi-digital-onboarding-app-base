const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/pool');
const { ConflictError, UnauthorizedError } = require('../errors');

const BCRYPT_COST_FACTOR = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiry }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiry }
  );

  return { accessToken, refreshToken };
}

async function register({ email, password, fullName }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'customer')
     RETURNING id, role`,
    [email, passwordHash, fullName]
  );

  const user = result.rows[0];
  const { accessToken } = generateTokens(user);

  return { accessToken };
}

async function login({ email, password }) {
  const result = await db.query(
    'SELECT id, password_hash, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError();
  }

  const user = result.rows[0];
  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    throw new UnauthorizedError();
  }

  return generateTokens(user);
}

async function refreshToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const accessToken = jwt.sign(
    { sub: payload.sub, role: payload.role },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiry }
  );

  return { accessToken };
}

module.exports = {
  register,
  login,
  refreshToken,
  hashPassword,
  verifyPassword,
  generateTokens,
};
