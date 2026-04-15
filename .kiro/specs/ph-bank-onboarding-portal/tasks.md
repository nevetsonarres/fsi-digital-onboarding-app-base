# Implementation Plan: PH Bank Onboarding Portal

## Overview

Build a full-stack Philippine bank onboarding portal with a React 18 + Vite frontend and Node.js 20 + Express backend. Implementation proceeds bottom-up: project scaffolding → database & config → error handling → middleware → services → routes → frontend → containerization → seed data. JavaScript is used throughout (backend and frontend). Property-based tests use fast-check; unit/integration tests use Jest (backend) and Vitest (frontend).

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialize backend project structure
    - Create `backend/` directory with `package.json` (Express, pg, bcrypt, jsonwebtoken, zod, helmet, cors, express-rate-limit, winston, uuid, multer, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
    - Create `backend/src/config/index.js` reading all environment variables (DATABASE_URL, JWT secrets, S3 config, FRONTEND_ORIGIN, rate limit settings, PORT, NODE_ENV)
    - Create `backend/src/app.js` as the Express app entry point (no middleware wired yet)
    - _Requirements: 10.5_
  - [x] 1.2 Initialize frontend project structure
    - Scaffold `frontend/` with Vite + React 18 template
    - Create `frontend/vite.config.js` with API proxy to backend
    - Create placeholder `App.jsx` and `main.jsx`
    - _Requirements: 10.5_
  - [x] 1.3 Set up backend test infrastructure
    - Install Jest, supertest, fast-check as dev dependencies
    - Create `backend/jest.config.js`
    - Create directory structure: `backend/tests/unit/`, `backend/tests/property/`, `backend/tests/integration/`
    - _Requirements: (testing infrastructure)_

- [x] 2. Database schema and connection
  - [x] 2.1 Create database connection module
    - Create `backend/src/db/pool.js` using `pg.Pool` with `DATABASE_URL` from config
    - Export a query helper that accepts parameterized SQL
    - _Requirements: 9.1_
  - [x] 2.2 Create database migration script
    - Create `backend/src/db/migrate.js` that creates all five tables: `users`, `applications`, `application_steps`, `documents`, `verification_actions`
    - Include all columns, constraints, unique indexes, foreign keys, and CHECK constraints as defined in the design
    - Add `(application_id, step_number)` unique constraint on `application_steps`
    - Add `(application_id, document_type)` unique constraint on `documents`
    - Add `UNIQUE` constraint on `users.email` and `applications.user_id`
    - _Requirements: 9.1_

- [x] 3. Error handling and validation layer
  - [x] 3.1 Implement custom error class hierarchy
    - Create `backend/src/errors/index.js` with AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, InvalidTransitionError
    - Each class sets the correct HTTP status code and error code
    - _Requirements: 8.8_
  - [ ]* 3.2 Write property test for custom error classes
    - **Property 17: Custom error classes produce structured JSON responses**
    - Generate instances of each error class and verify statusCode, code, and message fields are correct
    - **Validates: Requirements 8.8**
  - [x] 3.3 Implement Zod validation schemas
    - Create `backend/src/validators/schemas.js` with all schemas: registerSchema, loginSchema, personalInfoSchema, addressSchema, employmentSchema, statusUpdateSchema, applicationFiltersSchema
    - Match exact field rules from the design (PH mobile regex, TIN format, ZIP code format, income ranges, etc.)
    - _Requirements: 2.5, 2.6, 2.7, 2.8_
  - [ ]* 3.4 Write property tests for Zod validation schemas
    - **Property 6: Zod validation accepts valid data and rejects invalid data with field-level errors**
    - Generate valid and invalid objects per schema using fast-check; verify pass/fail and field-level error details
    - **Validates: Requirements 2.5, 2.6, 2.7, 2.8**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Middleware stack
  - [x] 5.1 Implement correlation ID middleware
    - Create `backend/src/middleware/correlationId.js` that reads `X-Correlation-ID` from request headers or generates a UUID v4, attaches it to `req` and response headers
    - _Requirements: 8.2, 8.3_
  - [x] 5.2 Implement Winston structured logger and request logging middleware
    - Create `backend/src/utils/logger.js` with Winston configured for structured JSON output
    - Create `backend/src/middleware/requestLogger.js` that logs HTTP method, path, status code, response time, and correlation ID
    - _Requirements: 8.4_
  - [x] 5.3 Implement global error handler middleware
    - Create `backend/src/middleware/errorHandler.js` that catches AppError subclasses and unhandled errors, returning structured JSON with correlationId
    - _Requirements: 8.8_
  - [x] 5.4 Implement validation middleware factory
    - Create `backend/src/middleware/validate.js` that accepts a Zod schema and returns Express middleware; on failure throws ValidationError with field-level details
    - _Requirements: 2.8_
  - [x] 5.5 Wire middleware stack into Express app
    - Update `backend/src/app.js` to apply middleware in order: Helmet → CORS → Rate Limit → Correlation ID → Request Logger → Body Parser → Error Handler (at end)
    - Configure rate limiter to 100 requests per 15-minute window per IP
    - Configure CORS to allow FRONTEND_ORIGIN
    - _Requirements: 8.1, 8.5, 8.6, 8.7_

- [x] 6. Authentication service and routes
  - [x] 6.1 Implement AuthService
    - Create `backend/src/services/authService.js` with register, login, refreshToken, hashPassword, verifyPassword, generateTokens methods
    - Use bcrypt with cost factor ≥ 10 for password hashing
    - Generate JWT access token (short-lived) and refresh token (longer-lived) with `sub` (user ID) and `role` claims
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  - [ ]* 6.2 Write property tests for AuthService
    - **Property 1: Password hash round-trip** — hash then verify returns true; different password returns false
    - **Property 2: Authentication returns valid JWT with correct claims** — decode JWT and verify sub/role
    - **Property 3: Duplicate email registration produces conflict** — register twice with same email → ConflictError
    - **Property 4: Invalid credentials produce identical error response** — wrong email vs wrong password → same error message
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
  - [x] 6.3 Implement auth middleware
    - Create `backend/src/middleware/auth.js` with `authenticate` (verify JWT, attach user to req) and `authorize('admin')` (check role claim)
    - Return 401 for missing/invalid/expired tokens; return 403 for non-admin on admin routes
    - _Requirements: 5.2, 5.3_
  - [x] 6.4 Implement auth routes
    - Create `backend/src/routes/auth.js` with POST `/register`, POST `/login`, POST `/refresh`
    - Wire validation middleware with registerSchema and loginSchema
    - Mount under `/api/v1/auth`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1_
  - [ ]* 6.5 Write property test for admin endpoint authorization
    - **Property 12: Admin endpoint authorization** — requests without valid admin JWT get 403
    - **Validates: Requirements 5.2, 5.3**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. File service (S3 integration)
  - [x] 8.1 Implement FileService
    - Create `backend/src/services/fileService.js` with uploadDocument, getPresignedUrl, validateFile methods
    - Use @aws-sdk/client-s3 for uploads and @aws-sdk/s3-request-presigner for pre-signed URLs (15-min expiry)
    - File key pattern: `documents/{applicationId}/{documentType}/{uuid}.{extension}`
    - Validate MIME type (image/jpeg, image/png, application/pdf) and size (≤ 10 MB)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 8.2 Write property tests for FileService
    - **Property 7: File validation accepts valid files and rejects invalid files** — generate random mimetype/size combos
    - **Property 8: File key generation uniqueness and structure** — verify key contains applicationId and documentType; different inputs → different keys
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 9. Onboarding service and routes
  - [x] 9.1 Implement OnboardingService
    - Create `backend/src/services/onboardingService.js` with saveStepData, getStepData, submitApplication, getApplication methods
    - saveStepData: upsert into application_steps for the given step number
    - submitApplication: verify all 4 steps complete + documents uploaded, set status to `pending_verification`, record submitted_at timestamp
    - Enforce one active application per customer (check existing before creating)
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.3, 4.5_
  - [ ]* 9.2 Write property tests for OnboardingService
    - **Property 5: Step data persistence round-trip** — save then retrieve returns equivalent data
    - **Property 9: Complete application submission sets pending_verification** — all steps complete → status is pending_verification with non-null submitted_at
    - **Property 10: Incomplete application submission lists missing steps** — incomplete steps → 400 with missing step numbers
    - **Property 11: One active application per customer** — second submission rejected
    - **Validates: Requirements 2.2, 2.3, 4.1, 4.2, 4.3, 4.5**
  - [x] 9.3 Implement onboarding routes
    - Create `backend/src/routes/onboarding.js` with POST/GET `/steps/:stepNumber`, POST `/documents`, POST `/submit`, GET `/application`
    - Wire auth middleware (customer), validation middleware per step schema, multer for file upload
    - Mount under `/api/v1/onboarding`
    - _Requirements: 2.2, 2.3, 3.1, 4.1, 4.4, 8.1_

- [x] 10. Admin service and routes
  - [x] 10.1 Implement admin methods in OnboardingService
    - Add listApplications (paginated, filterable by status), getApplicationById, updateApplicationStatus, getStatusCounts to OnboardingService
    - updateApplicationStatus: enforce transitions only from `pending_verification`; record officer_id, timestamp, reason/note in verification_actions
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]* 10.2 Write property tests for admin operations
    - **Property 13: Status filter returns only matching applications** — filter by status returns only matching
    - **Property 14: Status count accuracy** — counts match actual application distribution
    - **Property 15: Valid status transitions record correct data** — pending → any valid target records officer, timestamp, reason/note
    - **Property 16: Invalid status transitions are rejected** — non-pending → any target returns 400
    - **Validates: Requirements 6.2, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
  - [x] 10.3 Implement admin routes
    - Create `backend/src/routes/admin.js` with GET `/applications`, GET `/applications/stats`, GET `/applications/:id`, PATCH `/applications/:id/status`
    - Wire auth middleware (admin), validation middleware with applicationFiltersSchema and statusUpdateSchema
    - Mount under `/api/v1/admin`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1_

