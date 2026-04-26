import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatusUpdatePanel from '../../components/StatusUpdatePanel';
import DocumentLightbox from '../../components/DocumentLightbox';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';

const DOCUMENT_TYPES = [
  { type: 'government_id', label: 'Government ID' },
  { type: 'proof_of_address', label: 'Proof of Address' },
];

const STATUS_MAP = {
  pending_verification: { type: 'pending', label: 'Pending Verification' },
  approved: { type: 'success', label: 'Approved' },
  rejected: { type: 'error', label: 'Rejected' },
  flagged_branch_visit: { type: 'warning', label: 'Branch Visit' },
  flagged_home_verification: { type: 'warning', label: 'Home Verification' },
};
const STEP_TITLES = { 1: 'Personal Information', 2: 'Address', 3: 'Employment Details', 4: 'Documents' };
const FIELD_LABELS = {
  fullName: 'Full Name', dateOfBirth: 'Date of Birth', nationality: 'Nationality',
  gender: 'Gender', mobileNumber: 'Mobile Number', tin: 'TIN',
  streetAddress: 'Street Address', barangay: 'Barangay', cityMunicipality: 'City/Municipality',
  province: 'Province', zipCode: 'ZIP Code',
  employmentStatus: 'Employment Status', employerName: 'Employer', occupation: 'Occupation',
  monthlyIncomeRange: 'Monthly Income Range', sourceOfFunds: 'Source of Funds',
};
const EKYC_FIELD_LABELS = {
  fullName: 'Full Name', dateOfBirth: 'Date of Birth', idNumber: 'ID Number',
  expiryDate: 'Expiry Date', address: 'Address',
};
const EXTRACTION_STATUS_MAP = {
  completed: { type: 'success', label: 'Completed' },
  failed: { type: 'error', label: 'Failed' },
  needs_retry: { type: 'warning', label: 'Needs Retry' },
  pending: { type: 'pending', label: 'Pending' },
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

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docUrls, setDocUrls] = useState({});
  const [lightbox, setLightbox] = useState({ visible: false, src: '', alt: '' });

  useEffect(() => {
    api.get(`/admin/applications/${id}`).then(setApp).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!app?.documents) return;
    app.documents.forEach((doc) => {
      if (docUrls[doc.id]) return;
      api.get(`/admin/applications/${id}/documents/${doc.id}/url`)
        .then((res) => setDocUrls((p) => ({ ...p, [doc.id]: res.url })))
        .catch(() => {});
    });
  }, [app, id, docUrls]);

  if (loading) return <Box textAlign="center" padding={{ top: 'xxxl' }}><Spinner size="large" /></Box>;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!app) return null;

  const s = STATUS_MAP[app.status] || { type: 'info', label: app.status };

  const sections = [
    <Container key="header" header={<Header variant="h2" description={app.submitted_at ? `Submitted ${new Date(app.submitted_at).toLocaleString()}` : ''}
      actions={<Button variant="link" onClick={() => navigate('/admin')}>\u2190 Back to list</Button>}>
      Application Detail \u2014 <StatusIndicator type={s.type}>{s.label}</StatusIndicator>
    </Header>} />,
    ...(app.steps || []).map((step) => (
      <Container key={`step-${step.step_number}`} header={<Header variant="h3">{STEP_TITLES[step.step_number]}</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          {Object.entries(step.step_data || {}).map(([k, v]) => (
            <div key={k}>
              <Box variant="awsui-key-label">{FIELD_LABELS[k] || k}</Box>
              <div>{String(v)}</div>
            </div>
          ))}
        </ColumnLayout>
      </Container>
    )),
  ];

  sections.push(
    <Container key="docs" header={<Header variant="h3">Documents</Header>}>
      <ColumnLayout columns={2}>
        {DOCUMENT_TYPES.map(({ type, label }) => {
          const doc = (app.documents || []).find((d) => d.document_type === type);
          const url = doc ? docUrls[doc.id] : null;
          const isImage = doc?.mime_type?.startsWith('image/');
          return (
            <Container key={type}>
              <SpaceBetween size="s">
                <Box variant="awsui-key-label">{label}</Box>
                {doc && url && isImage && (
                  <img
                    src={url}
                    alt={label}
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => setLightbox({ visible: true, src: url, alt: label })}
                  />
                )}
                {doc && url && !isImage && <Link href={url} external>View PDF</Link>}
                {doc && (
                  <Box color="text-body-secondary" fontSize="body-s">
                    {doc.original_filename} ({(doc.file_size / 1024).toFixed(0)} KB)
                  </Box>
                )}
                {!doc && <Box color="text-body-secondary">Not uploaded</Box>}
              </SpaceBetween>
            </Container>
          );
        })}
      </ColumnLayout>
    </Container>
  );

  sections.push(buildEkycSection(app.ekycVerification));
  sections.push(<StatusUpdatePanel key="status-panel" applicationId={id} currentStatus={app.status} onUpdated={setApp} />);

  return (
    <SpaceBetween size="l">
      {sections}
      <DocumentLightbox
        visible={lightbox.visible}
        imageSrc={lightbox.src}
        altText={lightbox.alt}
        onClose={() => setLightbox({ visible: false, src: '', alt: '' })}
      />
    </SpaceBetween>
  );
}

function buildEkycSection(ekycVerification) {
  if (!ekycVerification) {
    return (
      <Container key="ekyc" header={<Header variant="h3">eKYC Verification</Header>}>
        <Box color="text-body-secondary">eKYC verification not yet performed</Box>
      </Container>
    );
  }
  const statusInfo = EXTRACTION_STATUS_MAP[ekycVerification.extraction_status] || { type: 'info', label: ekycVerification.extraction_status };
  const extractedData = ekycVerification.extracted_data || {};
  const confidenceScores = ekycVerification.confidence_scores || {};
  const mismatches = ekycVerification.mismatches || {};
  const tableItems = Object.keys(extractedData).map((field) => ({
    field, label: EKYC_FIELD_LABELS[field] || field,
    extractedValue: extractedData[field] || '\u2014',
    confidence: confidenceScores[field], mismatch: mismatches[field],
  }));
  return (
    <Container key="ekyc" header={<Header variant="h3">eKYC Verification</Header>}>
      <SpaceBetween size="l">
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Extraction Status</Box>
            <StatusIndicator type={statusInfo.type}>{statusInfo.label}</StatusIndicator>
          </div>
          <div>
            <Box variant="awsui-key-label">Verified At</Box>
            <div>{new Date(ekycVerification.created_at).toLocaleString()}</div>
          </div>
        </ColumnLayout>
        {ekycVerification.error_reason && <Alert type="error">Error: {ekycVerification.error_reason}</Alert>}
        {tableItems.length > 0 && (
          <Table variant="embedded" header={<Header variant="h3">Extracted Fields</Header>} items={tableItems}
            columnDefinitions={[
              { id: 'field', header: 'Field', cell: (item) => item.label },
              { id: 'extracted', header: 'Extracted Value', cell: (item) => item.extractedValue },
              { id: 'confidence', header: 'Confidence', cell: (item) => item.confidence != null ? getConfidenceIndicator(item.confidence) : '\u2014' },
              { id: 'match', header: 'Match Status', cell: (item) => getMatchBadge(item.mismatch) },
            ]} />
        )}
      </SpaceBetween>
    </Container>
  );
}
