const { ValidationError } = require('../errors');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError('Invalid request data', details);
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
