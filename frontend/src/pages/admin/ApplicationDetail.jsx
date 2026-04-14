import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import StatusUpdatePanel from '../../components/StatusUpdatePanel';
import ContentLayout from '@cloudscape-design/components/content-layout';
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

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docUrls, setDocUrls] = useState({});

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
    <Button key="back" variant="link" onClick={() => navigate('/admin')}>← Back to list</Button>,
    <Container key="header" header={<Header variant="h2" description={app.submitted_at ? `Submitted ${new Date(app.submitted_at).toLocaleString()}` : ''}>
      Application Detail — <StatusIndicator type={s.type}>{s.label}</StatusIndicator>
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

  if (app.documents?.length > 0) {
    sections.push(
      <Container key="docs" header={<Header variant="h3">Documents</Header>}>
        <ColumnLayout columns={2}>
          {app.documents.map((doc) => {
            const label = doc.document_type === 'government_id' ? 'Government ID' : 'Proof of Address';
            const url = docUrls[doc.id];
            const isImage = doc.mime_type?.startsWith('image/');
            return (
              <Container key={doc.id}>
                <SpaceBetween size="s">
                  <Box key="label" variant="awsui-key-label">{label}</Box>
                  {url && isImage && <img key="img" src={url} alt={label} style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }} />}
                  {url && !isImage && <Link key="link" href={url} external>View PDF</Link>}
                  <Box key="meta" color="text-body-secondary" fontSize="body-s">{doc.original_filename} ({(doc.file_size / 1024).toFixed(0)} KB)</Box>
                </SpaceBetween>
              </Container>
            );
          })}
        </ColumnLayout>
      </Container>
    );
  }

  sections.push(
    <StatusUpdatePanel key="status-panel" applicationId={id} currentStatus={app.status} onUpdated={setApp} />
  );

  return <SpaceBetween size="l">{sections}</SpaceBetween>;
}
