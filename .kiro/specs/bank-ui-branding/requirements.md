# Requirements Document

## Introduction

Revise the frontend of the AnyBank Philippine onboarding portal so that every screen unmistakably communicates "bank account opening application" rather than generic SaaS registration. Changes are limited to labels, headers, descriptions, and a small number of new UI-only form fields. All existing functionality, validation, and API calls remain intact. No backend changes are required; new fields are captured in local form state only.

## Glossary

- **Portal**: The AnyBank customer-facing React single-page application (frontend).
- **Register_Page**: The page where a new applicant creates login credentials (`RegisterPage.jsx`).
- **Login_Page**: The page where a returning applicant signs in (`LoginPage.jsx`).
- **Onboarding_Wizard**: The multi-step form that collects applicant data (`OnboardingWizard.jsx`).
- **Progress_Indicator**: The step bar displayed above the wizard showing completion status (`ProgressIndicator.jsx`).
- **KYC_Step**: Step 1 of the wizard — personal information collection (`StepPersonalInfo.jsx`).
- **Financial_Profile_Step**: Step 3 of the wizard — employment and financial data (`StepEmployment.jsx`).
- **ID_Verification_Step**: Step 4 of the wizard — document upload (`StepDocuments.jsx`).
- **Application_Summary**: The read-only page shown after submission (`ApplicationSummary.jsx`).
- **App_Layout**: The shared layout wrapper containing the top navigation and footer (`AppLayout.jsx`).
- **BSP**: Bangko Sentral ng Pilipinas — the central bank of the Philippines.
- **PDIC**: Philippine Deposit Insurance Corporation.
- **KYC**: Know Your Customer — regulatory identity verification process.

## Requirements

### Requirement 1: Register Page — Bank-Specific Branding

**User Story:** As a prospective bank customer, I want the registration page to clearly indicate I am opening a bank account, so that I have confidence I am on the correct application.

#### Acceptance Criteria

1. THE Register_Page SHALL display the heading "Open a New AnyBank Account" in place of "Create an account".
2. THE Register_Page SHALL display a radio group or select field labelled "Are you an existing AnyBank customer?" with options "Yes" and "No", and the selected value SHALL be stored in local form state.
3. THE Register_Page SHALL display the submit button with the label "Start Application" in place of "Register".
4. THE Register_Page SHALL display the text "Already started an application? Sign in to continue" with a link to the Login_Page, in place of the previous sign-in prompt.

### Requirement 2: Login Page — Bank-Specific Branding

**User Story:** As a returning applicant, I want the login page to identify itself as AnyBank Online Banking, so that I know I am signing in to the correct service.

#### Acceptance Criteria

1. THE Login_Page SHALL display the heading "Sign in to AnyBank Online Banking" in place of "Sign in to AnyBank".
2. THE Login_Page SHALL display the text "New to AnyBank? Open an account" with a link to the Register_Page, in place of the previous registration prompt.

### Requirement 3: Onboarding Wizard — Bank-Specific Heading and Introduction

**User Story:** As an applicant, I want the onboarding wizard to state that I am opening a savings account and estimate the time required, so that I can plan accordingly.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL display the heading "Open a Savings Account" in place of "Account Onboarding".
2. THE Onboarding_Wizard SHALL display an introductory paragraph reading "Complete the steps below to open your AnyBank savings account. This usually takes 5–10 minutes." between the heading and the Progress_Indicator.

### Requirement 4: Progress Indicator — Bank-Specific Step Labels

**User Story:** As an applicant, I want the progress steps to use banking terminology, so that I understand the purpose of each section.

#### Acceptance Criteria

1. THE Progress_Indicator SHALL label step 1 as "Know Your Customer (KYC)" with description "Identity and personal details".
2. THE Progress_Indicator SHALL label step 2 as "Residential Address" with description "Current home address".
3. THE Progress_Indicator SHALL label step 3 as "Financial Profile" with description "Employment, income, and account purpose".
4. THE Progress_Indicator SHALL label step 4 as "ID Verification" with description "Government ID and proof of address".

### Requirement 5: KYC Step — Additional Banking Fields

**User Story:** As an applicant, I want to provide my mother's maiden name and choose an account type during the KYC step, so that the bank can fulfil Philippine regulatory requirements and open the correct product.

#### Acceptance Criteria

1. THE KYC_Step SHALL display the heading "Know Your Customer (KYC)" in place of "Personal Information".
2. THE KYC_Step SHALL display a text input labelled "Mother's Maiden Name", and the entered value SHALL be stored in local form state.
3. THE KYC_Step SHALL display a select field labelled "Account Type" with options "Savings", "Checking", and "Time Deposit", and the selected value SHALL be stored in local form state.

### Requirement 6: Financial Profile Step — Purpose of Account Field

**User Story:** As an applicant, I want to declare the purpose of my account, so that the bank can comply with anti-money-laundering requirements.

#### Acceptance Criteria

1. THE Financial_Profile_Step SHALL display the heading "Financial Profile" in place of "Employment Details".
2. THE Financial_Profile_Step SHALL display a select field labelled "Purpose of Account" with options "Savings", "Payroll", "Business", "Remittance", and "Investment", and the selected value SHALL be stored in local form state.

### Requirement 7: ID Verification Step — BSP Regulatory Language

**User Story:** As an applicant, I want the document upload step to reference BSP regulations, so that I understand why identity documents are required.

#### Acceptance Criteria

1. THE ID_Verification_Step SHALL display the heading "ID Verification" in place of "Document Upload".
2. THE ID_Verification_Step SHALL display the instruction text "As required by BSP (Bangko Sentral ng Pilipinas), please upload a valid government-issued ID and proof of address." in place of the previous generic instruction.
3. THE ID_Verification_Step SHALL display the submit button with the label "Submit for Verification" in place of "Submit Application".

### Requirement 8: Application Summary — Post-Submission Banking Guidance

**User Story:** As an applicant who has submitted the form, I want to see a confirmation that my account application was submitted and know what happens next, so that I am not left uncertain.

#### Acceptance Criteria

1. THE Application_Summary SHALL display the heading "Account Application Submitted" in place of "Application Submitted".
2. THE Application_Summary SHALL display a note reading "Your application is being reviewed. You will receive an SMS and email notification once your account is ready. For inquiries, visit your nearest AnyBank branch." below the status section.

### Requirement 9: App Layout Footer — Regulatory Disclosure

**User Story:** As a site visitor, I want to see regulatory disclosures in the footer, so that I can verify AnyBank is a legitimate regulated institution.

#### Acceptance Criteria

1. THE App_Layout footer SHALL display the text "AnyBank is regulated by the Bangko Sentral ng Pilipinas. Member, Philippine Deposit Insurance Corporation (PDIC). Deposits are insured up to ₱500,000." in addition to the existing copyright notice.

### Requirement 10: Preservation of Existing Functionality

**User Story:** As a developer, I want all existing validation, API calls, routing, and component behaviour to remain unchanged, so that the branding update does not introduce regressions.

#### Acceptance Criteria

1. WHILE the Portal is updated with new labels and fields, THE Portal SHALL continue to invoke the same API endpoints with the same request payloads for all previously existing fields.
2. WHILE the Portal is updated with new labels and fields, THE Portal SHALL preserve all existing client-side validation rules without modification.
3. THE Portal SHALL store newly added form field values (existing customer flag, mother's maiden name, account type, purpose of account) in component-local state only, without sending the values to the backend.
