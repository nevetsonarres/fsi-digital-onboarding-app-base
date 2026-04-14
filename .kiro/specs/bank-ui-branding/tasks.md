# Implementation Plan: Bank UI Branding

## Overview

Update labels, headings, descriptions, button text, and footer copy across 9 existing React components, and add 4 new UI-only form fields. All changes are frontend-only — no backend, routing, or API contract modifications. Each task targets one component file and references the specific requirements it satisfies.

## Tasks

- [x] 1. Update RegisterPage with bank-specific branding and new field
  - [x] 1.1 Change heading, button label, footer text, and add "existing customer" field
    - In `frontend/src/pages/RegisterPage.jsx`:
    - Change heading from `"Create an account"` to `"Open a New AnyBank Account"`
    - Change submit button label from `"Register"` to `"Start Application"`
    - Change footer text from `"Already have an account? Sign in"` to `"Already started an application? Sign in to continue"`
    - Add local state `existingCustomer` (string: `""` | `"yes"` | `"no"`)
    - Add a RadioGroup or Select labelled "Are you an existing AnyBank customer?" with Yes/No options
    - Ensure `existingCustomer` is NOT included in the register API call payload
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.3_

  - [ ]* 1.2 Write unit tests for RegisterPage branding changes
    - Verify new heading, button label, and footer text render correctly
    - Verify old text ("Create an account", "Register") is absent
    - Verify "existing customer" field renders with correct options
    - Verify register API payload does not include `existingCustomer`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.3_

- [x] 2. Update LoginPage with bank-specific branding
  - [x] 2.1 Change heading and footer text
    - In `frontend/src/pages/LoginPage.jsx`:
    - Change heading from `"Sign in to AnyBank"` to `"Sign in to AnyBank Online Banking"`
    - Change footer text from `"Don't have an account? Register"` to `"New to AnyBank? Open an account"`
    - _Requirements: 2.1, 2.2_

  - [ ]* 2.2 Write unit tests for LoginPage branding changes
    - Verify new heading and footer text render correctly
    - Verify old text is absent
    - _Requirements: 2.1, 2.2_

- [x] 3. Update OnboardingWizard heading and add intro paragraph
  - [x] 3.1 Change heading and insert introductory text
    - In `frontend/src/pages/onboarding/OnboardingWizard.jsx`:
    - Change heading from `"Account Onboarding"` to `"Open a Savings Account"`
    - Add a `Box` element between the heading and `ProgressIndicator` with text: `"Complete the steps below to open your AnyBank savings account. This usually takes 5–10 minutes."`
    - Import `Box` from Cloudscape if not already imported
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.2 Write unit tests for OnboardingWizard branding changes
    - Verify new heading and intro paragraph render correctly
    - _Requirements: 3.1, 3.2_

- [x] 4. Update ProgressIndicator step labels
  - [x] 4.1 Replace STEPS constant with banking terminology
    - In `frontend/src/components/ProgressIndicator.jsx`:
    - Step 1: title `"Know Your Customer (KYC)"`, description `"Identity and personal details"`
    - Step 2: title `"Residential Address"`, description `"Current home address"`
    - Step 3: title `"Financial Profile"`, description `"Employment, income, and account purpose"`
    - Step 4: title `"ID Verification"`, description `"Government ID and proof of address"`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Write unit tests for ProgressIndicator step labels
    - Verify each step renders with the new title and description
    - Verify old titles ("Personal Info", "Employment", etc.) are absent
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Checkpoint — Verify auth pages and wizard shell
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update StepPersonalInfo (KYC Step) with new heading and fields
  - [x] 6.1 Change heading and add Mother's Maiden Name and Account Type fields
    - In `frontend/src/pages/onboarding/StepPersonalInfo.jsx`:
    - Change heading from `"Personal Information"` to `"Know Your Customer (KYC)"`
    - Add `mothersMaidenName` and `accountType` to the `form` state object (default `""`)
    - Add a text input labelled "Mother's Maiden Name"
    - Add a Select labelled "Account Type" with options: Savings, Checking, Time Deposit
    - In `handleSubmit`, delete `mothersMaidenName` and `accountType` from the payload before calling `onSave(1, payload)`
    - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.3_

  - [ ]* 6.2 Write unit tests for StepPersonalInfo branding and new fields
    - Verify new heading renders
    - Verify "Mother's Maiden Name" and "Account Type" fields render with correct labels/options
    - Verify `onSave` payload excludes `mothersMaidenName` and `accountType`
    - Verify existing fields still submit correctly
    - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.2, 10.3_

