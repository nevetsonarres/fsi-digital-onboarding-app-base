output "s3_bucket_name" {
  description = "S3 bucket name for documents"
  value       = aws_s3_bucket.documents.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.documents.arn
}

output "aws_access_key_id" {
  description = "IAM access key for backend S3 access"
  value       = aws_iam_access_key.backend_s3.id
  sensitive   = true
}

output "aws_secret_access_key" {
  description = "IAM secret key for backend S3 access"
  value       = aws_iam_access_key.backend_s3.secret
  sensitive   = true
}
