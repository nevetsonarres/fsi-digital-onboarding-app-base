import { useState, useEffect } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';

export default function StepAddress({ data, onSave, onBack, error }) {
  const [form, setForm] = useState({ streetAddress: '', barangay: '', cityMunicipality: '', province: '', zipCode: '' });
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
    try { await onSave(2, form); } catch {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Container header={<Header variant="h2">Address</Header>}>
        <SpaceBetween size="l">
          <FormField label="Street address" errorText={fieldErrors.streetAddress}>
            <Input value={form.streetAddress} onChange={set('streetAddress')} />
          </FormField>
          <FormField label="Barangay" errorText={fieldErrors.barangay}>
            <Input value={form.barangay} onChange={set('barangay')} />
          </FormField>
          <FormField label="City / Municipality" errorText={fieldErrors.cityMunicipality}>
            <Input value={form.cityMunicipality} onChange={set('cityMunicipality')} />
          </FormField>
          <FormField label="Province" errorText={fieldErrors.province}>
            <Input value={form.province} onChange={set('province')} />
          </FormField>
          <FormField label="ZIP code" errorText={fieldErrors.zipCode} description="4-digit ZIP">
            <Input value={form.zipCode} onChange={set('zipCode')} />
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
