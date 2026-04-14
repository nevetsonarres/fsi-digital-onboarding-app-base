const request = require('supertest');
const app = require('../../src/app');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/authService');

// Silence Winston during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Auth Routes', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      email: 'test@example.com',
      password: 'securepass1',
      fullName: 'Juan Dela Cruz',
    };

    it('returns 201 with accessToken for valid data', async () => {
      authService.register.mockResolvedValue({ accessToken: 'tok_abc' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken', 'tok_abc');
      expect(authService.register).toHaveBeenCalledWith(validPayload);
    });

    it('returns 400 for invalid data (missing email)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'securepass1', fullName: 'Juan' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('returns 400 for invalid data (short password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'a@b.com', password: 'short', fullName: 'Juan' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const validPayload = {
      email: 'test@example.com',
      password: 'securepass1',
    };

    it('returns 200 with tokens for valid credentials', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'tok_access',
        refreshToken: 'tok_refresh',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken', 'tok_access');
      expect(res.body).toHaveProperty('refreshToken', 'tok_refresh');
      expect(authService.login).toHaveBeenCalledWith(validPayload);
    });

    it('returns 400 for invalid data (bad email format)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'securepass1' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    it('returns 400 for invalid data (missing password)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 200 with new accessToken for valid refresh token', async () => {
      authService.refreshToken.mockResolvedValue({ accessToken: 'tok_new' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid_refresh_tok' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken', 'tok_new');
      expect(authService.refreshToken).toHaveBeenCalledWith('valid_refresh_tok');
    });

    it('returns 401 for invalid refresh token', async () => {
      const { UnauthorizedError } = require('../../src/errors');
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedError('Invalid or expired refresh token')
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'bad_token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
    });
  });
});
