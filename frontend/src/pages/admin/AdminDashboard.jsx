import { Routes, Route, Navigate } from 'react-router-dom';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusCountCards from '../../components/StatusCountCards';
import ApplicationList from './ApplicationList';
import ApplicationDetail from './ApplicationDetail';

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <ContentLayout header={<Header variant="h1">Admin Dashboard</Header>}>
        <SpaceBetween size="l">
          <StatusCountCards />
          <Routes>
            <Route index element={<ApplicationList />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </SpaceBetween>
      </ContentLayout>
    </div>
  );
}
