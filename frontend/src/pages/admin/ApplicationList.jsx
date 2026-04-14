import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Table from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import Pagination from '@cloudscape-design/components/pagination';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Box from '@cloudscape-design/components/box';

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'flagged_branch_visit', label: 'Branch Visit' },
  { value: 'flagged_home_verification', label: 'Home Verification' },
];

const STATUS_TYPE = {
  pending_verification: 'pending', approved: 'success', rejected: 'error',
  flagged_branch_visit: 'warning', flagged_home_verification: 'warning',
};

const PAGE_SIZE = 20;

export default function ApplicationList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(STATUSES[0]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter.value) params.set('status', statusFilter.value);
      const res = await api.get(`/admin/applications?${params}`);
      setItems(res.applications || []); setTotal(res.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Table
      header={
        <Header variant="h2" counter={`(${total})`}
          actions={
            <Select selectedOption={statusFilter} onChange={({ detail }) => { setStatusFilter(detail.selectedOption); setPage(1); }}
              options={STATUSES} />
          }>
          Applications
        </Header>
      }
      items={items}
      loading={loading}
      loadingText="Loading applications"
      empty={<Box textAlign="center" color="inherit" padding="l">No applications found.</Box>}
      columnDefinitions={[
        { id: 'name', header: 'Applicant', cell: (e) => e.applicant_name || '—' },
        { id: 'submitted', header: 'Submitted', cell: (e) => e.submitted_at ? new Date(e.submitted_at).toLocaleDateString() : '—' },
        { id: 'status', header: 'Status', cell: (e) => <StatusIndicator type={STATUS_TYPE[e.status] || 'info'}>{STATUSES.find((s) => s.value === e.status)?.label || e.status}</StatusIndicator> },
      ]}
      onRowClick={({ detail }) => navigate(`/admin/applications/${detail.item.id}`)}
      pagination={
        <Pagination currentPageIndex={page} pagesCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          onChange={({ detail }) => setPage(detail.currentPageIndex)} />
      }
    />
  );
}