- [x] 11. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend — Auth and shared components
  - [x] 12.1 Implement AuthContext and API client
    - Create `frontend/src/context/AuthContext.jsx` with login, register, logout, refresh logic; store tokens in memory/localStorage
    - Create `frontend/src/services/api.js` as an Axios/fetch wrapper that attaches JWT and handles token refresh
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 12.2 Implement LoginPage and RegisterPage
    - Create `frontend/src/pages/LoginPage.jsx` and `frontend/src/pages/RegisterPage.jsx` with form validation and error display
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 12.3 Implement ProtectedRoute component
    - Create `frontend/src/components/ProtectedRoute.jsx` that checks auth state and role, redirects unauthenticated users
    - _Requirements: 5.2_
  - [x] 12.4 Set up React Router in App.jsx
    - Configure routes: `/login`, `/register`, `/onboarding/*`, `/admin/*`
    - Wrap with AuthProvider
    - Apply ProtectedRoute to onboarding and admin routes
    - _Requirements: 1.1, 5.2_

- [x] 13. Frontend — Onboarding wizard
  - [x] 13.1 Implement OnboardingWizard and ProgressIndicator
    - Create `frontend/src/pages/onboarding/OnboardingWizard.jsx` orchestrating 4 steps with state management
    - Create `frontend/src/components/ProgressIndicator.jsx` showing current step and total steps
    - _Requirements: 2.1, 2.4_
  - [x] 13.2 Implement wizard step forms
    - Create `StepPersonalInfo.jsx` (full name, DOB, nationality, gender, mobile, TIN)
    - Create `StepAddress.jsx` (street, barangay, city/municipality, province, ZIP)
    - Create `StepEmployment.jsx` (employment status, employer, occupation, income range, source of funds)
    - Create `StepDocuments.jsx` (government ID upload + proof of address upload with file type/size validation)
    - Each step calls backend API to save/retrieve step data and displays validation errors
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 3.1, 3.3, 3.4_
  - [x] 13.3 Implement ApplicationSummary page
    - Create `frontend/src/pages/onboarding/ApplicationSummary.jsx` showing read-only submitted application data
    - Display after successful submission when status is `pending_verification`
    - _Requirements: 4.4_

