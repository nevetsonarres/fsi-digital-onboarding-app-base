# Requirements Document

## Introduction

This document defines the requirements for US-9.2: Government ID OCR & Data Extraction using Amazon Textract. The feature automatically extracts text data from uploaded government-issued IDs during the onboarding process, cross-references extracted fields against customer-entered personal information, and stores verification results with confidence scores. This enables automated identity verification as part of the eKYC (Electronic Know Your Customer) flow, reducing manual review effort for bank officers while maintaining BSP compliance. The implementation integrates with the existing document upload pipeline (S3), onboarding service, and admin review dashboard.

## Glossary

- **Textract_Service**: The backend service responsible for calling Amazon Textract AnalyzeID API and processing OCR results
- **eKYC_Verification**: A database record storing the OCR extraction results, confidence scores, mismatch flags, and verification status for a given government ID document
- **Confidence_Score**: A numeric value (0–100) returned by Amazon Textract indicating the reliability of an extracted field
- **Data_Mismatch**: A discrepancy between a field extracted via OCR and the corresponding customer-entered value from Step 1 (Personal Information)
- **ID_Type**: The category of Philippine government-issued ID (PhilSys, SSS, UMID, Passport, Driver's License, PRC ID)
- **Extraction_Status**: The state of an OCR verification attempt: `pending`, `completed`, `failed`, `needs_retry`
