const {
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  getStatusCounts,
} = require('../../src/services/onboardingService');

jest.mock('../../src/db/pool', () => ({
  query: jest.fn(),
}));

const db = require('../../src/db/pool');
const { NotFoundError, InvalidTransitionError } = require('../../src/errors');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listApplications', () => {
  it('returns paginated applications without status filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 'app-1', status: 'pending_verification', applicant_name: 'Alice' },
          { id: 'app-2', status: 'approved', applicant_name: 'Bob' },
        ],
      });

    const result = await listApplications({ page: 1, limit: 20 });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.applications).toHaveLength(2);
    // Count query should exclude draft applications
    expect(db.query.mock.calls[0][0]).toContain("status != 'draft'");
  });

  it('filters by status when provided', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 'app-1', status: 'approved', applicant_name: 'Bob' }],
      });

    const result = await listApplications({ status: 'approved', page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.applications).toHaveLength(1);
    expect(db.query.mock.calls[0][0]).toContain('AND a.status = $1');
    expect(db.query.mock.calls[0][1]).toEqual(['approved']);
  });

  it('calculates correct offset for page 2', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '25' }] })
      .mockResolvedValueOnce({ rows: [] });

    await listApplications({ page: 2, limit: 10 });

    // Data query params: [limit, offset]
    const dataParams = db.query.mock.calls[1][1];
    expect(dataParams).toEqual([10, 10]);
  });
});

describe('getApplicationById', () => {
  it('returns full application with steps and documents', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 'app-1', user_id: 'u-1', status: 'pending_verification', applicant_name: 'Alice', applicant_email: 'alice@test.com' }],
      })
      .mockResolvedValueOnce({ rows: [{ step_number: 1, step_data: {}, is_completed: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'doc-1', document_type: 'government_id' }] });

    const result = await getApplicationById('app-1');

    expect(result.id).toBe('app-1');
    expect(result.applicant_name).toBe('Alice');
    expect(result.steps).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
  });

  it('throws NotFoundError when application does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(getApplicationById('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

describe('updateApplicationStatus', () => {
  const mockGetAppById = (status = 'pending_verification') => {
    // First call: fetch app for status check
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'app-1', status }],
    });
  };

  it('updates status from pending_verification and records verification action', async () => {
    mockGetAppById('pending_verification');
    // UPDATE applications
    db.query.mockResolvedValueOnce({ rows: [] });
    // INSERT verification_actions
    db.query.mockResolvedValueOnce({ rows: [] });
    // getApplicationById calls (SELECT app, SELECT steps, SELECT docs)
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 'app-1', status: 'approved', applicant_name: 'Alice', applicant_email: 'a@b.com' }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await updateApplicationStatus('app-1', 'officer-1', {
      status: 'approved',
      note: 'Looks good',
    });

    expect(result.status).toBe('approved');
    // Verify INSERT into verification_actions
    const insertCall = db.query.mock.calls[2];
    expect(insertCall[0]).toContain('verification_actions');
    expect(insertCall[1]).toEqual(['app-1', 'officer-1', 'approved', null, 'Looks good']);
  });

  it('throws NotFoundError when application does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      updateApplicationStatus('nonexistent', 'officer-1', { status: 'approved' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when status is not pending_verification', async () => {
    mockGetAppById('approved');

    await expect(
      updateApplicationStatus('app-1', 'officer-1', { status: 'rejected', reason: 'test' })
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('records reason for rejection', async () => {
    mockGetAppById('pending_verification');
    db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE
    db.query.mockResolvedValueOnce({ rows: [] }); // INSERT verification_actions
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 'app-1', status: 'rejected', applicant_name: 'Alice', applicant_email: 'a@b.com' }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await updateApplicationStatus('app-1', 'officer-1', {
      status: 'rejected',
      reason: 'Incomplete documents',
    });

    const insertCall = db.query.mock.calls[2];
    expect(insertCall[1][3]).toBe('Incomplete documents');
  });
});

describe('getStatusCounts', () => {
  it('returns counts grouped by status', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { status: 'pending_verification', count: 5 },
        { status: 'approved', count: 3 },
        { status: 'rejected', count: 1 },
      ],
    });

    const result = await getStatusCounts();

    expect(result).toEqual({
      pending_verification: 5,
      approved: 3,
      rejected: 1,
    });
  });

  it('returns empty object when no applications exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await getStatusCounts();

    expect(result).toEqual({});
  });
});
