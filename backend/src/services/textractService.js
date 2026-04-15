const { TextractClient, AnalyzeIDCommand } = require('@aws-sdk/client-textract');
const config = require('../config');
const { TextractError } = require('../errors');

const textractClient = new TextractClient({
  region: config.s3Region,
  ...(config.awsAccessKeyId && config.awsSecretAccessKey
    ? {
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
          ...(config.awsSessionToken ? { sessionToken: config.awsSessionToken } : {}),
        },
      }
    : {}),
});

const FIELD_MAPPING = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  FULL_NAME: 'fullName',
  DATE_OF_BIRTH: 'dateOfBirth',
  DOCUMENT_NUMBER: 'idNumber',
  EXPIRATION_DATE: 'expiryDate',
  ADDRESS: 'address',
};

async function analyzeGovernmentId(s3Key) {
  const command = new AnalyzeIDCommand({
    DocumentPages: [
      {
        S3Object: {
          Bucket: config.s3BucketName,
          Name: s3Key,
        },
      },
    ],
  });

  try {
    const response = await textractClient.send(command);
    return response;
  } catch (error) {
    throw new TextractError(
      `Textract AnalyzeID failed: ${error.message}`,
      { originalError: error.name, s3Key }
    );
  }
}

function parseTextractResponse(response) {
  const extractedData = {
    fullName: null,
    dateOfBirth: null,
    idNumber: null,
    expiryDate: null,
    address: null,
  };
  const confidenceScores = {
    fullName: null,
    dateOfBirth: null,
    idNumber: null,
    expiryDate: null,
    address: null,
  };

  const rawFields = {};

  const documents = response.IdentityDocuments || [];
  for (const doc of documents) {
    const fields = doc.IdentityDocumentFields || [];
    for (const field of fields) {
      const typeText = field.Type && field.Type.Text;
      const valueText = field.ValueDetection && field.ValueDetection.Text;
      const confidence = field.ValueDetection && field.ValueDetection.Confidence;

      if (!typeText || !FIELD_MAPPING[typeText]) continue;

      const mappedField = FIELD_MAPPING[typeText];

      if (mappedField === 'firstName' || mappedField === 'lastName') {
        rawFields[mappedField] = { value: valueText || '', confidence: confidence || 0 };
      } else {
        extractedData[mappedField] = valueText || null;
        confidenceScores[mappedField] = confidence != null ? confidence : null;
      }
    }
  }

  if (!extractedData.fullName && (rawFields.firstName || rawFields.lastName)) {
    const parts = [];
    const confidences = [];
    if (rawFields.firstName && rawFields.firstName.value) {
      parts.push(rawFields.firstName.value);
      confidences.push(rawFields.firstName.confidence);
    }
    if (rawFields.lastName && rawFields.lastName.value) {
      parts.push(rawFields.lastName.value);
      confidences.push(rawFields.lastName.confidence);
    }
    if (parts.length > 0) {
      extractedData.fullName = parts.join(' ');
      confidenceScores.fullName =
        confidences.length > 0
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : null;
    }
  }

  return { extractedData, confidenceScores };
}

function crossReferenceData(extractedData, confidenceScores, personalInfo) {
  const mismatches = {};

  const fieldComparisons = [
    {
      field: 'fullName',
      extracted: extractedData.fullName,
      entered: personalInfo.firstName && personalInfo.lastName
        ? `${personalInfo.firstName} ${personalInfo.lastName}`
        : null,
    },
    {
      field: 'dateOfBirth',
      extracted: extractedData.dateOfBirth,
      entered: personalInfo.dateOfBirth || null,
    },
  ];

  for (const { field, extracted, entered } of fieldComparisons) {
    const confidence = confidenceScores[field];

    if (confidence != null && confidence < 80) {
      mismatches[field] = {
        status: 'low_confidence',
        extracted: extracted || null,
        entered: entered || null,
      };
      continue;
    }

    if (extracted == null || entered == null) {
      mismatches[field] = {
        status: 'mismatch',
        extracted: extracted || null,
        entered: entered || null,
      };
      continue;
    }

    const normalizedExtracted = extracted.trim().toLowerCase();
    const normalizedEntered = entered.trim().toLowerCase();

    mismatches[field] = {
      status: normalizedExtracted === normalizedEntered ? 'match' : 'mismatch',
      extracted,
      entered,
    };
  }

  return mismatches;
}

function determineExtractionStatus(confidenceScores) {
  const scores = Object.values(confidenceScores).filter((s) => s != null);

  if (scores.length === 0) {
    return 'needs_retry';
  }

  const allBelowThreshold = scores.every((s) => s < 60);
  return allBelowThreshold ? 'needs_retry' : 'completed';
}

module.exports = {
  analyzeGovernmentId,
  parseTextractResponse,
  crossReferenceData,
  determineExtractionStatus,
};
