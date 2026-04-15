const {
  AppError, ValidationError, UnauthorizedError, ForbiddenError,
  NotFoundError, ConflictError, InvalidTransitionError, TextractError,
} = require('../../src/errors');

describe('Custom Error Classes', () => {
  test('AppError sets statusCode, message, code, and details', () => {
    const err = new AppError(500, 'Something broke', 'INTERNAL', { foo: 'bar' });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Something broke');
    expect(err.code).toBe('INTERNAL');
    expect(err.details).toEqual({ foo: 'bar' });
  });

  test('ValidationError returns 400 with VALIDATION_ERROR code', () => {
    const details = [{ field: 'email', message: 'Invalid' }];
    const err = new ValidationError('Bad input', details);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual(details);
  });

  test('UnauthorizedError returns 401 with default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Invalid credentials');
  });

  test('UnauthorizedError accepts custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });

  test('ForbiddenError returns 403 with default message', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('Access denied');
  });

  test('NotFoundError returns 404 with resource in message', () => {
    const err = new NotFoundError('Application');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Application not found');
  });

  test('ConflictError returns 409', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Email already exists');
  });

  test('InvalidTransitionError returns 400 with transition details', () => {
    const err = new InvalidTransitionError('approved', 'rejected');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_TRANSITION');
    expect(err.message).toBe('Cannot transition from approved to rejected');
  });

  test('TextractError returns 502 with TEXTRACT_ERROR code', () => {
    const details = { rawError: 'Textract service unavailable' };
    const err = new TextractError('Failed to analyze document', details);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('TEXTRACT_ERROR');
    expect(err.message).toBe('Failed to analyze document');
    expect(err.details).toEqual(details);
  });

  test('TextractError works without details', () => {
    const err = new TextractError('Textract timeout');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('TEXTRACT_ERROR');
    expect(err.message).toBe('Textract timeout');
    expect(err.details).toBeUndefined();
  });
});
