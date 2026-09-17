variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "employee-management"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet hosting the app server"
  type        = string
  default     = "10.20.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDRs for the private subnets (database)"
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]
}

variable "availability_zones" {
  description = "AZs to spread subnets across"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "EC2 instance type for the app host"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH access (optional; SSM works without it)"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to the app host. Restrict this in production."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "employees"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "employee"
}

variable "db_password" {
  description = "Database master password. Provide via TF_VAR_db_password or a secrets manager - never commit it."
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage (GB) for RDS"
  type        = number
  default     = 20
}

variable "create_rds" {
  description = "Whether to create a managed RDS instance (set false to use the in-compose Postgres)"
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "GitHub repo (owner/name) allowed to assume the deploy role via OIDC"
  type        = string
  default     = ""
}
