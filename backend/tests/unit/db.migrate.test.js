jest.mock('../../src/config', () => ({
  databaseUrl: 'postgresql://test:test@localhost:5432/testdb',
}));

const mockClient = {
  query: jest.fn().mockResolvedValue({}),
  release: jest.fn(),
};

jest.mock('../../src/db/pool', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
  },
}));

const { migrate } = require('../../src/db/migrate');

describe('db/migrate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockResolvedValue({});
  });

  it('runs all table creation queries inside a transaction', async () => {
    await migrate();

    const calls = mockClient.query.mock.calls.map(([sql]) => sql.trim());

    // BEGIN + 5 CREATE TABLE + COMMIT = 7 calls
    expect(calls).toHaveLength(7);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[6]).toBe('COMMIT');
  });

  it('creates users table with correct constraints', async () => {
    await migrate();
    const sql = mockClient.query.mock.calls[1][0];

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    expect(sql).toContain('email VARCHAR(255) UNIQUE NOT NULL');
    expect(sql).toContain("CHECK (role IN ('customer', 'admin'))");
  });

  it('creates applications table with UNIQUE user_id', async () => {
    await migrate();
    const sql = mockClient.query.mock.calls[2][0];

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS applications');
    expect(sql).toContain('user_id UUID UNIQUE NOT NULL REFERENCES users(id)');
    expect(sql).toContain("DEFAULT 'draft'");
  });

  it('creates application_steps with composite unique constraint', async () => {
    await migrate();
    const sql = mockClient.query.mock.calls[3][0];

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS application_steps');
    expect(sql).toContain('CHECK (step_number BETWEEN 1 AND 4)');
    expect(sql).toContain('UNIQUE (application_id, step_number)');
  });

  it('creates documents with composite unique constraint', async () => {
    await migrate();
    const sql = mockClient.query.mock.calls[4][0];

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS documents');
    expect(sql).toContain("CHECK (document_type IN ('government_id', 'proof_of_address'))");
    expect(sql).toContain('UNIQUE (application_id, document_type)');
  });

  it('creates verification_actions with foreign keys', async () => {
    await migrate();
    const sql = mockClient.query.mock.calls[5][0];

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS verification_actions');
    expect(sql).toContain('application_id UUID NOT NULL REFERENCES applications(id)');
    expect(sql).toContain('officer_id UUID NOT NULL REFERENCES users(id)');
  });

  it('rolls back on error and rethrows', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('SQL error'));

    await expect(migrate()).rejects.toThrow('SQL error');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
