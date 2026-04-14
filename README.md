# AnyBank Digital Onboarding Portal

Full-stack Philippine bank onboarding portal with React 18 frontend and Node.js 20 backend.

## Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/nevetsonarres/fsi-digital-onboarding-app-base.git
cd fsi-digital-onboarding-app-base

# 2. Install backend dependencies
cd backend && npm install && cd ..

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials (from terraform output)

# 5. Start the stack
docker compose up -d

# 6. Start frontend dev server
cd frontend && npm run dev
```

## Infrastructure

Terraform provisions the S3 bucket and IAM credentials:

```bash
cd terraform
terraform init
terraform apply
terraform output -raw aws_access_key_id
terraform output -raw aws_secret_access_key
```

## Test Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| customer1@example.com | Password123! | Customer |
| admin@example.com | Password123! | Admin |
