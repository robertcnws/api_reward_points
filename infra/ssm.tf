resource "aws_ssm_parameter" "ecs_cluster_name" {
  name  = "/reward-points/ecs/cluster_name"
  type  = "String"
  value = aws_ecs_cluster.this.name
}

resource "aws_ssm_parameter" "ecs_backend_service_name" {
  name  = "/reward-points/ecs/backend_service"
  type  = "String"
  value = aws_ecs_service.backend.name
}

resource "aws_ssm_parameter" "ecs_frontend_service_name" {
  name  = "/reward-points/ecs/frontend_service"
  type  = "String"
  value = aws_ecs_service.frontend.name
}

resource "aws_ssm_parameter" "ecr_registry" {
  name  = "/reward-points/ecr/registry"
  type  = "String"
  value = local.aws_ecr_registry
}

resource "aws_ssm_parameter" "ecr_backend_repo" {
  name  = "/reward-points/ecr/backend_repo_url"
  type  = "String"
  value = aws_ecr_repository.backend.repository_url
}

resource "aws_ssm_parameter" "ecr_frontend_repo" {
  name  = "/reward-points/ecr/frontend_repo_url"
  type  = "String"
  value = aws_ecr_repository.frontend.repository_url
}
