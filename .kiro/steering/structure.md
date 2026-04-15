# Project Structure

Monorepo with `backend/`, `frontend/`, and `terraform/` at the root.

## Backend (`backend/`)

```
src/
  app.js                  # Express app setup, middleware chain, route mounting
  config/index.js         # Centralized env-based configuration
  db/
    pool.js               # PostgreSQL connection pool and query helper
    migrate.js            # Schema migration script
    seed.js               # Test data seeder
  errors/index.js         # AppError hierarchy (ValidationError, UnauthorizedError, etc.)
  middleware/
    auth.js               # authenticate() and authorize(role) middleware
    correlationId.js      # Attaches correlation ID to requests
    errorHandler.js       # Global error handler (AppError → structured JSON)
    requestLogger.js      # Request logging via Winston
    validate.js           # Zod schema validation middleware factory
  routes/
    auth.js               # /api/v1/auth — register, login, refresh
    onboarding.js         # /api/v1/onboarding — customer application steps
    admin.js              # /api/v1/admin — admin review and status updates
  services/
    authService.js        # Registration, login, token generation
    onboardingService.js  # Application CRUD, step management, status transitions
    fileService.js        # S3 document upload/download with presigned URLs
  utils/logger.js         # Winston logger instance
  validators/schemas.js   # All Zod schemas (register, login, steps, admin actions)
tests/
  unit/                   # Jest unit tests
  integration/            # Integration tests
  property/               # fast-check property-based tests
```

## Frontend (`frontend/`)

```
src/
  App.jsx                 # Root component with routing
  main.jsx                # Entry point, Cloudscape global styles
  context/
    AuthContext.jsx        # Auth state, login/register/logout, token management
  components/
    AppLayout.jsx         # Cloudscape AppLayout shell
    ProtectedRoute.jsx    # Role-based route guard
    ProgressIndicator.jsx # Onboarding step progress
    StatusCountCards.jsx   # Admin dashboard status cards
    StatusUpdatePanel.jsx  # Admin status update form
  pages/
    LoginPage.jsx
    RegisterPage.jsx
    onboarding/           # Customer onboarding wizard steps
    admin/                # Admin dashboard, application list, detail view
  services/
    api.js                # Fetch wrapper with JWT auth and token refresh
```

## Conventions

- **API routes** are versioned under `/api/v1/`.
- **Route → Service pattern**: Routes handle HTTP concerns, services contain business logic and DB queries.
- **Error handling**: Throw typed errors from `errors/index.js`; the global error handler serializes them.
- **Validation**: Define Zod schemas in `validators/schemas.js`, apply via `validate(schema)` middleware in routes.
- **Frontend state**: React Context for auth; component-local state for forms.
- **Frontend UI**: Use Cloudscape components — do not introduce other UI libraries.
