const jwt = require('jsonwebtoken');

// Mock dependencies before requiring the module
jest.mock('../../src/db/pool', () => ({
  query: jest.fn(),
}));

jest.mock('../../src/config', () => ({
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtAccessExpiry: '15m',
  jwtRefreshExpiry: '7d',
}));

const db = require('../../src/db/pool');
const config = require('../../src/config');
const authService = require('../../src/services/authService');
const { ConflictError, UnauthorizedError } = require('../../src/errors');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword / verifyPassword', () => {
    it('should hash a password and verify it correctly', async () => {
      const password = 'SecureP@ss123';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await authService.verifyPassword(password, hash)).toBe(true);
    });

    it('should return false for a wrong password', async () => {
      const hash = await authService.hashPassword('correct-password');
      expect(await authService.verifyPassword('wrong-password', hash)).toBe(false);
    });

    it('should produce a bcrypt hash with cost factor >= 10', async () => {
      const hash = await authService.hashPassword('test');
      // bcrypt hash format: $2b$<cost>$...
      const costFactor = parseInt(hash.split('$')[2], 10);
      expect(costFactor).toBeGreaterThanOrEqual(10);
    });
  });

  describe('generateTokens', () => {
    it('should return accessToken and refreshToken with correct claims', () => {
      const user = { id: '550e8400-e29b-41d4-a716-446655440000', role: 'customer' };
      const tokens = authService.generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');

      const accessPayload = jwt.verify(tokens.accessToken, config.jwtAccessSecret);
      expect(accessPayload.sub).toBe(user.id);
      expect(accessPayload.role).toBe(user.role);

      const refreshPayload = jwt.verify(tokens.refreshToken, config.jwtRefreshSecret);
      expect(refreshPayload.sub).toBe(user.id);
      expect(refreshPayload.role).toBe(user.role);
    });

    it('should work for admin role', () => {
      const user = { id: 'admin-uuid', role: 'admin' };
      const tokens = authService.generateTokens(user);

      const payload = jwt.verify(tokens.accessToken, config.jwtAccessSecret);
      expect(payload.role).toBe('admin');
    });
  });

  describe('register', () => {
    it('should create a user and return an accessToken', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) // no existing user
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id', role: 'customer' }] }); // insert

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      const payload = jwt.verify(result.accessToken, config.jwtAccessSecret);
      expect(payload.sub).toBe('new-user-id');
      expect(payload.role).toBe('customer');

      // Verify the INSERT query used a bcrypt hash, not the plaintext password
      const insertCall = db.query.mock.calls[1];
      expect(insertCall[1][1]).not.toBe('Password123');
    });

    it('should throw ConflictError for duplicate email', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      await expect(
        authService.register({ email: 'dup@example.com', password: 'pass1234', fullName: 'Dup' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('CorrectPass1', 10);

      db.query.mockResolvedValueOnce({
        rows: [{ id: 'user-id', password_hash: hash, role: 'customer' }],
      });

      const result = await authService.login({ email: 'user@example.com', password: 'CorrectPass1' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedError for non-existent email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'anything' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('RealPassword', 10);

      db.query.mockResolvedValueOnce({
        rows: [{ id: 'user-id', password_hash: hash, role: 'customer' }],
      });

      await expect(
        authService.login({ email: 'user@example.com', password: 'WrongPassword' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should return identical error for wrong email and wrong password', async () => {
      // Wrong email
      db.query.mockResolvedValueOnce({ rows: [] });
      let emailError;
      try {
        await authService.login({ email: 'wrong@example.com', password: 'pass' });
      } catch (e) {
        emailError = e;
      }

      // Wrong password
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('correct', 10);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'uid', password_hash: hash, role: 'customer' }],
      });
      let passError;
      try {
        await authService.login({ email: 'real@example.com', password: 'wrong' });
      } catch (e) {
        passError = e;
      }

      expect(emailError.message).toBe(passError.message);
      expect(emailError.statusCode).toBe(passError.statusCode);
      expect(emailError.code).toBe(passError.code);
    });
  });

  describe('refreshToken', () => {
    it('should return a new accessToken for a valid refresh token', async () => {
      const token = jwt.sign(
        { sub: 'user-id', role: 'customer' },
        config.jwtRefreshSecret,
        { expiresIn: '7d' }
      );

      const result = await authService.refreshToken(token);

      expect(result).toHaveProperty('accessToken');
      const payload = jwt.verify(result.accessToken, config.jwtAccessSecret);
      expect(payload.sub).toBe('user-id');
      expect(payload.role).toBe('customer');
    });

    it('should throw UnauthorizedError for an invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for a token signed with wrong secret', async () => {
      const token = jwt.sign({ sub: 'uid', role: 'customer' }, 'wrong-secret', { expiresIn: '7d' });
      await expect(authService.refreshToken(token)).rejects.toThrow(UnauthorizedError);
    });
  });
});
