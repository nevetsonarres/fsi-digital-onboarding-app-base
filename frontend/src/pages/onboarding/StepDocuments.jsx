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
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;
const DOC_TYPES = [
  { key: 'government_id', label: 'Government-Issued ID' },
  { key: 'proof_of_address', label: 'Proof of Address' },
];

const FIELD_LABELS = {
  fullName: 'Full Name', dateOfBirth: 'Date of Birth', idNumber: 'ID Number',
  expiryDate: 'Expiry Date', address: 'Address',
};

function getConfidenceIndicator(score) {
  if (score >= 80) return <StatusIndicator type="success">{score.toFixed(1)}%</StatusIndicator>;
  if (score >= 60) return <StatusIndicator type="warning">{score.toFixed(1)}%</StatusIndicator>;
  return <StatusIndicator type="error">{score.toFixed(1)}%</StatusIndicator>;
}

function getMatchBadge(mismatchInfo) {
  if (!mismatchInfo) return <Badge color="grey">N/A</Badge>;
  if (mismatchInfo.status === 'match') return <Badge color="green">Match</Badge>;
  if (mismatchInfo.status === 'mismatch') return <Badge color="red">Mismatch</Badge>;
  if (mismatchInfo.status === 'low_confidence') return <Badge color="grey">Low Confidence</Badge>;
  return <Badge color="grey">{mismatchInfo.status}</Badge>;
}

export default function StepDocuments({ onBack, onSubmit, submitting, error }) {
  const [uploads, setUploads] = useState({ government_id: null, proof_of_address: null });
  const [uploading, setUploading] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
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
      if (documentType === 'government_id') setVerificationResult(null);
    } catch (e) { setLocalError(e.data?.message || e.message || 'Upload failed'); }
    finally { setUploading(null); }
  };

  const handleVerifyId = async () => {
    setVerifying(true); setLocalError(null);
    try {
      const result = await api.post('/onboarding/verify-id');
      setVerificationResult(result);
    } catch (e) { setLocalError(e.data?.message || e.message || 'Verification failed'); }
    finally { setVerifying(false); }
  };

  const handleSubmit = async () => {
    if (!uploads.government_id || !uploads.proof_of_address) { setLocalError('Please upload both documents.'); return; }
    setLocalError(null);
    try { await api.post('/onboarding/steps/4', {}); } catch {}
    onSubmit();
  };

  const hasMismatches = verificationResult?.mismatches &&
    Object.values(verificationResult.mismatches).some((m) => m.status === 'mismatch');
  const displayError = localError || error?.message;
  const verificationTableItems = verificationResult?.extractedData
    ? Object.keys(verificationResult.extractedData).map((field) => ({
        field, label: FIELD_LABELS[field] || field,
        extractedValue: verificationResult.extractedData[field] || '\u2014',
        confidence: verificationResult.confidenceScores?.[field],
        mismatch: verificationResult.mismatches?.[field],
      }))
    : [];

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
        {uploads.government_id && !verificationResult && (
          <Button onClick={handleVerifyId} loading={verifying}>Verify ID</Button>
        )}
        {verificationResult?.extractionStatus === 'needs_retry' && (
          <Alert type="warning">The uploaded ID image could not be verified due to poor image quality. Please re-upload a clearer image of your government ID and try again.</Alert>
        )}
        {verificationResult?.extractionStatus === 'completed' && hasMismatches && (
          <Alert type="warning">Some fields extracted from your ID do not match the information you provided. Please review the results below. You may still proceed with your application.</Alert>
        )}
        {verificationResult?.extractionStatus === 'completed' && !hasMismatches && (
          <Alert type="success">Your government ID has been verified successfully. All extracted fields match your provided information.</Alert>
        )}
        {verificationTableItems.length > 0 && (
          <Table header={<Header variant="h3">Extraction Results</Header>} items={verificationTableItems}
            columnDefinitions={[
              { id: 'field', header: 'Field', cell: (item) => item.label },
              { id: 'extracted', header: 'Extracted Value', cell: (item) => item.extractedValue },
              { id: 'confidence', header: 'Confidence', cell: (item) => item.confidence != null ? getConfidenceIndicator(item.confidence) : '\u2014' },
              { id: 'match', header: 'Match Status', cell: (item) => getMatchBadge(item.mismatch) },
            ]} />
        )}
        <SpaceBetween direction="horizontal" size="xs">
          {onBack && <Button onClick={onBack}>Back</Button>}
          <Button variant="primary" onClick={handleSubmit} loading={submitting}
            disabled={!uploads.government_id || !uploads.proof_of_address}>Submit for Verification</Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
}