- [x] 7. Update StepEmployment (Financial Profile Step) with new heading and field
  - [x] 7.1 Change heading and add Purpose of Account field
    - In `frontend/src/pages/onboarding/StepEmployment.jsx`:
    - Change heading from `"Employment Details"` to `"Financial Profile"`
    - Add `purposeOfAccount` to the `form` state object (default `""`)
    - Add a Select labelled "Purpose of Account" with options: Savings, Payroll, Business, Remittance, Investment
    - In `handleSubmit`, delete `purposeOfAccount` from the payload before calling `onSave(3, payload)`
    - _Requirements: 6.1, 6.2, 10.1, 10.3_

  - [ ]* 7.2 Write unit tests for StepEmployment branding and new field
    - Verify new heading renders
    - Verify "Purpose of Account" field renders with correct options
    - Verify `onSave` payload excludes `purposeOfAccount`
    - Verify existing fields still submit correctly
    - _Requirements: 6.1, 6.2, 10.1, 10.2, 10.3_

- [x] 8. Update StepDocuments (ID Verification Step) with BSP language
  - [x] 8.1 Change heading, instruction text, and submit button label
    - In `frontend/src/pages/onboarding/StepDocuments.jsx`:
    - Change heading from `"Document Upload"` to `"ID Verification"`
    - Change instruction text to `"As required by BSP (Bangko Sentral ng Pilipinas), please upload a valid government-issued ID and proof of address."`
    - Change submit button label from `"Submit Application"` to `"Submit for Verification"`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 8.2 Write unit tests for StepDocuments branding changes
    - Verify new heading, instruction text, and button label render correctly
    - Verify old text is absent
    - Verify file upload validation and API calls remain unchanged
    - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.2_

- [x] 9. Checkpoint — Verify all wizard step components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update ApplicationSummary with bank-specific heading, note, and step titles
  - [x] 10.1 Change heading, add post-submission note, and update STEP_TITLES
    - In `frontend/src/pages/onboarding/ApplicationSummary.jsx`:
    - Change heading from `"Application Submitted"` to `"Account Application Submitted"`
    - Add an info `Alert` or `Box` below the Status container with text: `"Your application is being reviewed. You will receive an SMS and email notification once your account is ready. For inquiries, visit your nearest AnyBank branch."`
    - Update `STEP_TITLES` to: `1: 'Know Your Customer (KYC)'`, `2: 'Residential Address'`, `3: 'Financial Profile'`, `4: 'ID Verification'`
    - _Requirements: 8.1, 8.2_

  - [ ]* 10.2 Write unit tests for ApplicationSummary branding changes
    - Verify new heading and post-submission note render correctly
    - Verify updated STEP_TITLES appear in rendered step sections
    - _Requirements: 8.1, 8.2_

- [x] 11. Update AppLayout footer with regulatory disclosure
  - [x] 11.1 Add BSP/PDIC disclosure text to footer
    - In `frontend/src/components/AppLayout.jsx`:
    - Add a new line below the existing copyright: `"AnyBank is regulated by the Bangko Sentral ng Pilipinas. Member, Philippine Deposit Insurance Corporation (PDIC). Deposits are insured up to ₱500,000."`
    - _Requirements: 9.1_

  - [ ]* 11.2 Write unit tests for AppLayout footer
    - Verify regulatory disclosure text renders in the footer
    - Verify existing copyright text is still present
    - _Requirements: 9.1_

- [x] 12. Final checkpoint — Full regression verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- No backend changes are needed — all new fields are local state only
- Existing validation, API calls, and routing remain untouched (Requirement 10)
