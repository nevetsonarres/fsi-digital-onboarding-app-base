class AppError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(401, message, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(409, message, 'CONFLICT');
  }
}

class InvalidTransitionError extends AppError {
  constructor(currentStatus, targetStatus) {
    super(400, `Cannot transition from ${currentStatus} to ${targetStatus}`, 'INVALID_TRANSITION');
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InvalidTransitionError,
};
