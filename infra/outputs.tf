output "aws_ecr_registry" {
  value       = local.aws_ecr_registry
  description = "Base registry URL for ECR repositories (AWS_ECR_REGISTRY)"
}

output "backend_repo_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Full URL of the backend repository"
}

output "frontend_repo_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Full URL of the frontend repository"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.this.name
  description = "Name of the ECS cluster"
}

output "backend_service_name" {
  value       = aws_ecs_service.backend.name
  description = "Name of the ECS backend service"
}

output "frontend_service_name" {
  value       = aws_ecs_service.frontend.name
  description = "Name of the ECS frontend service"
}
