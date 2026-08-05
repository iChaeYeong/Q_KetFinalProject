# DB_PORT/DB_NAME/REDIS_PORT/AWS_REGION — 전부 사람이 GitHub Variables에 따로 입력할 필요 없이
# 이미 Terraform이 RDS/ElastiCache를 만들 때 알고 있는 값이라 직접 ConfigMap으로 관리.
# (예전엔 CI가 GitHub Variables에서 값을 읽어와 만들었는데, 레포 재생성 등으로 그 값이
#  비어버리면 앱이 못 뜨는 사고가 남 — 이제 그 문제 자체가 없어짐)
resource "kubernetes_config_map" "app_config_dev" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.qket_dev.metadata[0].name
  }

  data = {
    DB_PORT    = tostring(module.data_dev.rds_port)
    DB_NAME    = module.data_dev.rds_db_name
    REDIS_PORT = tostring(module.data_dev.redis_port)
    AWS_REGION = var.aws_region
  }
}
