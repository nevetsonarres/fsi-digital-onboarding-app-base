const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const correlationId = require('./middleware/correlationId');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Helmet — security headers
app.use(helmet());

// 2. CORS — allow frontend origin
app.use(cors({ origin: config.frontendOrigin }));

// 3. Rate limiter — 100 req / 15 min per IP
app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
}));

// 4. Correlation ID
app.use(correlationId);

// 5. Request logger
app.use(requestLogger);

// 6. Body parser
app.use(express.json());

// --- Routes ---
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);

// 7. Global error handler (must be last)
app.use(errorHandler);

// Start server when run directly (not imported for testing)
if (require.main === module) {
  const port = config.port || 3000;
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

module.exports = app;
