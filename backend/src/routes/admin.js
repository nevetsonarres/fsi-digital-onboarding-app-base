const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { applicationFiltersSchema, statusUpdateSchema } = require('../validators/schemas');
const onboardingService = require('../services/onboardingService');
const { ValidationError } = require('../errors');

const router = Router();

// All admin routes require authenticated admin user
router.use(authenticate);
router.use(authorize('admin'));

/**
 * Middleware factory that validates req.query against a Zod schema.
 * Parses query params (which are always strings) through z.coerce fields.
 */
function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError('Invalid query parameters', details);
    }
    req.query = result.data;
    next();
  };
}

/**
 * GET /applications/stats — Get status counts
 * MUST be defined before /applications/:id to avoid "stats" matching :id
 */
router.get('/applications/stats', async (req, res, next) => {
  try {
    const counts = await onboardingService.getStatusCounts();
    res.status(200).json(counts);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /applications — List applications (paginated, filterable by status)
 */
router.get('/applications', validateQuery(applicationFiltersSchema), async (req, res, next) => {
  try {
    const result = await onboardingService.listApplications(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /applications/:id — Get full application detail
 */
router.get('/applications/:id', async (req, res, next) => {
  try {
    const application = await onboardingService.getApplicationById(req.params.id);
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /applications/:id/status — Update application status
 */
router.patch('/applications/:id/status', validate(statusUpdateSchema), async (req, res, next) => {
  try {
    const application = await onboardingService.updateApplicationStatus(
      req.params.id,
      req.user.sub,
      req.body
    );
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
