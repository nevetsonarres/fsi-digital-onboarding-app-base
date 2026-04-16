# Implementation Plan: Admin Document Image Preview

## Overview

Add inline document image previews, a lightbox modal, PDF link handling, and "Not uploaded" placeholders to the Admin Application Detail page. The backend gets a new presigned URL endpoint with validation; the frontend gets a new `DocumentLightbox` component and a refactored Documents section that always renders both document slots.

## Tasks

- [x] 1. Add backend presigned URL endpoint and service function
  - [x] 1.1 Add `getDocumentUrl(applicationId, documentId)` to `onboardingService.js`
    - Query `documents` table for a row matching both `application_id` and `id`
    - Throw `NotFoundError('Document')` if no match
    - Call `fileService.getPresignedUrl(doc.file_key)` and return the URL
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Add `documentUrlParamsSchema` to `validators/schemas.js`
    - Zod schema validating `id` and `docId` as UUID strings
    - _Requirements: 1.4_

  - [x] 1.3 Add `GET /applications/:id/documents/:docId/url` route to `routes/admin.js`
    - Validate params with `documentUrlParamsSchema`
    - Call `onboardingService.getDocumentUrl` and return `{ url }`
    - Wrap in try/catch passing errors to `next()`
    - Existing `authenticate` + `authorize('admin')` middleware already applied to all admin routes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.4 Write unit tests for `getDocumentUrl` service function
    - Test returns presigned URL for valid application + document pair
    - Test throws `NotFoundError` when document doesn't exist
    - Test throws `NotFoundError` when document doesn't belong to application
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.5 Write unit tests for the document URL route handler
    - Test 200 with `{ url }` for valid request
    - Test 404 for missing document
    - Test 400 for invalid UUID params
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.6 Write property test for document URL retrieval (Property 1)
    - **Property 1: Document URL retrieval returns a URL for any valid application-document pair**
    - Generate random UUIDs for applicationId and documentId, random S3 keys
    - Mock DB to return a matching document row, mock `fileService.getPresignedUrl` to return a URL string
    - Assert `getDocumentUrl` always returns a non-empty string
    - **Validates: Requirements 1.1**

- [x] 2. Checkpoint — Backend endpoint complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create `DocumentLightbox` component
  - [x] 3.1 Create `frontend/src/components/DocumentLightbox.jsx`
    - Use Cloudscape `Modal` component
    - Props: `visible`, `imageSrc`, `altText`, `onClose`
    - Display image scaled to fit viewport (`max-width: 90vw`, `max-height: 90vh`, `object-fit: contain`)
    - Close button in modal header
    - Closes on overlay click and Escape key (Cloudscape Modal defaults)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.2 Write unit tests for `DocumentLightbox`
    - Test renders modal with image when `visible` is true
    - Test does not render when `visible` is false
    - Test calls `onClose` when close button is clicked
    - Test image has correct scaling styles
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 4. Refactor `ApplicationDetail.jsx` Documents section
  - [x] 4.1 Refactor Documents section to always render both document slots
    - Iterate over fixed list `['government_id', 'proof_of_address']`
    - Display label "Government ID" or "Proof of Address" above each slot
    - For image documents (JPEG/PNG): render clickable thumbnail (max-height 200px, preserve aspect ratio) with filename and file size in KB
    - For PDF documents: render "View PDF" link opening presigned URL in new tab, with filename and file size
    - For missing documents: render "Not uploaded" placeholder text
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 5.1, 5.2, 5.3_

  - [x] 4.2 Wire `DocumentLightbox` into `ApplicationDetail.jsx`
    - Add `lightbox` state: `{ visible: false, src: '', alt: '' }`
    - Clicking an image thumbnail opens the lightbox with that image's presigned URL and alt text
    - Import and render `DocumentLightbox` component
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.3 Write property test for both document slots always rendering (Property 3)
    - **Property 3: Both document slots always render**
    - Generate random subsets of `['government_id', 'proof_of_address']` as uploaded document types
    - Render the Documents section
    - Assert output always contains both "Government ID" and "Proof of Address" labels
    - **Validates: Requirements 5.3**

  - [ ]* 4.4 Write property test for image document rendering completeness (Property 2)
    - **Property 2: Image document rendering completeness**
    - Generate random document objects with image mime types, random non-empty filenames, random positive file sizes
    - Render the document preview
    - Assert output contains an `<img>` with the URL as src, the filename text, and file size formatted as KB
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 4.5 Write unit tests for Documents section rendering
    - Test renders image thumbnail for JPEG/PNG documents
    - Test renders "View PDF" link for PDF documents
    - Test renders "Not uploaded" placeholder for missing government_id
    - Test renders "Not uploaded" placeholder for missing proof_of_address
    - Test clicking image thumbnail opens lightbox with correct URL
    - Test both document slots render when only one document is uploaded
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 5.1, 5.2, 5.3_

- [x] 5. Final checkpoint — All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- The backend reuses existing `fileService.getPresignedUrl` and error handling patterns
- The frontend reuses existing Cloudscape components and `api.js` fetch wrapper