- [x] 14. Frontend — Admin dashboard
  - [x] 14.1 Implement AdminDashboard layout and StatusCountCards
    - Create `frontend/src/pages/admin/AdminDashboard.jsx` as the main layout
    - Create `frontend/src/components/StatusCountCards.jsx` displaying counts per status
    - _Requirements: 6.1, 6.5_
  - [x] 14.2 Implement ApplicationList with filtering and pagination
    - Create `frontend/src/pages/admin/ApplicationList.jsx` with paginated table (applicant name, submission date, status) and status filter dropdown
    - _Requirements: 6.1, 6.2_
  - [x] 14.3 Implement ApplicationDetail and StatusUpdatePanel
    - Create `frontend/src/pages/admin/ApplicationDetail.jsx` showing full application info and document previews via pre-signed URLs
    - Create `frontend/src/components/StatusUpdatePanel.jsx` with approve/reject/flag buttons, reason/note inputs
    - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [x] 15. Checkpoint — Ensure frontend builds and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Containerization and seed data
  - [x] 16.1 Create backend Dockerfile
    - Create `backend/Dockerfile` based on Node.js 20 official image
    - Copy source, install dependencies, expose port, set CMD
    - _Requirements: 10.3_
  - [x] 16.2 Create Docker Compose file
    - Create `compose.yaml` defining services: backend, postgres (PostgreSQL 15 image)
    - Configure networking, environment variables, volume mounts for postgres data
    - Backend depends on postgres; postgres runs migrations on startup via entrypoint or backend startup script
    - _Requirements: 10.1, 10.2, 10.4, 10.5_
  - [x] 16.3 Implement seed script
    - Create `backend/src/db/seed.js` that is idempotent (clears existing seed data before inserting)
    - Create 2 customer accounts and 1 admin account with pre-hashed bcrypt passwords
    - Create 3 applications: one `pending_verification`, one `approved`, one `rejected`
    - Include associated application_steps, documents, and verification_actions records
    - _Requirements: 9.2, 9.3, 9.4_
  - [ ]* 16.4 Write property test for seed script idempotence
    - **Property 18: Seed script idempotence** — run seed N times (2–5), verify DB state is identical after each run
    - **Validates: Requirements 9.4**

- [x] 17. Final checkpoint — Ensure all tests pass and stack runs
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- Backend uses JavaScript (Node.js 20 + Express); frontend uses React 18 + Vite (JSX)
