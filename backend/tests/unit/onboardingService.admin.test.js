const {
  listApplications, getApplicationById, updateApplicationStatus, getStatusCounts,
} = require('../../src/services/onboardingService');

jest.mock('../../src/db/pool', () => ({ query: jest.fn() }));

const db = require('../../src/db/pool');
const { NotFoundError, InvalidTransitionError } = require('../../src/errors');

beforeEach(() => { jest.clearAllMocks(); });

describe('listApplications', () => {
  it('returns paginated applications without status filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [
        { id: 'app-1', status: 'pending_verification', applicant_name: 'Alice' },
        { id: 'app-2', status: 'approved', applicant_name: 'Bob' },
      ]});
    const result = await listApplications({ page: 1, limit: 20 });
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.applications).toHaveLength(2);
    expect(db.query.mock.calls[0][0]).toContain("status != 'draft'");
  });

  it('filters by status when provided', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'app-1', status: 'approved', applicant_name: 'Bob' }] });
    const result = await listApplications({ status: 'approved', page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.applications).toHaveLength(1);
    expect(db.query.mock.calls[0][0]).toContain('AND a.status = $1');
    expect(db.query.mock.calls[0][1]).toEqual(['approved']);
  });

  it('calculates correct offset for page 2', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ count: '25' }] }).mockResolvedValueOnce({ rows: [] });
    await listApplications({ page: 2, limit: 10 });
    const dataParams = db.query.mock.calls[1][1];
    expect(dataParams).toEqual([10, 10]);
  });
});

describe('getApplicationById', () => {
  it('returns full application with steps, documents, and ekycVerification', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'app-1', user_id: 'u-1', status: 'pending_verification', applicant_name: 'Alice', applicant_email: 'alice@test.com' }] })
      .mockResolvedValueOnce({ rows: [{ step_number: 1, step_data: {}, is_completed: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'doc-1', document_type: 'government_id' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'ekyc-1', application_id: 'app-1', extraction_status: 'completed' }] });
    const result = await getApplicationById('app-1');
    expect(result.id).toBe('app-1');
    expect(result.applicant_name).toBe('Alice');
    expect(result.steps).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
    expect(result.ekycVerification).toEqual({ id: 'ekyc-1', application_id: 'app-1', extraction_status: 'completed' });
  });

  it('returns ekycVerification as null when no verification exists', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'app-2', user_id: 'u-2', status: 'draft', applicant_name: 'Bob', applicant_email: 'bob@test.com' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await getApplicationById('app-2');
    expect(result.ekycVerification).toBeNull();
  });

  it('throws NotFoundError when application does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(getApplicationById('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

describe('updateApplicationStatus', () => {
  const mockGetAppById = (status = 'pending_verification') => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'app-1', status }] });
  };

  it('updates status from pending_verification and records verification action', async () => {
    mockGetAppById('pending_verification');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'app-1', status: 'approved', applicant_name: 'Alice', applicant_email: 'a@b.com' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await updateApplicationStatus('app-1', 'officer-1', { status: 'approved', note: 'Looks good' });
    expect(result.status).toBe('approved');
    const insertCall = db.query.mock.calls[2];
    expect(insertCall[0]).toContain('verification_actions');
    expect(insertCall[1]).toEqual(['app-1', 'officer-1', 'approved', null, 'Looks good']);
  });

  it('throws NotFoundError when application does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(updateApplicationStatus('nonexistent', 'officer-1', { status: 'approved' })).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when status is not pending_verification', async () => {
    mockGetAppById('approved');
    await expect(updateApplicationStatus('app-1', 'officer-1', { status: 'rejected', reason: 'test' })).rejects.toThrow(InvalidTransitionError);
  });

  it('records reason for rejection', async () => {
    mockGetAppById('pending_verification');
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'app-1', status: 'rejected', applicant_name: 'Alice', applicant_email: 'a@b.com' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await updateApplicationStatus('app-1', 'officer-1', { status: 'rejected', reason: 'Incomplete documents' });
    const insertCall = db.query.mock.calls[2];
    expect(insertCall[1][3]).toBe('Incomplete documents');
  });
});

describe('getStatusCounts', () => {
  it('returns counts grouped by status', async () => {
    db.query.mockResolvedValueOnce({ rows: [
      { status: 'pending_verification', count: 5 },
      { status: 'approved', count: 3 },
      { status: 'rejected', count: 1 },
    ]});
    const result = await getStatusCounts();
    expect(result).toEqual({ pending_verification: 5, approved: 3, rejected: 1 });
  });

  it('returns empty object when no applications exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await getStatusCounts();
    expect(result).toEqual({});
  });
});
