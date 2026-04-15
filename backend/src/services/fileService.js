const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');
const { ValidationError } = require('../errors');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRESIGNED_URL_EXPIRY = 15 * 60;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

const s3Client = new S3Client({
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

function validateFile(file) {
  if (!file) {
    throw new ValidationError('File is required');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Unsupported file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size ${file.size} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes (10 MB)`
    );
  }
}

function generateFileKey(applicationId, documentType, mimetype) {
  const ext = MIME_TO_EXT[mimetype] || 'bin';
  return `documents/${applicationId}/${documentType}/${uuidv4()}.${ext}`;
}

async function uploadDocument(fileBuffer, metadata) {
  const { applicationId, documentType, mimetype, originalFilename } = metadata;
  const key = generateFileKey(applicationId, documentType, mimetype);
  const command = new PutObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
    Metadata: {
      'original-filename': originalFilename || 'unknown',
      'application-id': applicationId,
      'document-type': documentType,
    },
  });
  await s3Client.send(command);
  return { key };
}

async function getPresignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRY });
}

module.exports = {
  validateFile,
  generateFileKey,
  uploadDocument,
  getPresignedUrl,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  PRESIGNED_URL_EXPIRY,
};
