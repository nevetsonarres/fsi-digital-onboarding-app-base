import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/onboarding');
    } catch (err) {
      setError(err.data?.message || err.message || 'Login failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
      <form onSubmit={handleSubmit}>
        <Container header={<Header variant="h1">Sign in to AnyBank Online Banking</Header>}>
          <SpaceBetween size="l">
            {error && <Alert type="error">{error}</Alert>}
            <FormField label="Email">
              <Input type="email" value={email} onChange={({ detail }) => setEmail(detail.value)} placeholder="you@example.com" autoComplete />
            </FormField>
            <FormField label="Password">
              <Input type="password" value={password} onChange={({ detail }) => setPassword(detail.value)} autoComplete />
            </FormField>
            <Button variant="primary" fullWidth loading={submitting} formAction="submit">Sign in</Button>
            <Box textAlign="center" color="text-body-secondary">
              New to AnyBank? <Link to="/register">Open an account</Link>
            </Box>
          </SpaceBetween>
        </Container>
      </form>
    </div>
  );
}
