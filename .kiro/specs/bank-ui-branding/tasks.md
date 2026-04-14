# Implementation Plan: Bank UI Branding

## Overview

Update labels, headings, descriptions, button text, and footer copy across 9 existing React components, and add 4 new UI-only form fields. All changes are frontend-only — no backend, routing, or API contract modifications. Each task targets one component file and references the specific requirements it satisfies.

## Tasks

- [x] 1. Update RegisterPage with bank-specific branding and new field
  - [x] 1.1 Change heading, button label, footer text, and add "existing customer" field
  - [ ]* 1.2 Write unit tests for RegisterPage branding changes

- [x] 2. Update LoginPage with bank-specific branding
  - [x] 2.1 Change heading and footer text
  - [ ]* 2.2 Write unit tests for LoginPage branding changes

- [x] 3. Update OnboardingWizard heading and add intro paragraph
  - [x] 3.1 Change heading and insert introductory text
  - [ ]* 3.2 Write unit tests for OnboardingWizard branding changes

- [x] 4. Update ProgressIndicator step labels
  - [x] 4.1 Replace STEPS constant with banking terminology
  - [ ]* 4.2 Write unit tests for ProgressIndicator step labels

- [x] 5. Checkpoint — Verify auth pages and wizard shell

- [x] 6. Update StepPersonalInfo (KYC Step) with new heading and fields
  - [x] 6.1 Change heading and add Mother's Maiden Name and Account Type fields
  - [ ]* 6.2 Write unit tests for StepPersonalInfo branding and new fields

- [x] 7. Update StepEmployment (Financial Profile Step) with new heading and field
  - [x] 7.1 Change heading and add Purpose of Account field
  - [ ]* 7.2 Write unit tests for StepEmployment branding and new field

- [x] 8. Update StepDocuments (ID Verification Step) with BSP language
  - [x] 8.1 Change heading, instruction text, and submit button label
  - [ ]* 8.2 Write unit tests for StepDocuments branding changes

- [x] 9. Checkpoint — Verify all wizard step components

- [x] 10. Update ApplicationSummary with bank-specific heading, note, and step titles
  - [x] 10.1 Change heading, add post-submission note, and update STEP_TITLES
  - [ ]* 10.2 Write unit tests for ApplicationSummary branding changes

- [x] 11. Update AppLayout footer with regulatory disclosure
  - [x] 11.1 Add BSP/PDIC disclosure text to footer
  - [ ]* 11.2 Write unit tests for AppLayout footer

- [x] 12. Final checkpoint — Full regression verification

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- No backend changes are needed — all new fields are local state only
- Existing validation, API calls, and routing remain untouched (Requirement 10)
