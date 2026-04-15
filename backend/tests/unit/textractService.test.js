const { TextractError } = require('../../src/errors');

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-textract', () => ({
  TextractClient: jest.fn(() => ({ send: mockSend })),
  AnalyzeIDCommand: jest.fn((params) => params),
}));

const { analyzeGovernmentId, parseTextractResponse, crossReferenceData, determineExtractionStatus } = require('../../src/services/textractService');

describe('textractService', () => {
  afterEach(() => { jest.clearAllMocks(); });

  describe('analyzeGovernmentId', () => {
    test('calls Textract AnalyzeID with correct S3 reference and returns response', async () => {
      const mockResponse = { IdentityDocuments: [] };
      mockSend.mockResolvedValue(mockResponse);
      const result = await analyzeGovernmentId('documents/app-1/government_id/test.jpg');
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.DocumentPages[0].S3Object.Name).toBe('documents/app-1/government_id/test.jpg');
      expect(result).toEqual(mockResponse);
    });

    test('wraps Textract API errors in TextractError', async () => {
      const apiError = new Error('Service unavailable');
      apiError.name = 'InternalServerError';
      mockSend.mockRejectedValue(apiError);
      await expect(analyzeGovernmentId('some-key')).rejects.toThrow(TextractError);
      await expect(analyzeGovernmentId('some-key')).rejects.toMatchObject({ statusCode: 502, code: 'TEXTRACT_ERROR' });
    });
  });

  describe('parseTextractResponse', () => {
    test('extracts fields from FIRST_NAME + LAST_NAME', () => {
      const response = { IdentityDocuments: [{ IdentityDocumentFields: [
        { Type: { Text: 'FIRST_NAME' }, ValueDetection: { Text: 'Juan', Confidence: 95 } },
        { Type: { Text: 'LAST_NAME' }, ValueDetection: { Text: 'Dela Cruz', Confidence: 92 } },
        { Type: { Text: 'DATE_OF_BIRTH' }, ValueDetection: { Text: '1990-05-15', Confidence: 98 } },
        { Type: { Text: 'DOCUMENT_NUMBER' }, ValueDetection: { Text: '1234-5678', Confidence: 90 } },
        { Type: { Text: 'EXPIRATION_DATE' }, ValueDetection: { Text: '2028-12-31', Confidence: 88 } },
        { Type: { Text: 'ADDRESS' }, ValueDetection: { Text: '123 Rizal St, Makati', Confidence: 72 } },
      ]}]};
      const { extractedData, confidenceScores } = parseTextractResponse(response);
      expect(extractedData.fullName).toBe('Juan Dela Cruz');
      expect(extractedData.dateOfBirth).toBe('1990-05-15');
      expect(extractedData.idNumber).toBe('1234-5678');
      expect(extractedData.expiryDate).toBe('2028-12-31');
      expect(extractedData.address).toBe('123 Rizal St, Makati');
      expect(confidenceScores.fullName).toBe(93.5);
      expect(confidenceScores.dateOfBirth).toBe(98);
    });

    test('uses FULL_NAME when available', () => {
      const response = { IdentityDocuments: [{ IdentityDocumentFields: [
        { Type: { Text: 'FULL_NAME' }, ValueDetection: { Text: 'Juan Dela Cruz', Confidence: 96 } },
      ]}]};
      const { extractedData, confidenceScores } = parseTextractResponse(response);
      expect(extractedData.fullName).toBe('Juan Dela Cruz');
      expect(confidenceScores.fullName).toBe(96);
    });

    test('handles empty response', () => {
      const { extractedData, confidenceScores } = parseTextractResponse({});
      expect(extractedData.fullName).toBeNull();
      expect(confidenceScores.fullName).toBeNull();
    });
  });

  describe('crossReferenceData', () => {
    test('returns match for matching fields (case-insensitive)', () => {
      const result = crossReferenceData(
        { fullName: 'JUAN DELA CRUZ', dateOfBirth: '1990-05-15' },
        { fullName: 95, dateOfBirth: 98 },
        { firstName: 'Juan', lastName: 'Dela Cruz', dateOfBirth: '1990-05-15' }
      );
      expect(result.fullName.status).toBe('match');
      expect(result.dateOfBirth.status).toBe('match');
    });

    test('returns mismatch for non-matching fields', () => {
      const result = crossReferenceData(
        { fullName: 'Juan Santos', dateOfBirth: '1990-05-16' },
        { fullName: 95, dateOfBirth: 98 },
        { firstName: 'Juan', lastName: 'Dela Cruz', dateOfBirth: '1990-05-15' }
      );
      expect(result.fullName.status).toBe('mismatch');
      expect(result.dateOfBirth.status).toBe('mismatch');
    });

    test('returns low_confidence when confidence < 80', () => {
      const result = crossReferenceData(
        { fullName: 'Juan Dela Cruz', dateOfBirth: '1990-05-15' },
        { fullName: 70, dateOfBirth: 55 },
        { firstName: 'Juan', lastName: 'Dela Cruz', dateOfBirth: '1990-05-15' }
      );
      expect(result.fullName.status).toBe('low_confidence');
      expect(result.dateOfBirth.status).toBe('low_confidence');
    });

    test('handles null extracted values as mismatch', () => {
      const result = crossReferenceData(
        { fullName: null, dateOfBirth: null },
        { fullName: null, dateOfBirth: null },
        { firstName: 'Juan', lastName: 'Dela Cruz', dateOfBirth: '1990-05-15' }
      );
      expect(result.fullName.status).toBe('mismatch');
      expect(result.dateOfBirth.status).toBe('mismatch');
    });
  });

  describe('determineExtractionStatus', () => {
    test('returns completed when any field has confidence >= 60', () => {
      expect(determineExtractionStatus({ fullName: 95, dateOfBirth: 50, idNumber: 80 })).toBe('completed');
    });
    test('returns needs_retry when all fields have confidence < 60', () => {
      expect(determineExtractionStatus({ fullName: 30, dateOfBirth: 45, idNumber: 55 })).toBe('needs_retry');
    });
    test('returns needs_retry when all confidence scores are null', () => {
      expect(determineExtractionStatus({ fullName: null, dateOfBirth: null })).toBe('needs_retry');
    });
    test('returns completed when at least one score is exactly 60', () => {
      expect(determineExtractionStatus({ fullName: 59, dateOfBirth: 60 })).toBe('completed');
    });
  });
});
