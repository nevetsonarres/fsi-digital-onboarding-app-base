# Tech Stack & Build

## Backend

- **Runtime**: Node.js >= 20 (CommonJS modules, `require`/`module.exports`)
- **Framework**: Express 4
- **Database**: PostgreSQL 15 via `pg` (raw SQL with parameterized queries, no ORM)
- **Auth**: JWT (access + refresh tokens) with `jsonwebtoken`, passwords hashed with `bcrypt`
- **Validation**: Zod schemas applied via `validate()` middleware
- **File Storage**: AWS S3 via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Jest (unit tests), fast-check (property-based tests), supertest (HTTP assertions)

## Frontend

- **Framework**: React 18 (JSX, functional components, hooks)
- **UI Library**: AWS Cloudscape Design Components
- **Routing**: React Router v7
- **Build Tool**: Vite 5
- **API Client**: Custom fetch wrapper (`frontend/src/services/api.js`) — no axios

## Infrastructure

- **Containerization**: Docker Compose (PostgreSQL + backend)
- **IaC**: Terraform (AWS S3 bucket, IAM user for backend S3 access)
- **Region**: ap-southeast-1

## Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server (node --watch)
npm test             # Run Jest tests
npm run seed         # Seed test data

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build

# Docker
docker compose up -d          # Start PostgreSQL + backend
docker compose down            # Stop all services

# Terraform
cd terraform
terraform init
terraform apply
```

## Environment

Configuration is via environment variables loaded in `backend/src/config/index.js`. A `.env.example` file documents required vars. The Vite dev server proxies `/api` requests to `localhost:3000`.
