import { useState, useEffect } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';

const EMPLOYMENT_STATUSES = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'student', label: 'Student' },
];
const INCOME_RANGES = [
  { value: 'below_10000', label: 'Below ₱10,000' },
  { value: '10000_25000', label: '₱10,000 – ₱25,000' },
  { value: '25000_50000', label: '₱25,000 – ₱50,000' },
  { value: '50000_100000', label: '₱50,000 – ₱100,000' },
  { value: '100000_250000', label: '₱100,000 – ₱250,000' },
  { value: 'above_250000', label: 'Above ₱250,000' },
];
const FUND_SOURCES = [
  { value: 'salary', label: 'Salary' },
  { value: 'business_income', label: 'Business Income' },
  { value: 'investments', label: 'Investments' },
  { value: 'remittance', label: 'Remittance' },
  { value: 'pension', label: 'Pension' },
  { value: 'other', label: 'Other' },
];
const PURPOSE_OPTIONS = [
  { value: 'savings', label: 'Savings' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'business', label: 'Business' },
  { value: 'remittance', label: 'Remittance' },
  { value: 'investment', label: 'Investment' },
];

export default function StepEmployment({ data, onSave, onBack, error }) {
  const [form, setForm] = useState({ employmentStatus: '', employerName: '', occupation: '', monthlyIncomeRange: '', sourceOfFunds: '', purposeOfAccount: '' });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { if (data && Object.keys(data).length) setForm((p) => ({ ...p, ...data })); }, [data]);
  useEffect(() => {
    if (error?.details) {
      const e = {}; error.details.forEach((d) => { if (d.field) e[d.field] = d.message; }); setFieldErrors(e);
    }
  }, [error]);

  const setField = (key) => ({ detail }) => { setForm((p) => ({ ...p, [key]: detail.value })); setFieldErrors((p) => ({ ...p, [key]: undefined })); };
  const setSelect = (key) => ({ detail }) => { setForm((p) => ({ ...p, [key]: detail.selectedOption.value })); setFieldErrors((p) => ({ ...p, [key]: undefined })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFieldErrors({});
    const payload = { ...form };
    if (!payload.employerName) delete payload.employerName;
    delete payload.purposeOfAccount;
    try { await onSave(3, payload); } catch {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Container header={<Header variant="h2">Financial Profile</Header>}>
        <SpaceBetween size="l">
          <FormField label="Employment status" errorText={fieldErrors.employmentStatus}>
            <Select selectedOption={EMPLOYMENT_STATUSES.find((o) => o.value === form.employmentStatus) || null}
              onChange={setSelect('employmentStatus')} options={EMPLOYMENT_STATUSES} placeholder="Select…" />
          </FormField>
          <FormField label="Employer name" errorText={fieldErrors.employerName} description="Optional">
            <Input value={form.employerName} onChange={setField('employerName')} />
          </FormField>
          <FormField label="Occupation" errorText={fieldErrors.occupation}>
            <Input value={form.occupation} onChange={setField('occupation')} />
          </FormField>
          <FormField label="Monthly income range" errorText={fieldErrors.monthlyIncomeRange}>
            <Select selectedOption={INCOME_RANGES.find((o) => o.value === form.monthlyIncomeRange) || null}
              onChange={setSelect('monthlyIncomeRange')} options={INCOME_RANGES} placeholder="Select…" />
          </FormField>
          <FormField label="Source of funds" errorText={fieldErrors.sourceOfFunds}>
            <Select selectedOption={FUND_SOURCES.find((o) => o.value === form.sourceOfFunds) || null}
              onChange={setSelect('sourceOfFunds')} options={FUND_SOURCES} placeholder="Select…" />
          </FormField>
          <FormField label="Purpose of Account">
            <Select selectedOption={PURPOSE_OPTIONS.find((o) => o.value === form.purposeOfAccount) || null}
              onChange={setSelect('purposeOfAccount')} options={PURPOSE_OPTIONS} placeholder="Select…" />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            {onBack && <Button onClick={onBack}>Back</Button>}
            <Button variant="primary" loading={saving} formAction="submit">Next</Button>
          </SpaceBetween>
        </SpaceBetween>
      </Container>
    </form>
  );
}
