module "eso_dev" {
  source = "./modules/eso"

  project_name = var.project_name
  environment  = "dev"
  aws_region   = var.aws_region
  namespace    = kubernetes_namespace.qket_dev.metadata[0].name

  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url

  rds_master_user_secret_arn = module.data_dev.rds_master_user_secret_arn
  rds_endpoint                = module.data_dev.rds_endpoint
  redis_endpoint               = module.data_dev.redis_endpoint
}
