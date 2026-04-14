const { Pool } = require('pg');

jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const mockPool = { query: mockQuery };
  return { Pool: jest.fn(() => mockPool) };
});

jest.mock('../../src/config', () => ({
  databaseUrl: 'postgresql://test:test@localhost:5432/testdb',
}));

const { pool, query } = require('../../src/db/pool');

describe('db/pool', () => {
  it('creates a Pool with the DATABASE_URL from config', () => {
    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://test:test@localhost:5432/testdb',
    });
  });

  it('query delegates to pool.query with text and params', async () => {
    const result = await query('SELECT $1::text AS name', ['hello']);
    expect(pool.query).toHaveBeenCalledWith('SELECT $1::text AS name', ['hello']);
    expect(result).toEqual({ rows: [], rowCount: 0 });
  });
});
