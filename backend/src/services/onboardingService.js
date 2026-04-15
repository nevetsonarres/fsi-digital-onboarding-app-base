const db = require('../db/pool');
const { NotFoundError, ConflictError, ValidationError, InvalidTransitionError } = require('../errors');

/**
 * Get or create an application for a customer.
 * Enforces one active application per customer.
 * @param {string} userId
 * @returns {Promise<{ id: string, status: string }>}
 */
async function getOrCreateApplication(userId) {
  const existing = await db.query(
    'SELECT id, status FROM applications WHERE user_id = $1',
    [userId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await db.query(
    `INSERT INTO applications (user_id) VALUES ($1) RETURNING id, status`,
    [userId]
  );
  return result.rows[0];
}

/**
 * Save (upsert) step data for a given step number.
 * @param {string} userId
 * @param {number} stepNumber - 1 to 4
 * @param {object} data - Step form data
 */
async function saveStepData(userId, stepNumber, data) {
  const app = await getOrCreateApplication(userId);

  await db.query(
    `INSERT INTO application_steps (application_id, step_number, step_data, is_completed, updated_at)
     VALUES ($1, $2, $3, TRUE, NOW())
     ON CONFLICT (application_id, step_number)
     DO UPDATE SET step_data = $3, is_completed = TRUE, updated_at = NOW()`,
    [app.id, stepNumber, JSON.stringify(data)]
  );
}

/**
 * Retrieve saved step data for a given step number.
 * @param {string} userId
 * @param {number} stepNumber
 * @returns {Promise<object|null>}
 */
async function getStepData(userId, stepNumber) {
  const app = await db.query(
    'SELECT id FROM applications WHERE user_id = $1',
    [userId]
  );

  if (app.rows.length === 0) {
    return null;
  }

  const result = await db.query(
    'SELECT step_data, is_completed FROM application_steps WHERE application_id = $1 AND step_number = $2',
    [app.rows[0].id, stepNumber]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].step_data;
}

/**
 * Submit a completed application.
 * Verifies all 4 steps are complete and documents are uploaded.
 * @param {string} userId
 * @returns {Promise<object>} The submitted application
 */
async function submitApplication(userId) {
  const appResult = await db.query(
    'SELECT id, status FROM applications WHERE user_id = $1',
    [userId]
  );

  if (appResult.rows.length === 0) {
    throw new NotFoundError('Application');
  }

  const app = appResult.rows[0];

  // Only draft or not-yet-submitted applications can be submitted
  if (app.status !== 'draft') {
    throw new ConflictError('Application has already been submitted');
  }

  // Check all 4 steps are completed
  const steps = await db.query(
    'SELECT step_number, is_completed FROM application_steps WHERE application_id = $1 ORDER BY step_number',
    [app.id]
  );

  const completedSteps = new Set(
    steps.rows.filter((s) => s.is_completed).map((s) => s.step_number)
  );
  const missingSteps = [1, 2, 3, 4].filter((n) => !completedSteps.has(n));

  if (missingSteps.length > 0) {
    throw new ValidationError('Application has incomplete steps', {
      missingSteps,
    });
  }

  // Check documents are uploaded (both government_id and proof_of_address)
  const docs = await db.query(
    'SELECT document_type FROM documents WHERE application_id = $1',
    [app.id]
  );
  const uploadedTypes = new Set(docs.rows.map((d) => d.document_type));
  const missingDocs = ['government_id', 'proof_of_address'].filter(
    (t) => !uploadedTypes.has(t)
  );

  if (missingDocs.length > 0) {
    throw new ValidationError('Missing required documents', {
      missingDocuments: missingDocs,
    });
  }

  // Submit: set status and timestamp
  const result = await db.query(
    `UPDATE applications
     SET status = 'pending_verification', submitted_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [app.id]
  );

  return result.rows[0];
}

/**
 * Get the current customer's application with steps and documents.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getApplication(userId) {
  const appResult = await db.query(
    'SELECT * FROM applications WHERE user_id = $1',
    [userId]
  );

  if (appResult.rows.length === 0) {
    return null;
  }

  const app = appResult.rows[0];

  const steps = await db.query(
    'SELECT step_number, step_data, is_completed FROM application_steps WHERE application_id = $1 ORDER BY step_number',
    [app.id]
  );

  const docs = await db.query(
    'SELECT id, document_type, file_key, original_filename, mime_type, file_size, uploaded_at FROM documents WHERE application_id = $1',
    [app.id]
  );

  return {
    ...app,
    steps: steps.rows,
    documents: docs.rows,
  };
}

/**
 * List applications with pagination and optional status filter.
 * @param {object} filters - { status?: string, page: number, limit: number }
 * @returns {Promise<{ applications: object[], total: number, page: number, limit: number }>}
 */
async function listApplications(filters) {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let countQuery = 'SELECT COUNT(*) FROM applications a JOIN users u ON a.user_id = u.id WHERE a.status != \'draft\'';
  let dataQuery = `SELECT a.id, a.user_id, a.status, a.submitted_at, a.created_at, a.updated_at,
    u.full_name AS applicant_name
    FROM applications a JOIN users u ON a.user_id = u.id WHERE a.status != 'draft'`;

  const params = [];
  if (status) {
    countQuery += ' AND a.status = $1';
    dataQuery += ' AND a.status = $1';
    params.push(status);
  }

  dataQuery += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await db.query(dataQuery, [...params, limit, offset]);

  return {
    applications: dataResult.rows,
    total,
    page,
    limit,
  };
}

/**
 * Get full application detail by ID, including steps, documents, and user info.
 * @param {string} applicationId
 * @returns {Promise<object>}
 */
async function getApplicationById(applicationId) {
  const appResult = await db.query(
    `SELECT a.*, u.full_name AS applicant_name, u.email AS applicant_email
     FROM applications a JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (appResult.rows.length === 0) {
    throw new NotFoundError('Application');
  }

  const app = appResult.rows[0];

  const steps = await db.query(
    'SELECT step_number, step_data, is_completed FROM application_steps WHERE application_id = $1 ORDER BY step_number',
    [applicationId]
  );

  const docs = await db.query(
    'SELECT id, document_type, file_key, original_filename, mime_type, file_size, uploaded_at FROM documents WHERE application_id = $1',
    [applicationId]
  );

  return {
    ...app,
    steps: steps.rows,
    documents: docs.rows,
  };
}

/**
 * Update application status (admin verification action).
 * Only allows transitions from `pending_verification`.
 * @param {string} applicationId
 * @param {string} officerId
 * @param {object} update - { status: string, reason?: string, note?: string }
 * @returns {Promise<object>} The updated application
 */
async function updateApplicationStatus(applicationId, officerId, update) {
  const appResult = await db.query(
    'SELECT id, status FROM applications WHERE id = $1',
    [applicationId]
  );

  if (appResult.rows.length === 0) {
    throw new NotFoundError('Application');
  }

  const app = appResult.rows[0];

  if (app.status !== 'pending_verification') {
    throw new InvalidTransitionError(app.status, update.status);
  }

  await db.query(
    `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2`,
    [update.status, applicationId]
  );

  await db.query(
    `INSERT INTO verification_actions (application_id, officer_id, action, reason, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [applicationId, officerId, update.status, update.reason || null, update.note || null]
  );

  return getApplicationById(applicationId);
}

/**
 * Get count of applications per status.
 * @returns {Promise<object>} e.g. { pending_verification: 5, approved: 3, ... }
 */
async function getStatusCounts() {
  const result = await db.query(
    "SELECT status, COUNT(*)::int AS count FROM applications WHERE status != 'draft' GROUP BY status"
  );

  const counts = {};
  for (const row of result.rows) {
    counts[row.status] = row.count;
  }
  return counts;
}

module.exports = {
  getOrCreateApplication,
  saveStepData,
  getStepData,
  submitApplication,
  getApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  getStatusCounts,
};
