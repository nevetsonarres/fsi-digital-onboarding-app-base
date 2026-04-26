# Requirements Document

## Introduction

This feature enhances the Admin Application Detail page so that Bank Officers can visually verify uploaded Government ID and Proof of Address documents directly inline, without downloading files. The page will display image previews using presigned S3 URLs, support a lightbox modal for full-size viewing, handle PDF documents with a clickable link, and show a placeholder when documents have not been uploaded.

## Glossary

- **Application_Detail_Page**: The admin page at `frontend/src/pages/admin/ApplicationDetail.jsx` that displays full details of a customer's onboarding application.
- **Document_Preview_Section**: The section within the Application Detail Page that displays inline previews of uploaded documents (government_id and proof_of_address).
- **Presigned_URL_Endpoint**: A backend API endpoint that generates time-limited S3 presigned URLs for secure document access. Route: `GET /api/v1/admin/applications/:id/documents/:docId/url`.
- **Lightbox_Modal**: A full-screen overlay component that displays an image at full resolution when the user clicks on an inline preview thumbnail.
- **Document_Placeholder**: A visual element displayed in place of a document preview when the corresponding document has not been uploaded by the customer.
- **Bank_Officer**: An admin-role user who reviews submitted onboarding applications.

## Requirements

### Requirement 1: Admin Presigned URL Endpoint

**User Story:** As a Bank Officer, I want the backend to provide presigned S3 URLs for application documents, so that the frontend can securely display inline previews without exposing raw S3 keys.

#### Acceptance Criteria

1. WHEN a Bank Officer requests a document URL via `GET /api/v1/admin/applications/:id/documents/:docId/url`, THE Presigned_URL_Endpoint SHALL return a JSON response containing a time-limited presigned S3 URL for the requested document.
2. WHEN the requested application does not exist, THE Presigned_URL_Endpoint SHALL return a 404 status with an error message.
3. WHEN the requested document does not belong to the specified application, THE Presigned_URL_Endpoint SHALL return a 404 status with an error message.
4. THE Presigned_URL_Endpoint SHALL require a valid admin JWT token and admin role authorization before processing the request.
5. THE Presigned_URL_Endpoint SHALL generate presigned URLs with the same expiry duration used by the existing fileService (15 minutes).

### Requirement 2: Inline Document Image Preview

**User Story:** As a Bank Officer, I want to see inline image previews of uploaded Government ID and Proof of Address documents on the Application Detail Page, so that I can visually verify documents without downloading them.

#### Acceptance Criteria

1. WHEN the Application Detail Page loads and the application has uploaded image documents (JPEG or PNG), THE Document_Preview_Section SHALL display inline thumbnail previews for each document using presigned S3 URLs.
2. WHEN the Application Detail Page loads and the application has uploaded image documents, THE Document_Preview_Section SHALL display the document type label ("Government ID" or "Proof of Address") above each preview.
3. WHEN the Application Detail Page loads and the application has uploaded image documents, THE Document_Preview_Section SHALL display the original filename and file size below each preview.
4. THE Document_Preview_Section SHALL render image thumbnails with a maximum height of 200 pixels and preserve the original aspect ratio.

### Requirement 3: PDF Document Handling

**User Story:** As a Bank Officer, I want to access uploaded PDF documents via a clickable link, so that I can review non-image documents in a new browser tab.

#### Acceptance Criteria

1. WHEN the Application Detail Page loads and a document has a PDF mime type, THE Document_Preview_Section SHALL display a clickable link labeled "View PDF" instead of an inline image preview.
2. WHEN a Bank Officer clicks the PDF link, THE Document_Preview_Section SHALL open the presigned S3 URL in a new browser tab.

### Requirement 4: Lightbox Modal for Full-Size Image Viewing

**User Story:** As a Bank Officer, I want to click on a document thumbnail to view the full-size image in a modal overlay, so that I can inspect document details closely.

#### Acceptance Criteria

1. WHEN a Bank Officer clicks on an inline image thumbnail, THE Lightbox_Modal SHALL open and display the full-resolution image centered on the screen with a dark overlay background.
2. WHEN the Lightbox_Modal is open, THE Lightbox_Modal SHALL display a close button that dismisses the modal.
3. WHEN a Bank Officer clicks on the dark overlay background outside the image, THE Lightbox_Modal SHALL close.
4. WHEN a Bank Officer presses the Escape key while the Lightbox_Modal is open, THE Lightbox_Modal SHALL close.
5. THE Lightbox_Modal SHALL scale the full-resolution image to fit within the viewport while preserving the aspect ratio.

### Requirement 5: Document Not Uploaded Placeholder

**User Story:** As a Bank Officer, I want to see a clear placeholder when a document has not been uploaded, so that I can quickly identify missing documents.

#### Acceptance Criteria

1. WHEN the Application Detail Page loads and the government_id document has not been uploaded, THE Document_Preview_Section SHALL display a placeholder with the text "Not uploaded" under the "Government ID" label.
2. WHEN the Application Detail Page loads and the proof_of_address document has not been uploaded, THE Document_Preview_Section SHALL display a placeholder with the text "Not uploaded" under the "Proof of Address" label.
3. THE Document_Preview_Section SHALL always display both document slots (Government ID and Proof of Address) regardless of whether documents have been uploaded.
