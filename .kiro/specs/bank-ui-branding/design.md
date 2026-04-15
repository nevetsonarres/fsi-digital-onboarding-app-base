# Design Document: Bank UI Branding

## Overview

This feature revises the AnyBank Philippine onboarding portal frontend so every screen clearly communicates “bank account opening application.” Changes are strictly cosmetic and additive at the UI layer:

- Update static text (headings, labels, descriptions, button text, footer copy)
- Add 4 new UI-only form fields (existing customer flag, mother’s maiden name, account type, purpose of account)
- All new field values live in component-local `useState` only — no API payload changes
- No backend, routing, validation, or API contract changes

The 9 affected components are all React JSX files using Cloudscape Design System components.

## Architecture

No architectural changes. The existing component tree and data flow remain identical:

```
AppLayout (top nav + footer)
├── RegisterPage
├── LoginPage
└── OnboardingWizard
    ├── ProgressIndicator
    ├── StepPersonalInfo (KYC)
    ├── StepAddress (unchanged content)
    ├── StepEmployment (Financial Profile)
    ├── StepDocuments (ID Verification)
    └── ApplicationSummary
```

All changes are leaf-level edits inside existing components. No new components, hooks, contexts, services, or routes are introduced.

## Components and Interfaces

### 1. RegisterPage (`frontend/src/pages/RegisterPage.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Create an account"` | `"Open a New AnyBank Account"` |
| Submit button | `"Register"` | `"Start Application"` |
| Footer text | `"Already have an account? Sign in"` | `"Already started an application? Sign in to continue"` |
| New field | — | Radio/Select: "Are you an existing AnyBank customer?" (Yes / No), stored in local state |

New local state: `existingCustomer` (string, `""` | `"yes"` | `"no"`). Not sent to backend.

### 2. LoginPage (`frontend/src/pages/LoginPage.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Sign in to AnyBank"` | `"Sign in to AnyBank Online Banking"` |
| Footer text | `"Don't have an account? Register"` | `"New to AnyBank? Open an account"` |

### 3. OnboardingWizard (`frontend/src/pages/onboarding/OnboardingWizard.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Account Onboarding"` | `"Open a Savings Account"` |
| Intro paragraph | (none) | `"Complete the steps below to open your AnyBank savings account. This usually takes 5–10 minutes."` inserted between heading and ProgressIndicator |

The intro paragraph will be rendered as a Cloudscape `Box` with `color="text-body-secondary"` and `margin={{ bottom: 's' }}`.

### 4. ProgressIndicator (`frontend/src/components/ProgressIndicator.jsx`)

Update the `STEPS` constant:

| Step | Current Title / Description | New Title / Description |
|---|---|---|
| 1 | Personal Info / Name, DOB, nationality, contact | Know Your Customer (KYC) / Identity and personal details |
| 2 | Address / Street, barangay, city, province | Residential Address / Current home address |
| 3 | Employment / Status, income, source of funds | Financial Profile / Employment, income, and account purpose |
| 4 | Documents / Government ID, proof of address | ID Verification / Government ID and proof of address |

### 5. StepPersonalInfo / KYC Step (`frontend/src/pages/onboarding/StepPersonalInfo.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Personal Information"` | `"Know Your Customer (KYC)"` |
| New field 1 | — | Text input: "Mother's Maiden Name", stored in local state |
| New field 2 | — | Select: "Account Type" with options Savings / Checking / Time Deposit, stored in local state |

New local state fields: `mothersMaidenName` (string), `accountType` (string). Added to the `form` state object but excluded from the `onSave` payload sent to the API.

Implementation detail: the `handleSubmit` function will spread `form` into a payload and `delete` the two new keys before calling `onSave(1, payload)`.

### 6. StepEmployment / Financial Profile Step (`frontend/src/pages/onboarding/StepEmployment.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Employment Details"` | `"Financial Profile"` |
| New field | — | Select: "Purpose of Account" with options Savings / Payroll / Business / Remittance / Investment, stored in local state |

New local state field: `purposeOfAccount` (string). Excluded from the `onSave` payload the same way as above.

