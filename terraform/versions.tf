terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  # Remote state is strongly recommended for teams. Configure with:
  #   terraform init -backend-config=backend.hcl
  # Uncomment and point at your bucket/table before first real use.
  #
  # backend "s3" {
  #   bucket         = "your-tf-state-bucket"
  #   key            = "employee-management/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
