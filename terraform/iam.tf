# IAM: an instance role that lets the app host pull images from ECR and be
# managed by SSM (so no inbound SSH is strictly required), plus an optional
# GitHub OIDC role for keyless CI/CD deploys.

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app_instance" {
  name               = "${var.project_name}-${var.environment}-app-instance"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json

  tags = { Name = "${var.project_name}-${var.environment}-app-instance" }
}

# Pull images from the two ECR repos.
data "aws_iam_policy_document" "ecr_pull" {
  statement {
    sid    = "ECRAuth"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ECRPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn,
    ]
  }
}

resource "aws_iam_policy" "ecr_pull" {
  name        = "${var.project_name}-${var.environment}-ecr-pull"
  description = "Allow pulling app images from ECR"
  policy      = data.aws_iam_policy_document.ecr_pull.json
}

resource "aws_iam_role_policy_attachment" "ecr_pull" {
  role       = aws_iam_role.app_instance.name
  policy_arn = aws_iam_policy.ecr_pull.arn
}

# SSM core so the host can be managed without opening SSH.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent so container/system logs and metrics can ship to CloudWatch.
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project_name}-${var.environment}-app-profile"
  role = aws_iam_role.app_instance.name
}

# --- GitHub Actions OIDC role (optional; enables keyless deploys) ---
# Set var.github_repo = "owner/name" to enable.

locals {
  create_oidc = var.github_repo != ""
}

resource "aws_iam_openid_connect_provider" "github" {
  count           = local.create_oidc ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume" {
  count = local.create_oidc ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  count              = local.create_oidc ? 1 : 0
  name               = "${var.project_name}-${var.environment}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json
}

# Push/pull images for CI/CD.
data "aws_iam_policy_document" "github_ecr_push" {
  count = local.create_oidc ? 1 : 0

  statement {
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn,
    ]
  }
}

resource "aws_iam_policy" "github_ecr_push" {
  count  = local.create_oidc ? 1 : 0
  name   = "${var.project_name}-${var.environment}-github-ecr-push"
  policy = data.aws_iam_policy_document.github_ecr_push[0].json
}

resource "aws_iam_role_policy_attachment" "github_ecr_push" {
  count      = local.create_oidc ? 1 : 0
  role       = aws_iam_role.github_deploy[0].name
  policy_arn = aws_iam_policy.github_ecr_push[0].arn
}