### 7. StepDocuments / ID Verification Step (`frontend/src/pages/onboarding/StepDocuments.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Document Upload"` | `"ID Verification"` |
| Instruction text | `"Upload a government-issued ID and proof of address. Accepted: JPEG, PNG, PDF (max 10 MB each)."` | `"As required by BSP (Bangko Sentral ng Pilipinas), please upload a valid government-issued ID and proof of address."` |
| Submit button | `"Submit Application"` | `"Submit for Verification"` |

File-type and size constraints remain unchanged (JPEG, PNG, PDF, 10 MB). The accepted-formats note can be appended as a secondary line if desired, but the primary instruction must match the BSP language.

### 8. ApplicationSummary (`frontend/src/pages/onboarding/ApplicationSummary.jsx`)

| Change | Current | New |
|---|---|---|
| Heading | `"Application Submitted"` | `"Account Application Submitted"` |
| New note | (none) | `"Your application is being reviewed. You will receive an SMS and email notification once your account is ready. For inquiries, visit your nearest AnyBank branch."` displayed below the Status container |

The note will be rendered as a Cloudscape `Alert` with `type="info"` or a `Box` with secondary text styling, placed immediately after the Status `Container`.

Also update `STEP_TITLES` map to match new step names:
- `1: 'Know Your Customer (KYC)'`
- `2: 'Residential Address'`  
- `3: 'Financial Profile'`
- `4: 'ID Verification'`

### 9. AppLayout (`frontend/src/components/AppLayout.jsx`)

| Change | Current | New |
|---|---|---|
| Footer | `"© 2026 AnyBank. All rights reserved."` | Same line + new line: `"AnyBank is regulated by the Bangko Sentral ng Pilipinas. Member, Philippine Deposit Insurance Corporation (PDIC). Deposits are insured up to ₱500,000."` |

## Data Models

No data model changes. All new form fields are stored in component-local React state (`useState`) and are never serialized to the backend.

| New Field | Component | Type | Values | Persisted? |
|---|---|---|---|---|
| `existingCustomer` | RegisterPage | string | `""`, `"yes"`, `"no"` | No |
| `mothersMaidenName` | StepPersonalInfo | string | free text | No |
| `accountType` | StepPersonalInfo | string | `""`, `"savings"`, `"checking"`, `"time_deposit"` | No |
| `purposeOfAccount` | StepEmployment | string | `""`, `"savings"`, `"payroll"`, `"business"`, `"remittance"`, `"investment"` | No |

## Error Handling

No new error handling is required. Existing validation and error display patterns remain unchanged:

- New local-only fields have no backend validation — they are optional UI fields
- Existing field validation (fullName, email, password, etc.) is untouched
- File upload validation (type, size) in StepDocuments is untouched
- API error handling in all components remains as-is

## Testing Strategy

Property-based testing is NOT applicable for this feature. The changes are purely UI label/text updates and simple local state additions — there are no pure functions, data transformations, or algorithmic logic to validate with PBT. The input space is fixed (static strings and small enum sets), not large or infinite.

### Recommended Testing Approach

**Example-based unit tests** using React Testing Library + Vitest:

1. **Text verification tests** — For each of the 9 components, render the component and assert the new heading/label/button text is present and the old text is absent. These are straightforward `getByText` / `queryByText` assertions.

2. **New field rendering tests** — Verify the 4 new form fields render with correct labels and options:
   - RegisterPage: "Are you an existing AnyBank customer?" with Yes/No options
   - StepPersonalInfo: "Mother's Maiden Name" input and "Account Type" select
   - StepEmployment: "Purpose of Account" select

3. **Local state isolation tests** — Verify new fields store values in local state and do NOT appear in API payloads:
   - Mock `onSave` / `api.post`, fill in new fields, submit, assert the payload excludes new field keys

4. **Regression tests** — Verify existing fields and validation still work:
   - Existing form submissions still call the same API endpoints with the same payloads
   - Existing client-side validation (empty name, short password, etc.) still triggers

5. **Snapshot tests** — Optional, for catching unintended text regressions across all 9 components.
