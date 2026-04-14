import { useState, useRef } from 'react';
import { api } from '../../services/api';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Box from '@cloudscape-design/components/box';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;
const DOC_TYPES = [
  { key: 'government_id', label: 'Government-Issued ID' },
  { key: 'proof_of_address', label: 'Proof of Address' },
];

export default function StepDocuments({ onBack, onSubmit, submitting, error }) {
  const [uploads, setUploads] = useState({ government_id: null, proof_of_address: null });
  const [uploading, setUploading] = useState(null);
  const [localError, setLocalError] = useState(null);
  const fileRefs = { government_id: useRef(), proof_of_address: useRef() };

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'File must be JPEG, PNG, or PDF';
    if (file.size > MAX_SIZE) return 'File must be 10 MB or smaller';
    return null;
  };

  const handleUpload = async (documentType) => {
    const file = fileRefs[documentType].current?.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setLocalError(err); return; }
    setLocalError(null); setUploading(documentType);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('documentType', documentType);
      const res = await api.post('/onboarding/documents', formData);
      setUploads((p) => ({ ...p, [documentType]: { key: res.key, name: file.name } }));
    } catch (e) { setLocalError(e.data?.message || e.message || 'Upload failed'); }
    finally { setUploading(null); }
  };

  const handleSubmit = async () => {
    if (!uploads.government_id || !uploads.proof_of_address) { setLocalError('Please upload both documents.'); return; }
    setLocalError(null);
    try { await api.post('/onboarding/steps/4', {}); } catch {}
    onSubmit();
  };

  const displayError = localError || error?.message;

  return (
    <Container header={<Header variant="h2">ID Verification</Header>}>
      <SpaceBetween size="l">
        <Box color="text-body-secondary">As required by BSP (Bangko Sentral ng Pilipinas), please upload a valid government-issued ID and proof of address.</Box>
        {displayError && <Alert type="error" dismissible onDismiss={() => setLocalError(null)}>{displayError}</Alert>}

        {DOC_TYPES.map(({ key, label }) => (
          <FormField key={key} label={label}>
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <input ref={fileRefs[key]} type="file" accept=".jpg,.jpeg,.png,.pdf" aria-label={`Upload ${label}`} />
              <Button onClick={() => handleUpload(key)} loading={uploading === key}>Upload</Button>
            </SpaceBetween>
            {uploads[key] && <Box margin={{ top: 'xs' }}><StatusIndicator type="success">Uploaded: {uploads[key].name}</StatusIndicator></Box>}
          </FormField>
        ))}

        <SpaceBetween direction="horizontal" size="xs">
          {onBack && <Button onClick={onBack}>Back</Button>}
          <Button variant="primary" onClick={handleSubmit} loading={submitting}
            disabled={!uploads.government_id || !uploads.proof_of_address}>
            Submit for Verification
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
}
