variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for document uploads"
  type        = string
  default     = "ph-bank-onboarding-docs"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "project_prefix" {
  description = "Prefix for resource naming"
  type        = string
  default     = "ph-bank-onboarding"
}

variable "frontend_origin" {
  description = "Frontend origin for CORS"
  type        = string
  default     = "http://localhost:5173"
}
