const { pool } = require('./pool');

// Pre-hashed bcrypt password for 'Password123!' (cost factor 10)
const PASSWORD_HASH = '$2b$10$KaUM/sWtOyxqjZKx54scfOcT5aimifqezKDxgZkeYSqeOa3hPeSnK';

// Fixed UUIDs for deterministic, idempotent seeding
const USERS = {
  customer1: '11111111-1111-1111-1111-111111111111',
  customer2: '22222222-2222-2222-2222-222222222222',
  admin: '33333333-3333-3333-3333-333333333333',
  customer3: '44444444-4444-4444-4444-444444444444',
};

const APPS = {
  pending: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  approved: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  rejected: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
};

// Fixed UUIDs for application_steps (4 per app = 12 total)
const STEPS = {
  pending: [
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a101',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a102',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a103',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a104',
  ],
  approved: [
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b101',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b102',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b103',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b104',
  ],
  rejected: [
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c101',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c102',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c103',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c104',
  ],
};

// Fixed UUIDs for documents (2 per app = 6 total)
const DOCS = {
  pending: [
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d101',
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d102',
  ],
  approved: [
    'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d201',
    'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d202',
  ],
  rejected: [
    'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d301',
    'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d302',
  ],
};

// Fixed UUIDs for verification_actions
const VERIFICATIONS = {
  approved: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e101',
  rejected: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e201',
};


const ALL_SEED_USER_IDS = Object.values(USERS);

