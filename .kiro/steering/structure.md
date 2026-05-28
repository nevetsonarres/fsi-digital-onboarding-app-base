# Project Structure

```
digital-onboarding-app/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.js             # Express app setup and middleware chain
│   │   ├── config/            # Environment-based configuration
│   │   ├── db/                # Database pool, migrations, seed scripts
│   │   ├── errors/            # Custom error classes (NotFoundError, etc.)
│   │   ├── middleware/        # Auth, validation, logging, error handler
│   │   ├── routes/            # Route handlers (auth, onboarding, admin)
│   │   ├── services/          # Business logic layer
│   │   ├── utils/             # Logger and shared utilities
│   │   └── validators/        # Zod schemas for request validation
│   └── tests/
│       ├── unit/              # Unit tests
│       ├── integration/       # Integration tests
│       └── property/          # Property-based tests (fast-check)
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── App.jsx            # Root component with routing
│   │   ├── main.jsx           # Entry point
│   │   ├── components/        # Shared UI components
│   │   ├── context/           # React context providers (AuthContext)
│   │   ├── pages/             # Page-level components
│   │   │   ├── admin/         # Admin dashboard views
│   │   │   └── onboarding/    # Customer onboarding wizard steps
│   │   └── services/          # API client utilities
│   └── public/                # Static assets (logo)
├── compose.yaml               # Docker Compose (PostgreSQL + backend)
├── architecture-diagram.md    # AWS architecture overview
└── .env.example               # Environment variable template
```

## Architecture Layers (Backend)

1. **Routes** — HTTP interface, parameter parsing, response formatting
2. **Middleware** — Cross-cutting concerns (auth, validation, logging)
3. **Services** — Business logic and orchestration
4. **DB** — Raw SQL queries via `pg` pool (no ORM)

## Key Patterns

- Routes delegate to services; services own business rules and DB access.
- One service file per domain area (auth, onboarding, file handling).
- Middleware is composed per-route: `authenticate` → `authorize(role)` → `validate(schema)` → handler.
- Frontend pages map to routes; shared components live in `components/`.
- Context providers (e.g., AuthContext) manage global state.
