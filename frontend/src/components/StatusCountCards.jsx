import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';

const STATUS_CONFIG = [
  { key: 'pending_verification', label: 'Pending', type: 'pending' },
  { key: 'approved', label: 'Approved', type: 'success' },
  { key: 'rejected', label: 'Rejected', type: 'error' },
  { key: 'flagged_branch_visit', label: 'Branch Visit', type: 'warning' },
  { key: 'flagged_home_verification', label: 'Home Verification', type: 'warning' },
];

export default function StatusCountCards() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/applications/stats').then(setCounts).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert type="error">Failed to load stats: {error}</Alert>;
  if (!counts) return <Box textAlign="center" padding="l"><Spinner /></Box>;

  return (
    <ColumnLayout columns={5} variant="text-grid">
      {STATUS_CONFIG.map(({ key, label, type }) => (
        <Container key={key}>
          <Box variant="awsui-key-label">{label}</Box>
          <Box variant="awsui-value-large">
            <StatusIndicator type={type}>{counts[key] ?? 0}</StatusIndicator>
          </Box>
        </Container>
      ))}
    </ColumnLayout>
  );
}
