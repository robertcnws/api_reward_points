variable "jenkins_iam_user_name" {
  type        = string
  description = "IAM User usado por Jenkins (aws-ecr-creds)"
  default     = "dealerportal_ecs" 
}

data "aws_iam_user" "jenkins" {
  user_name = var.jenkins_iam_user_name
}

data "aws_iam_policy_document" "reward_points_ssm_read" {
  statement {
    sid    = "AllowReadRewardPointsParameters"
    effect = "Allow"

    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]

    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/reward-points/*"
    ]
  }
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "reward_points_ssm_read" {
  name        = "reward-points-ssm-read"
  description = "Allow Jenkins to read reward-points parameters from SSM"
  policy      = data.aws_iam_policy_document.reward_points_ssm_read.json
}

resource "aws_iam_user_policy_attachment" "jenkins_ssm_read" {
  user       = data.aws_iam_user.jenkins.user_name
  policy_arn = aws_iam_policy.reward_points_ssm_read.arn
}
