const { Router } = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  personalInfoSchema,
  addressSchema,
  employmentSchema,
} = require('../validators/schemas');
const onboardingService = require('../services/onboardingService');
const fileService = require('../services/fileService');
const textractService = require('../services/textractService');
const pool = require('../db/pool');
const { ValidationError } = require('../errors');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(authorize('customer'));

const stepSchemas = {
  1: personalInfoSchema,
  2: addressSchema,
  3: employmentSchema,
};

router.post('/steps/:stepNumber', (req, res, next) => {
  const stepNumber = parseInt(req.params.stepNumber, 10);
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 4) {
    return next(new ValidationError('Step number must be between 1 and 4'));
  }
  if (stepNumber === 4) return next();
  const schema = stepSchemas[stepNumber];
  if (schema) return validate(schema)(req, res, next);
  next();
}, async (req, res, next) => {
  try {
    const stepNumber = parseInt(req.params.stepNumber, 10);
    await onboardingService.saveStepData(req.user.sub, stepNumber, req.body);
    res.status(200).json({ message: 'Step data saved' });
  } catch (err) { next(err); }
});

router.get('/steps/:stepNumber', async (req, res, next) => {
  try {
    const stepNumber = parseInt(req.params.stepNumber, 10);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 4) {
      return next(new ValidationError('Step number must be between 1 and 4'));
    }
    const data = await onboardingService.getStepData(req.user.sub, stepNumber);
    res.status(200).json({ stepNumber, data });
  } catch (err) { next(err); }
});

router.post('/documents', upload.single('file'), async (req, res, next) => {
  try {
    const { documentType } = req.body;
    if (!documentType || !['government_id', 'proof_of_address'].includes(documentType)) {
      throw new ValidationError('documentType must be government_id or proof_of_address');
    }
    fileService.validateFile(req.file);
    const app = await onboardingService.getOrCreateApplication(req.user.sub);
    const { key } = await fileService.uploadDocument(req.file.buffer, {
      applicationId: app.id, documentType,
      mimetype: req.file.mimetype, originalFilename: req.file.originalname,
    });
    await pool.query(
      `INSERT INTO documents (application_id, document_type, file_key, original_filename, mime_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (application_id, document_type)
       DO UPDATE SET file_key = $3, original_filename = $4, mime_type = $5, file_size = $6, uploaded_at = NOW()`,
      [app.id, documentType, key, req.file.originalname, req.file.mimetype, req.file.size]
    );
    res.status(201).json({ key, documentType });
  } catch (err) { next(err); }
});

router.post('/verify-id', async (req, res, next) => {
  try {
    const application = await onboardingService.getOrCreateApplication(req.user.sub);
    const docResult = await pool.query(
      "SELECT * FROM documents WHERE application_id = $1 AND document_type = 'government_id'",
      [application.id]
    );
    if (docResult.rows.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No government ID document uploaded' },
      });
    }
    const document = docResult.rows[0];
    const existingVerification = await onboardingService.getEkycVerificationByDocument(document.id);
    if (existingVerification) {
      return res.status(200).json({
        extractedData: existingVerification.extracted_data,
        confidenceScores: existingVerification.confidence_scores,
        mismatches: existingVerification.mismatches,
        extractionStatus: existingVerification.extraction_status,
      });
    }
    const personalInfo = await onboardingService.getStepData(req.user.sub, 1);
    const rawResponse = await textractService.analyzeGovernmentId(document.file_key);
    const { extractedData, confidenceScores } = textractService.parseTextractResponse(rawResponse);
    const mismatches = textractService.crossReferenceData(extractedData, confidenceScores, personalInfo || {});
    const extractionStatus = textractService.determineExtractionStatus(confidenceScores);
    await onboardingService.createEkycVerification(application.id, document.id, {
      extractionStatus, extractedData, confidenceScores, mismatches, rawTextractResponse: rawResponse,
    });
    res.status(200).json({
      extractedData, confidenceScores, mismatches, extractionStatus,
      ...(extractionStatus === 'needs_retry' ? { message: 'Image quality too low. Please re-upload a clearer image.' } : {}),
    });
  } catch (err) { next(err); }
});

router.post('/submit', async (req, res, next) => {
  try {
    const application = await onboardingService.submitApplication(req.user.sub);
    res.status(200).json(application);
  } catch (err) { next(err); }
});

router.get('/application', async (req, res, next) => {
  try {
    const application = await onboardingService.getApplication(req.user.sub);
    if (!application) return res.status(200).json(null);
    res.status(200).json(application);
  } catch (err) { next(err); }
});

module.exports = router;
