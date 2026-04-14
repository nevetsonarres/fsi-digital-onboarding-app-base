import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import ProgressIndicator from '../../components/ProgressIndicator';
import StepPersonalInfo from './StepPersonalInfo';
import StepAddress from './StepAddress';
import StepEmployment from './StepEmployment';
import StepDocuments from './StepDocuments';

const TOTAL_STEPS = 4;

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/onboarding/application').then((app) => {
      if (app && app.status && app.status !== 'draft') {
        navigate('/onboarding/summary', { replace: true });
        return;
      }
      // Resume: find the first incomplete step
      if (app?.steps?.length > 0) {
        const completedSteps = new Set(app.steps.filter((s) => s.is_completed).map((s) => s.step_number));
        const firstIncomplete = [1, 2, 3, 4].find((n) => !completedSteps.has(n)) || 4;
        setCurrentStep(firstIncomplete);
        // Pre-populate step data from saved steps
        const loaded = {};
        app.steps.forEach((s) => { loaded[s.step_number] = s.step_data || {}; });
        setStepData((prev) => ({ ...prev, ...loaded }));
      }
    }).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (stepData[currentStep] !== null) return;
    api.get(`/onboarding/steps/${currentStep}`)
      .then((res) => setStepData((prev) => ({ ...prev, [currentStep]: res.data || {} })))
      .catch(() => setStepData((prev) => ({ ...prev, [currentStep]: {} })));
  }, [currentStep, stepData]);

  const handleStepSave = useCallback(async (stepNumber, data) => {
    setError(null);
    try {
      await api.post(`/onboarding/steps/${stepNumber}`, data);
      setStepData((prev) => ({ ...prev, [stepNumber]: data }));
      if (stepNumber < TOTAL_STEPS) setCurrentStep(stepNumber + 1);
    } catch (err) {
      setError(err.data || { message: err.message });
      throw err;
    }
  }, []);

  const handleBack = useCallback(() => { setError(null); setCurrentStep((s) => Math.max(1, s - 1)); }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/onboarding/submit');
      navigate('/onboarding/summary', { replace: true });
    } catch (err) { setError(err.data || { message: err.message }); }
    finally { setSubmitting(false); }
  }, [navigate]);

  const stepProps = { data: stepData[currentStep] || {}, onSave: handleStepSave, onBack: currentStep > 1 ? handleBack : null, error };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <ContentLayout header={<Header variant="h1">Open a Savings Account</Header>}>
        <Box color="text-body-secondary" margin={{ bottom: 's' }}>
          Complete the steps below to open your AnyBank savings account. This usually takes 5–10 minutes.
        </Box>
        <ProgressIndicator currentStep={currentStep} />
        {error?.message && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error.message}</Alert>}
        {currentStep === 1 && <StepPersonalInfo {...stepProps} />}
        {currentStep === 2 && <StepAddress {...stepProps} />}
        {currentStep === 3 && <StepEmployment {...stepProps} />}
        {currentStep === 4 && <StepDocuments data={stepProps.data} onBack={stepProps.onBack} onSubmit={handleSubmit} submitting={submitting} error={error} />}
      </ContentLayout>
    </div>
  );
}
