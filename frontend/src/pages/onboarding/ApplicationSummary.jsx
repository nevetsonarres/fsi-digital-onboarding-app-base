import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';

const STATUS_MAP = {
  pending_verification: { type: 'pending', label: 'Pending Verification' },
  approved: { type: 'success', label: 'Approved' },
  rejected: { type: 'error', label: 'Rejected' },
  flagged_branch_visit: { type: 'warning', label: 'Branch Visit Required' },
  flagged_home_verification: { type: 'warning', label: 'Home Verification Required' },
};

const STEP_TITLES = { 1: 'Know Your Customer (KYC)', 2: 'Residential Address', 3: 'Financial Profile', 4: 'ID Verification' };
const FIELD_LABELS = {
  fullName: 'Full Name', dateOfBirth: 'Date of Birth', nationality: 'Nationality',
  gender: 'Gender', mobileNumber: 'Mobile Number', tin: 'TIN',
  streetAddress: 'Street Address', barangay: 'Barangay', cityMunicipality: 'City/Municipality',
  province: 'Province', zipCode: 'ZIP Code',
  employmentStatus: 'Employment Status', employerName: 'Employer', occupation: 'Occupation',
  monthlyIncomeRange: 'Monthly Income Range', sourceOfFunds: 'Source of Funds',
};

export default function ApplicationSummary() {
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/onboarding/application')
      .then((app) => { if (!app?.status) { navigate('/onboarding', { replace: true }); return; } setApplication(app); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <Box textAlign="center" padding={{ top: 'xxxl' }}><Spinner size="large" /></Box>;
  if (error) return <Box padding="l"><Alert type="error">Error: {error}</Alert></Box>;
  if (!application) return null;

  const s = STATUS_MAP[application.status] || { type: 'info', label: application.status };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <ContentLayout header={<Header variant="h1" description={application.submitted_at ? `Submitted ${new Date(application.submitted_at).toLocaleString()}` : ''}>Account Application Submitted</Header>}>
        <SpaceBetween size="l">
          <Container key="status" header={<Header variant="h2">Status</Header>}>
            <StatusIndicator type={s.type}>{s.label}</StatusIndicator>
          </Container>

          <Alert type="info">
            Your application is being reviewed. You will receive an SMS and email notification once your account is ready. For inquiries, visit your nearest AnyBank branch.
          </Alert>

          {(application.steps || []).map((step) => (
            <Container key={`step-${step.step_number}`} header={<Header variant="h2">{STEP_TITLES[step.step_number]}</Header>}>
              <ColumnLayout columns={2} variant="text-grid">
                {Object.entries(step.step_data || {}).map(([k, v]) => (
                  <div key={k}>
                    <Box variant="awsui-key-label">{FIELD_LABELS[k] || k}</Box>
                    <div>{String(v)}</div>
                  </div>
                ))}
              </ColumnLayout>
            </Container>
          ))}

          {application.documents?.length > 0 && (
            <Container key="docs" header={<Header variant="h2">Documents</Header>}>
              <SpaceBetween size="s">
                {application.documents.map((doc) => (
                  <div key={doc.id}>
                    <Box variant="awsui-key-label">{doc.document_type === 'government_id' ? 'Government ID' : 'Proof of Address'}</Box>
                    <div>{doc.original_filename}</div>
                  </div>
                ))}
              </SpaceBetween>
            </Container>
          )}
        </SpaceBetween>
      </ContentLayout>
    </div>
  );
}
