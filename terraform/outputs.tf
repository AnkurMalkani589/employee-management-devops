output "app_public_ip" {
  description = "Public IP of the app host (point DNS A records here)"
  value       = aws_eip.app.public_ip
}

output "app_url" {
  description = "Base URL of the deployed application"
  value       = "http://${aws_eip.app.public_ip}"
}

output "ecr_backend_repository_url" {
  description = "ECR repo URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "ECR repo URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint (empty unless create_rds = true)"
  value       = var.create_rds ? aws_db_instance.main[0].address : ""
}

output "rds_port" {
  description = "RDS port (empty unless create_rds = true)"
  value       = var.create_rds ? aws_db_instance.main[0].port : 0
}

output "instance_id" {
  description = "EC2 instance id (use with SSM Session Manager)"
  value       = aws_instance.app.id
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deploys (empty unless github_repo is set)"
  value       = local.create_oidc ? aws_iam_role.github_deploy[0].arn : ""
}
