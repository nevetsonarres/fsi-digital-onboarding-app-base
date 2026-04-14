const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const personalInfoSchema = z.object({
  fullName: z.string().min(1).max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationality: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'other']),
  mobileNumber: z.string().regex(/^(\+63|0)\d{10}$/),
  tin: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/),
});

const addressSchema = z.object({
  streetAddress: z.string().min(1).max(500),
  barangay: z.string().min(1).max(255),
  cityMunicipality: z.string().min(1).max(255),
  province: z.string().min(1).max(255),
  zipCode: z.string().regex(/^\d{4}$/),
});

const employmentSchema = z.object({
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
  employerName: z.string().max(255).optional(),
  occupation: z.string().min(1).max(255),
  monthlyIncomeRange: z.enum([
    'below_10000', '10000_25000', '25000_50000',
    '50000_100000', '100000_250000', 'above_250000',
  ]),
  sourceOfFunds: z.enum([
    'salary', 'business_income', 'investments',
    'remittance', 'pension', 'other',
  ]),
});

const statusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'flagged_branch_visit', 'flagged_home_verification']),
  reason: z.string().min(1).optional(),
  note: z.string().optional(),
}).refine(
  (data) => data.status !== 'rejected' || (data.reason && data.reason.length > 0),
  { message: 'Reason is required when rejecting an application' }
);

const applicationFiltersSchema = z.object({
  status: z.enum([
    'pending_verification', 'approved', 'rejected',
    'flagged_branch_visit', 'flagged_home_verification',
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  registerSchema,
  loginSchema,
  personalInfoSchema,
  addressSchema,
  employmentSchema,
  statusUpdateSchema,
  applicationFiltersSchema,
};
