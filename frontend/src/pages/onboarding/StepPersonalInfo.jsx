import { useState, useEffect } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Button from '@cloudscape-design/components/button';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings' },
  { value: 'checking', label: 'Checking' },
  { value: 'time_deposit', label: 'Time Deposit' },
];

export default function StepPersonalInfo({ data, onSave, error }) {
  const [form, setForm] = useState({ fullName: '', dateOfBirth: '', nationality: '', gender: '', mobileNumber: '', tin: '', mothersMaidenName: '', accountType: '' });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { if (data && Object.keys(data).length) setForm((p) => ({ ...p, ...data })); }, [data]);
  useEffect(() => {
    if (error?.details) {
      const e = {}; error.details.forEach((d) => { if (d.field) e[d.field] = d.message; }); setFieldErrors(e);
    }
  }, [error]);

  const set = (key) => ({ detail }) => { setForm((p) => ({ ...p, [key]: detail.value })); setFieldErrors((p) => ({ ...p, [key]: undefined })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFieldErrors({});
    const payload = { ...form };
    delete payload.mothersMaidenName;
    delete payload.accountType;
    try { await onSave(1, payload); } catch {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Container header={<Header variant="h2">Know Your Customer (KYC)</Header>}>
        <SpaceBetween size="l">
          <FormField label="Full name" errorText={fieldErrors.fullName}>
            <Input value={form.fullName} onChange={set('fullName')} />
          </FormField>
          <FormField label="Date of birth" errorText={fieldErrors.dateOfBirth} description="YYYY-MM-DD">
            <Input type="text" value={form.dateOfBirth} onChange={set('dateOfBirth')} placeholder="1990-01-15" />
          </FormField>
          <FormField label="Nationality" errorText={fieldErrors.nationality}>
            <Input value={form.nationality} onChange={set('nationality')} />
          </FormField>
          <FormField label="Gender" errorText={fieldErrors.gender}>
            <Select
              selectedOption={GENDERS.find((g) => g.value === form.gender) || null}
              onChange={({ detail }) => { setForm((p) => ({ ...p, gender: detail.selectedOption.value })); setFieldErrors((p) => ({ ...p, gender: undefined })); }}
              options={GENDERS} placeholder="Select gender"
            />
          </FormField>
          <FormField label="Mobile number" errorText={fieldErrors.mobileNumber} description="+639XXXXXXXXX or 09XXXXXXXXX">
            <Input value={form.mobileNumber} onChange={set('mobileNumber')} />
          </FormField>
          <FormField label="TIN" errorText={fieldErrors.tin} description="XXX-XXX-XXX-XXX">
            <Input value={form.tin} onChange={set('tin')} />
          </FormField>
          <FormField label="Mother's Maiden Name">
            <Input value={form.mothersMaidenName} onChange={set('mothersMaidenName')} />
          </FormField>
          <FormField label="Account Type">
            <Select
              selectedOption={ACCOUNT_TYPES.find((a) => a.value === form.accountType) || null}
              onChange={({ detail }) => { setForm((p) => ({ ...p, accountType: detail.selectedOption.value })); }}
              options={ACCOUNT_TYPES} placeholder="Select account type"
            />
          </FormField>
          <Button variant="primary" loading={saving} formAction="submit">Next</Button>
        </SpaceBetween>
      </Container>
    </form>
  );
}
