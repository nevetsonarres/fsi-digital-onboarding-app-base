# Requirements Document

## Introduction

This document defines the requirements for a digital onboarding portal for a Philippine bank. The portal enables new customers to complete their account opening process online through a multi-step wizard, uploading required identification documents for manual verification by bank officers. The system includes a customer-facing onboarding flow and an admin dashboard for bank officers to review, approve, reject, or flag applications. The tech stack consists of React 18 with Vite (frontend), Node.js 20 with Express (backend), PostgreSQL 15 (database), and AWS S3 ap-southeast-1 (file storage). Local development is containerized using Docker Compose.

## Glossary

- **Portal**: The full-stack web application comprising the customer-facing onboarding UI and the admin dashboard
- **Onboarding_Wizard**: The multi-step form flow where customers provide personal information, address, employment details, and upload identification documents
- **Application**: A customer's onboarding submission containing all personal data, address, employment details, and uploaded documents
- **Application_Status**: One of five states an Application can be in: `pending_verification`, `approved`, `rejected`, `flagged_branch_visit`, `flagged_home_verification`
- **Bank_Officer**: An authenticated admin user who reviews and processes customer Applications
- **Customer**: An end user who registers and submits an onboarding Application
- **Auth_Service**: The backend service responsible for JWT-based authentication and authorization
- **API_Gateway**: The Express backend exposing RESTful endpoints under `/api/v1/`
- **File_Service**: A reusable backend service responsible for uploading, retrieving, and managing files in AWS S3
- **Validation_Layer**: The Zod-based request validation middleware applied to all API endpoints
- **Admin_Dashboard**: The web interface used by Bank Officers to review pending Applications and update verification statuses
- **Seed_Script**: A database script that populates the system with sample users and test Applications in various statuses for development and testing
- **Correlation_ID**: A unique identifier attached to each HTTP request via headers for end-to-end request tracing in logs

## Requirements

### Requirement 1: Customer Registration and Authentication

**User Story:** As a Customer, I want to register and log in to the portal, so that I can securely access the onboarding process.

#### Acceptance Criteria

1. WHEN a Customer submits valid registration data (email, password, full name), THE Auth_Service SHALL create a new customer account and return a JWT access token
2. WHEN a Customer submits valid login credentials, THE Auth_Service SHALL return a JWT access token and a refresh token
3. IF a Customer submits registration data with an email that already exists, THEN THE Auth_Service SHALL return a 409 Conflict error with a descriptive message
4. IF a Customer submits invalid login credentials, THEN THE Auth_Service SHALL return a 401 Unauthorized error without revealing whether the email or password was incorrect
5. WHEN a JWT access token expires, THE Auth_Service SHALL allow the Customer to obtain a new access token using a valid refresh token
6. THE Auth_Service SHALL hash all passwords using bcrypt with a minimum cost factor of 10 before storing them in the database

### Requirement 2: Multi-Step Onboarding Wizard

**User Story:** As a Customer, I want to complete my onboarding through a guided multi-step wizard, so that I can provide all required information in an organized manner.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL present four sequential steps: Personal Information, Address, Employment Details, and Document Upload
2. WHEN a Customer completes a step with valid data, THE Onboarding_Wizard SHALL persist the step data to the backend and allow navigation to the next step
3. WHEN a Customer navigates back to a previously completed step, THE Onboarding_Wizard SHALL display the previously entered data for that step
4. WHILE a Customer is on any step of the Onboarding_Wizard, THE Portal SHALL display a progress indicator showing the current step and total steps
5. THE Validation_Layer SHALL validate Personal Information fields: full name, date of birth, nationality, gender, mobile number, and Tax Identification Number (TIN)
6. THE Validation_Layer SHALL validate Address fields: street address, barangay, city/municipality, province, and ZIP code
7. THE Validation_Layer SHALL validate Employment Details fields: employment status, employer name, occupation, monthly income range, and source of funds
8. IF a Customer submits step data that fails Zod validation, THEN THE API_Gateway SHALL return a 400 Bad Request error with field-level error details

### Requirement 3: Document Upload

**User Story:** As a Customer, I want to upload my identification documents, so that the bank can verify my identity.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL require upload of two document types: a government-issued ID and a proof of address document
2. WHEN a Customer uploads a valid document file, THE File_Service SHALL store the file in the configured AWS S3 bucket in the ap-southeast-1 region and return a reference key
3. THE File_Service SHALL accept files in JPEG, PNG, and PDF formats with a maximum file size of 10 MB per document
4. IF a Customer uploads a file that exceeds 10 MB or is in an unsupported format, THEN THE File_Service SHALL return a 400 Bad Request error with a descriptive message
5. WHEN a document is uploaded, THE File_Service SHALL generate a unique file key using the Application ID and document type to prevent naming collisions
6. THE File_Service SHALL generate time-limited pre-signed URLs for document retrieval, valid for a maximum of 15 minutes

### Requirement 4: Application Submission

**User Story:** As a Customer, I want to submit my completed onboarding application, so that it can be reviewed by the bank.

#### Acceptance Criteria

1. WHEN a Customer has completed all four wizard steps and submits the Application, THE API_Gateway SHALL set the Application_Status to `pending_verification`
2. IF a Customer attempts to submit an Application with incomplete steps, THEN THE API_Gateway SHALL return a 400 Bad Request error listing the incomplete steps
3. WHEN an Application is submitted, THE API_Gateway SHALL record the submission timestamp in the Application record
4. WHILE an Application has Application_Status of `pending_verification`, THE Portal SHALL display a read-only summary of the submitted Application to the Customer
5. THE API_Gateway SHALL prevent a Customer from submitting more than one active Application at a time

