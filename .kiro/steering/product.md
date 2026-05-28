# Product Overview

PH Bank Onboarding Portal — a digital customer onboarding application for a Philippine bank.

## What It Does

- Customers register, complete a multi-step onboarding wizard (personal info, address, employment, document upload), and submit their application for review.
- Bank officers (admins) review submitted applications, verify documents, and approve/reject/flag applications.

## User Roles

- **Customer**: Self-service account opening via a guided wizard.
- **Admin (Bank Officer)**: Reviews and acts on submitted applications from a dashboard.

## Domain Context

- Philippine banking context: TIN format (###-###-###-###), PH mobile numbers (+63/0 prefix), barangay-level addresses, peso income ranges.
- Document types: government ID and proof of address (uploaded to S3).
- Application lifecycle: `draft` → `pending_verification` → `approved` | `rejected` | `flagged_branch_visit` | `flagged_home_verification`.

## Target Deployment

AWS ap-southeast-1: ECS Fargate (backend), S3 + CloudFront (frontend), RDS PostgreSQL 15, S3 (document storage).
