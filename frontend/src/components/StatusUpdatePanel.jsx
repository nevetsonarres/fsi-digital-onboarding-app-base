import { useState } from 'react';
import { api } from '../services/api';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Textarea from '@cloudscape-design/components/textarea';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';

const ACTIONS = [
  { status: 'approved', label: 'Approve', variant: 'primary' },
  { status: 'rejected', label: 'Reject', variant: 'normal' },
  { status: 'flagged_branch_visit', label: 'Flag — Branch Visit', variant: 'normal' },
  { status: 'flagged_home_verification', label: 'Flag — Home Verification', variant: 'normal' },
];

export default function StatusUpdatePanel({ applicationId, currentStatus, onUpdated }) {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (currentStatus !== 'pending_verification') {
    return (
      <Container>
        <Box color="text-body-secondary">This application has been processed. No further status changes allowed.</Box>
      </Container>
    );
  }

  const handleSubmit = async () => {
    if (!selected) return;
    setError(null); setSubmitting(true);
    try {
      const body = { status: selected };
      if (selected === 'rejected') body.reason = reason;
      if (selected.startsWith('flagged_')) body.note = note;
      const updated = await api.patch(`/admin/applications/${applicationId}/status`, body);
      onUpdated(updated); setSelected(null); setReason(''); setNote('');
    } catch (e) { setError(e.data?.message || e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Container header={<Header variant="h3">Update Status</Header>}>
      <SpaceBetween size="l">
        {error && <Alert type="error">{error}</Alert>}
        <SpaceBetween direction="horizontal" size="xs">
          {ACTIONS.map((a) => (
            <Button key={a.status} variant={selected === a.status ? 'primary' : a.variant}
              onClick={() => setSelected(a.status)}>{a.label}</Button>
          ))}
        </SpaceBetween>

        {selected === 'rejected' && (
          <FormField label="Rejection reason (required)">
            <Textarea value={reason} onChange={({ detail }) => setReason(detail.value)} rows={3} />
          </FormField>
        )}
        {selected?.startsWith('flagged_') && (
          <FormField label="Note">
            <Textarea value={note} onChange={({ detail }) => setNote(detail.value)} rows={3} />
          </FormField>
        )}

        {selected && (
          <Button variant="primary" onClick={handleSubmit} loading={submitting}
            disabled={selected === 'rejected' && !reason.trim()}>
            Confirm
          </Button>
        )}
      </SpaceBetween>
    </Container>
  );
}
