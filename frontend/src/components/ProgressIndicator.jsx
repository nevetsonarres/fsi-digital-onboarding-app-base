import Wizard from '@cloudscape-design/components/wizard';

const STEPS = [
  { title: 'Know Your Customer (KYC)', description: 'Identity and personal details' },
  { title: 'Residential Address', description: 'Current home address' },
  { title: 'Financial Profile', description: 'Employment, income, and account purpose' },
  { title: 'ID Verification', description: 'Government ID and proof of address' },
];

/**
 * Read-only step indicator using Cloudscape styling.
 * We render a simple step bar since the Wizard component manages its own navigation.
 */
export default function ProgressIndicator({ currentStep }) {
  return (
    <nav aria-label="Onboarding progress" style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {STEPS.map((step, i) => {
        const num = i + 1;
        const isActive = num === currentStep;
        const isCompleted = num < currentStep;
        return (
          <div key={num} style={{
            flex: 1, textAlign: 'center', padding: '12px 8px',
            borderBottom: `3px solid ${isActive ? '#0972d3' : isCompleted ? '#037f0c' : '#d1d5db'}`,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%', fontSize: 13, fontWeight: 600,
              backgroundColor: isActive ? '#0972d3' : isCompleted ? '#037f0c' : '#d1d5db',
              color: '#fff', marginBottom: 4,
            }}>
              {isCompleted ? '✓' : num}
            </div>
            <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#0972d3' : '#414d5c' }}>
              {step.title}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
