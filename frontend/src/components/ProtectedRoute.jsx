import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <Box textAlign="center" padding={{ top: 'xxxl' }}><Spinner size="large" /></Box>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return <Outlet />;
}
