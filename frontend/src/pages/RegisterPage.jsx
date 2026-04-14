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
import RadioGroup from '@cloudscape-design/components/radio-group';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await register(email, password, fullName);
      navigate('/onboarding');
    } catch (err) {
      if (err.status === 409) setGeneralError('An account with this email already exists.');
      else if (err.data?.details) {
        const fieldErrs = {};
        err.data.details.forEach((d) => { fieldErrs[d.field || d.path?.[0]] = d.message; });
        setErrors(fieldErrs);
      } else setGeneralError(err.data?.message || err.message || 'Registration failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px' }}>
      <form onSubmit={handleSubmit}>
        <Container header={<Header variant="h1">Open a New AnyBank Account</Header>}>
          <SpaceBetween size="l">
            {generalError && <Alert type="error">{generalError}</Alert>}
            <FormField label="Full name" errorText={errors.fullName}>
              <Input value={fullName} onChange={({ detail }) => setFullName(detail.value)} autoComplete />
            </FormField>
            <FormField label="Email" errorText={errors.email}>
              <Input type="email" value={email} onChange={({ detail }) => setEmail(detail.value)} placeholder="you@example.com" autoComplete />
            </FormField>
            <FormField label="Password" errorText={errors.password} description="Minimum 8 characters">
              <Input type="password" value={password} onChange={({ detail }) => setPassword(detail.value)} autoComplete />
            </FormField>
            <FormField label="Are you an existing AnyBank customer?">
              <RadioGroup
                value={existingCustomer}
                onChange={({ detail }) => setExistingCustomer(detail.value)}
                items={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>
            <Button variant="primary" fullWidth loading={submitting} formAction="submit">Start Application</Button>
            <Box textAlign="center" color="text-body-secondary">
              Already started an application? <Link to="/login">Sign in to continue</Link>
            </Box>
          </SpaceBetween>
        </Container>
      </form>
    </div>
  );
}
