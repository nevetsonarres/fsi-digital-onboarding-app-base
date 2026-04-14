const logger = require('../utils/logger');
const { AppError } = require('../errors');

function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn({ correlationId, error: err.code, message: err.message });
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details || undefined,
      correlationId,
    });
  }

  logger.error({ correlationId, error: 'INTERNAL_ERROR', stack: err.stack });
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    correlationId,
  });
}

module.exports = errorHandler;
