const {
  registerSchema,
  loginSchema,
  personalInfoSchema,
  addressSchema,
  employmentSchema,
  statusUpdateSchema,
  applicationFiltersSchema,
} = require('../../src/validators/schemas');

describe('registerSchema', () => {
  test('accepts valid data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Juan Dela Cruz',
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      fullName: 'Juan',
    });
    expect(result.success).toBe(false);
  });

  test('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      fullName: 'Juan',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  test('accepts valid data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'x',
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('personalInfoSchema', () => {
  const valid = {
    fullName: 'Juan Dela Cruz',
    dateOfBirth: '1990-01-15',
    nationality: 'Filipino',
    gender: 'male',
    mobileNumber: '+639171234567',
    tin: '123-456-789-012',
  };

  test('accepts valid data', () => {
    expect(personalInfoSchema.safeParse(valid).success).toBe(true);
  });

  test('accepts mobile starting with 0', () => {
    expect(personalInfoSchema.safeParse({ ...valid, mobileNumber: '09171234567' }).success).toBe(true);
  });

  test('rejects invalid mobile format', () => {
    expect(personalInfoSchema.safeParse({ ...valid, mobileNumber: '1234567890' }).success).toBe(false);
  });

  test('rejects invalid TIN format', () => {
    expect(personalInfoSchema.safeParse({ ...valid, tin: '123456789012' }).success).toBe(false);
  });

  test('rejects invalid date format', () => {
    expect(personalInfoSchema.safeParse({ ...valid, dateOfBirth: '01/15/1990' }).success).toBe(false);
  });

  test('rejects invalid gender', () => {
    expect(personalInfoSchema.safeParse({ ...valid, gender: 'unknown' }).success).toBe(false);
  });
});

describe('addressSchema', () => {
  const valid = {
    streetAddress: '123 Rizal St',
    barangay: 'San Antonio',
    cityMunicipality: 'Makati',
    province: 'Metro Manila',
    zipCode: '1234',
  };

  test('accepts valid data', () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });

  test('rejects invalid ZIP code (not 4 digits)', () => {
    expect(addressSchema.safeParse({ ...valid, zipCode: '123' }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, zipCode: '12345' }).success).toBe(false);
  });
});

describe('employmentSchema', () => {
  const valid = {
    employmentStatus: 'employed',
    occupation: 'Engineer',
    monthlyIncomeRange: '50000_100000',
    sourceOfFunds: 'salary',
  };

  test('accepts valid data', () => {
    expect(employmentSchema.safeParse(valid).success).toBe(true);
  });

  test('accepts optional employerName', () => {
    expect(employmentSchema.safeParse({ ...valid, employerName: 'Acme Corp' }).success).toBe(true);
  });

  test('rejects invalid employment status', () => {
    expect(employmentSchema.safeParse({ ...valid, employmentStatus: 'freelance' }).success).toBe(false);
  });

  test('rejects invalid income range', () => {
    expect(employmentSchema.safeParse({ ...valid, monthlyIncomeRange: 'a_lot' }).success).toBe(false);
  });
});

describe('statusUpdateSchema', () => {
  test('accepts approved without reason', () => {
    const result = statusUpdateSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  test('accepts rejected with reason', () => {
    const result = statusUpdateSchema.safeParse({ status: 'rejected', reason: 'Incomplete docs' });
    expect(result.success).toBe(true);
  });

  test('rejects rejected without reason', () => {
    const result = statusUpdateSchema.safeParse({ status: 'rejected' });
    expect(result.success).toBe(false);
  });

  test('accepts flagged with note', () => {
    const result = statusUpdateSchema.safeParse({ status: 'flagged_branch_visit', note: 'Needs visit' });
    expect(result.success).toBe(true);
  });
});

describe('applicationFiltersSchema', () => {
  test('accepts empty object with defaults', () => {
    const result = applicationFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
  });

  test('coerces string page/limit to numbers', () => {
    const result = applicationFiltersSchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(3);
    expect(result.data.limit).toBe(50);
  });

  test('rejects page less than 1', () => {
    expect(applicationFiltersSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  test('rejects limit over 100', () => {
    expect(applicationFiltersSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  test('accepts valid status filter', () => {
    const result = applicationFiltersSchema.safeParse({ status: 'pending_verification' });
    expect(result.success).toBe(true);
  });

  test('rejects invalid status filter', () => {
    expect(applicationFiltersSchema.safeParse({ status: 'invalid' }).success).toBe(false);
  });
});
