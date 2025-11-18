resource "aws_ecr_repository" "backend" {
  name = "nws/reward-points-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 20 images"
          selection = {
            tagStatus   = "any"
            countType   = "imageCountMoreThan"
            countNumber = 20
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }
}

resource "aws_ecr_repository" "frontend" {
  name = "nws/reward-points-frontend"

  image_scanning_configuration {
    scan_on_push = true
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 20 images"
          selection = {
            tagStatus   = "any"
            countType   = "imageCountMoreThan"
            countNumber = 20
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }
}

# Sacamos el "registry" genérico (sin /repo)
locals {
  backend_repo_parts = split("/", aws_ecr_repository.backend.repository_url)
  aws_ecr_registry   = join("/", slice(local.backend_repo_parts, 0, length(local.backend_repo_parts) - 1))
}
