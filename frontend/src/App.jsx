import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import ApplicationSummary from './pages/onboarding/ApplicationSummary';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute role="customer" />}>
              <Route path="/onboarding" element={<OnboardingWizard />} />
              <Route path="/onboarding/summary" element={<ApplicationSummary />} />
            </Route>
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
