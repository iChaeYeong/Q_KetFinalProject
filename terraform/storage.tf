module "storage_dev" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = "dev"
  namespace    = kubernetes_namespace.qket_dev.metadata[0].name

  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url
}
