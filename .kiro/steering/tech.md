# Tech Stack & Build

## Backend

- **Runtime**: Node.js 20+ (CommonJS modules)
- **Framework**: Express 4
- **Database**: PostgreSQL 15 via `pg` (raw SQL, no ORM)
- **Validation**: Zod schemas
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing
- **File Storage**: AWS S3 via @aws-sdk/client-s3, presigned URLs
- **Logging**: Winston (structured JSON logs)
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Jest + Supertest + fast-check (property-based testing)

## Frontend

- **Framework**: React 18 (JSX, functional components, hooks)
- **Build Tool**: Vite 5
- **UI Library**: AWS Cloudscape Design Components
- **Routing**: React Router v7
- **Module System**: ES modules

## Infrastructure

- Docker Compose for local development (PostgreSQL + backend)
- Dockerfile for backend container
- Target: AWS ECS Fargate, RDS, S3, CloudFront

## Common Commands

```bash
# Backend
cd backend
npm start              # Production start
npm run dev            # Dev with --watch
npm test               # Run Jest tests
npm run seed           # Seed database

# Frontend
cd frontend
npm run dev            # Vite dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production build

# Docker (from project root)
docker compose up      # Start PostgreSQL + backend
docker compose down    # Stop services
```

## Environment

- Config via environment variables (see `.env.example`)
- Backend port: 3000, Frontend dev port: 5173
- Database auto-migrates on container start (`node src/db/migrate.js`)

## Code Conventions

- Backend uses CommonJS (`require`/`module.exports`)
- Frontend uses ES modules (`import`/`export`)
- Validation schemas defined in `backend/src/validators/schemas.js` using Zod
- Custom error classes in `backend/src/errors/index.js` for structured error handling
- API routes versioned under `/api/v1/`
- Middleware pattern: authenticate → authorize(role) → validate(schema) → handler
