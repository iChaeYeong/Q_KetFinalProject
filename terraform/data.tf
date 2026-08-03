module "data_dev" {
  source = "./modules/data"

  project_name = var.project_name
  environment  = "dev"

  vpc_id                        = module.network.vpc_id
  private_data_subnet_ids       = module.network.private_data_subnet_ids
  eks_cluster_security_group_id = module.eks.cluster_security_group_id
  bastion_security_group_id     = aws_security_group.ssm_bastion.id

  db_name                  = var.db_name
  db_username              = var.db_username
  db_instance_class        = var.db_instance_class
  db_allocated_storage     = var.db_allocated_storage
  db_max_allocated_storage = var.db_max_allocated_storage

  redis_node_type       = var.redis_node_type
  redis_engine_version  = var.redis_engine_version
}

# ── 나중에 prod 만들 때 이런 식으로 추가 ──
# environment만 "prod"로 하드코딩하고, 나머지는 dev와 같은 network/eks를 그대로 재사용.
# (VPC/EKS는 공유, RDS/Redis만 환경별로 분리하는 설계라서 module 블록만 하나 더 추가하면 됨)
#
# module "data_prod" {
#   source = "./modules/data"
#
#   project_name = var.project_name
#   environment  = "prod"
#
#   vpc_id                        = module.network.vpc_id
#   private_data_subnet_ids       = module.network.private_data_subnet_ids
#   eks_cluster_security_group_id = module.eks.cluster_security_group_id
#   bastion_security_group_id     = aws_security_group.ssm_bastion.id
#
#   db_name                  = var.db_name
#   db_username              = var.db_username
#   db_instance_class        = "db.t3.small"   # prod는 dev보다 넉넉하게 — 필요하면 별도 변수로 분리
#   db_allocated_storage     = 50
#   db_max_allocated_storage = 200
#
#   redis_node_type       = "cache.t3.small"
#   redis_engine_version  = var.redis_engine_version
# }
#
# 참고: modules/data 안 multi_az/num_cache_nodes는 지금 dev 기준으로 하드코딩(false/1)돼 있어서,
# prod에 Multi-AZ/자동 페일오버를 쓰려면 그 값들도 변수로 빼서 이 블록에서 넘겨줘야 함.