// Realistic Philippine step data
const stepDataSets = {
  pending: {
    1: {
      fullName: 'Juan Dela Cruz',
      dateOfBirth: '1990-05-15',
      nationality: 'Filipino',
      gender: 'male',
      mobileNumber: '+639171234567',
      tin: '123-456-789-012',
    },
    2: {
      streetAddress: '123 Rizal Street',
      barangay: 'Barangay San Antonio',
      cityMunicipality: 'Makati City',
      province: 'Metro Manila',
      zipCode: '1203',
    },
    3: {
      employmentStatus: 'employed',
      employerName: 'Ayala Corporation',
      occupation: 'Software Engineer',
      monthlyIncomeRange: '50000_100000',
      sourceOfFunds: 'salary',
    },
    4: {},
  },
  approved: {
    1: {
      fullName: 'Maria Santos',
      dateOfBirth: '1988-11-20',
      nationality: 'Filipino',
      gender: 'female',
      mobileNumber: '+639189876543',
      tin: '987-654-321-098',
    },
    2: {
      streetAddress: '456 Bonifacio Avenue',
      barangay: 'Barangay Poblacion',
      cityMunicipality: 'Quezon City',
      province: 'Metro Manila',
      zipCode: '1100',
    },
    3: {
      employmentStatus: 'self_employed',
      employerName: 'Santos Trading',
      occupation: 'Business Owner',
      monthlyIncomeRange: '100000_250000',
      sourceOfFunds: 'business_income',
    },
    4: {},
  },
  rejected: {
    1: {
      fullName: 'Pedro Reyes',
      dateOfBirth: '1995-03-08',
      nationality: 'Filipino',
      gender: 'male',
      mobileNumber: '+639201112233',
      tin: '111-222-333-444',
    },
    2: {
      streetAddress: '789 Mabini Road',
      barangay: 'Barangay Ermita',
      cityMunicipality: 'Manila',
      province: 'Metro Manila',
      zipCode: '1000',
    },
    3: {
      employmentStatus: 'employed',
      employerName: 'SM Investments',
      occupation: 'Accountant',
      monthlyIncomeRange: '25000_50000',
      sourceOfFunds: 'salary',
    },
    4: {},
  },
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---- Clear existing seed data (respecting FK order) ----
    await client.query(
      'DELETE FROM verification_actions WHERE application_id IN (SELECT id FROM applications WHERE user_id = ANY($1::uuid[]))',
      [ALL_SEED_USER_IDS]
    );
    await client.query(
      'DELETE FROM documents WHERE application_id IN (SELECT id FROM applications WHERE user_id = ANY($1::uuid[]))',
      [ALL_SEED_USER_IDS]
    );
    await client.query(
      'DELETE FROM application_steps WHERE application_id IN (SELECT id FROM applications WHERE user_id = ANY($1::uuid[]))',
      [ALL_SEED_USER_IDS]
    );
    await client.query('DELETE FROM applications WHERE user_id = ANY($1::uuid[])', [ALL_SEED_USER_IDS]);
    await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ALL_SEED_USER_IDS]);

    // ---- Insert users ----
    await client.query(
      `INSERT INTO users (id, email, password_hash, full_name, role) VALUES
        ($1, 'customer1@example.com', $5, 'Juan Dela Cruz', 'customer'),
        ($2, 'customer2@example.com', $5, 'Maria Santos', 'customer'),
        ($3, 'admin@example.com', $5, 'Admin Officer', 'admin'),
        ($4, 'customer3@example.com', $5, 'Pedro Reyes', 'customer')`,
      [USERS.customer1, USERS.customer2, USERS.admin, USERS.customer3, PASSWORD_HASH]
    );

    // ---- Insert applications ----
    await client.query(
      `INSERT INTO applications (id, user_id, status, submitted_at) VALUES
        ($1, $4, 'pending_verification', NOW()),
        ($2, $5, 'approved', NOW() - INTERVAL '7 days'),
        ($3, $6, 'rejected', NOW() - INTERVAL '3 days')`,
      [APPS.pending, APPS.approved, APPS.rejected, USERS.customer1, USERS.customer2, USERS.customer3]
    );

    // ---- Insert application_steps (4 per app) ----
    for (const [appKey, appId] of [['pending', APPS.pending], ['approved', APPS.approved], ['rejected', APPS.rejected]]) {
      for (let step = 1; step <= 4; step++) {
        await client.query(
          `INSERT INTO application_steps (id, application_id, step_number, step_data, is_completed)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [STEPS[appKey][step - 1], appId, step, JSON.stringify(stepDataSets[appKey][step])]
        );
      }
    }

    // ---- Insert documents (2 per app) ----
    const docInserts = [
      // Pending app docs
      [DOCS.pending[0], APPS.pending, 'government_id',
        `documents/${APPS.pending}/government_id/gov-id-pending.pdf`,
        'government_id_juan.pdf', 'application/pdf', 524288],
      [DOCS.pending[1], APPS.pending, 'proof_of_address',
        `documents/${APPS.pending}/proof_of_address/poa-pending.pdf`,
        'proof_of_address_juan.pdf', 'application/pdf', 312456],
      // Approved app docs
      [DOCS.approved[0], APPS.approved, 'government_id',
        `documents/${APPS.approved}/government_id/gov-id-approved.jpg`,
        'government_id_maria.jpg', 'image/jpeg', 1048576],
      [DOCS.approved[1], APPS.approved, 'proof_of_address',
        `documents/${APPS.approved}/proof_of_address/poa-approved.png`,
        'proof_of_address_maria.png', 'image/png', 786432],
      // Rejected app docs
      [DOCS.rejected[0], APPS.rejected, 'government_id',
        `documents/${APPS.rejected}/government_id/gov-id-rejected.pdf`,
        'government_id_pedro.pdf', 'application/pdf', 450000],
      [DOCS.rejected[1], APPS.rejected, 'proof_of_address',
        `documents/${APPS.rejected}/proof_of_address/poa-rejected.pdf`,
        'proof_of_address_pedro.pdf', 'application/pdf', 280000],
    ];

    for (const [id, appId, docType, fileKey, filename, mime, size] of docInserts) {
      await client.query(
        `INSERT INTO documents (id, application_id, document_type, file_key, original_filename, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, appId, docType, fileKey, filename, mime, size]
      );
    }

    // ---- Insert verification_actions ----
    // Approved application action
    await client.query(
      `INSERT INTO verification_actions (id, application_id, officer_id, action, reason, note)
       VALUES ($1, $2, $3, 'approved', NULL, 'All documents verified successfully')`,
      [VERIFICATIONS.approved, APPS.approved, USERS.admin]
    );

    // Rejected application action
    await client.query(
      `INSERT INTO verification_actions (id, application_id, officer_id, action, reason, note)
       VALUES ($1, $2, $3, 'rejected', 'Incomplete documentation', 'Government ID is expired')`,
      [VERIFICATIONS.rejected, APPS.rejected, USERS.admin]
    );

    await client.query('COMMIT');
    console.log('Seed completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
