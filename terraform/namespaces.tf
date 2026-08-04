# 기존 k8s/namespace_qKet.yaml 을 대체 — 이제 이 파일로 네임스페이스를 수동/CI로 apply할 필요 없음.
# (k8s/namespace_qKet.yaml 자체는 참고용으로 남겨두되, 실제 적용은 여기서만 함 — 이중 관리 방지)
resource "kubernetes_namespace" "qket_dev" {
  metadata {
    name = "qket-dev"
    labels = {
      name = "qket-dev"
    }
  }
}

resource "kubernetes_namespace" "qket_prod" {
  metadata {
    name = "qket-prod"
    labels = {
      name = "qket-prod"
    }
  }
}