### Requirement 5: Admin Authentication and Authorization

**User Story:** As a Bank_Officer, I want to log in to the admin dashboard with elevated privileges, so that I can review customer applications.

#### Acceptance Criteria

1. WHEN a Bank_Officer submits valid login credentials, THE Auth_Service SHALL return a JWT access token with an admin role claim
2. THE API_Gateway SHALL restrict all `/api/v1/admin/*` endpoints to requests bearing a valid JWT with an admin role claim
3. IF a non-admin user attempts to access an admin endpoint, THEN THE API_Gateway SHALL return a 403 Forbidden error

### Requirement 6: Admin Application Review Dashboard

**User Story:** As a Bank_Officer, I want to view and filter pending applications, so that I can efficiently process customer onboarding requests.

#### Acceptance Criteria

1. WHEN a Bank_Officer accesses the Admin_Dashboard, THE Admin_Dashboard SHALL display a paginated list of Applications with columns for applicant name, submission date, and current Application_Status
2. THE Admin_Dashboard SHALL allow Bank_Officers to filter Applications by Application_Status
3. WHEN a Bank_Officer selects an Application, THE Admin_Dashboard SHALL display the full application details including all submitted personal information, address, employment details, and uploaded documents
4. WHEN a Bank_Officer views uploaded documents, THE File_Service SHALL provide pre-signed URLs for secure, time-limited document access
5. THE Admin_Dashboard SHALL display the total count of Applications in each Application_Status category

### Requirement 7: Application Verification Status Update

**User Story:** As a Bank_Officer, I want to update the verification status of an application, so that I can approve, reject, or flag applications for further action.

#### Acceptance Criteria

1. WHEN a Bank_Officer approves an Application, THE API_Gateway SHALL update the Application_Status to `approved` and record the Bank_Officer ID and timestamp
2. WHEN a Bank_Officer rejects an Application, THE API_Gateway SHALL update the Application_Status to `rejected`, record the Bank_Officer ID, timestamp, and require a rejection reason
3. WHEN a Bank_Officer flags an Application for a branch visit, THE API_Gateway SHALL update the Application_Status to `flagged_branch_visit` and record the Bank_Officer ID, timestamp, and a note
4. WHEN a Bank_Officer flags an Application for home verification, THE API_Gateway SHALL update the Application_Status to `flagged_home_verification` and record the Bank_Officer ID, timestamp, and a note
5. THE API_Gateway SHALL only allow status transitions from `pending_verification` to `approved`, `rejected`, `flagged_branch_visit`, or `flagged_home_verification`
6. IF a Bank_Officer attempts an invalid status transition, THEN THE API_Gateway SHALL return a 400 Bad Request error describing the allowed transitions

### Requirement 8: API Standards and Middleware

**User Story:** As a developer, I want consistent API conventions and security middleware, so that the backend is secure, traceable, and maintainable.

#### Acceptance Criteria

1. THE API_Gateway SHALL prefix all routes with `/api/v1/`
2. THE API_Gateway SHALL attach a Correlation_ID header (`X-Correlation-ID`) to every request and include the Correlation_ID in all log entries for that request
3. IF a request does not include an `X-Correlation-ID` header, THEN THE API_Gateway SHALL generate a new UUID v4 as the Correlation_ID
4. THE API_Gateway SHALL use structured JSON logging via Winston for all log output, including the Correlation_ID, HTTP method, path, status code, and response time
5. THE API_Gateway SHALL apply rate limiting of 100 requests per 15-minute window per IP address
6. THE API_Gateway SHALL use Helmet middleware for HTTP security headers
7. THE API_Gateway SHALL use CORS middleware configured to allow requests from the frontend origin
8. IF an unhandled error occurs, THEN THE API_Gateway SHALL catch the error using custom error classes and return a structured JSON error response with an appropriate HTTP status code

### Requirement 9: Database Schema and Seed Data

**User Story:** As a developer, I want a well-structured database schema and seed data, so that I can develop and test the application locally.

#### Acceptance Criteria

1. THE Portal SHALL use PostgreSQL 15 as the primary data store with tables for users, applications, application steps, documents, and verification actions
2. THE Seed_Script SHALL create at least two sample Customer accounts and one Bank_Officer account with pre-hashed passwords
3. THE Seed_Script SHALL create at least three sample Applications: one in `pending_verification` status, one in `approved` status, and one in `rejected` status
4. THE Seed_Script SHALL be idempotent, clearing existing seed data before re-inserting to allow repeated execution without errors

### Requirement 10: Containerized Local Development

**User Story:** As a developer, I want to spin up the entire application stack locally with a single command, so that I can develop and test without manual setup.

#### Acceptance Criteria

1. THE Portal SHALL provide a Docker Compose file that defines services for the backend, PostgreSQL database, and any supporting services
2. WHEN a developer runs `docker compose up`, THE Portal SHALL start all services with correct networking, environment variables, and volume mounts
3. THE Portal SHALL include a Dockerfile for the backend service based on the Node.js 20 official image
4. WHEN the PostgreSQL container starts, THE Portal SHALL automatically run database migrations to create the required schema
5. THE Portal SHALL use environment variables for all configuration values including database credentials, JWT secrets, S3 bucket name, and AWS region
