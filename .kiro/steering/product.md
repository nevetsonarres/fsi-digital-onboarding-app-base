# Product Overview

AnyBank Digital Onboarding Portal — a full-stack web application for Philippine bank customer onboarding.

## What It Does

- Customers register, then complete a multi-step onboarding wizard: personal info, address, employment, and document uploads (government ID, proof of address).
- Customers submit their application for verification.
- Admin users review submitted applications, approve/reject/flag them, and track status counts on a dashboard.

## User Roles

- **Customer**: Registers, fills out onboarding steps, uploads documents, submits application.
- **Admin**: Reviews applications, updates statuses (approved, rejected, flagged_branch_visit, flagged_home_verification).

## Application Lifecycle

`draft` → `pending_verification` → `approved` | `rejected` | `flagged_branch_visit` | `flagged_home_verification`

Status transitions are only allowed from `pending_verification`.

## Key Domain Concepts

- Applications have 4 steps (personal info, address, employment, documents), each saved independently.
- Documents are stored in S3 with presigned URLs for upload/download.
- One active application per customer (enforced at the service layer).
- Philippine-specific validations: PH mobile format (+63/0 prefix), TIN format, 4-digit zip codes, barangay/province address fields.
