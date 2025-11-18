variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-2"
}

variable "project_name" {
  type        = string
  description = "Base name of project"
  default     = "reward-points"
}

variable "vpc_id" {
  type        = string
  description = "VPC where tasks run"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Subnets privadas para ECS (awsvpc)"
}

variable "ecs_security_group_ids" {
  type        = list(string)
  description = "Security Groups for ECS tasks"
}

variable "backend_container_port" {
  type        = number
  description = "Port for the Django backend"
  default     = 8000
}

variable "frontend_container_port" {
  type        = number
  description = "Port for the frontend (Nginx / Vite build)"
  default     = 80
}

variable "ecs_launch_type" {
  type        = string
  description = "FARGATE o EC2"
  default     = "FARGATE"
}

variable "ecs_cpu" {
  type        = string
  description = "CPU for Fargate tasks"
  default     = "512"
}

variable "ecs_memory" {
  type        = string
  description = "Memory para las tasks Fargate"
  default     = "1024"
}

variable "backend_target_group_arn" {
  type        = string
  description = "Target group ARN for backend (optional)"
  default     = ""
}

variable "frontend_target_group_arn" {
  type        = string
  description = "Target group ARN for frontend (optional)"
  default     = ""
}
