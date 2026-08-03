output "cluster_role_arn" {
  description = "EKS 클러스터(컨트롤 플레인) IAM 역할 ARN"
  value       = aws_iam_role.eks_cluster.arn
}

output "cluster_name" {
  description = "EKS 클러스터 이름"
  value       = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  description = "EKS 클러스터 API 엔드포인트"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority" {
  description = "EKS 클러스터 CA 인증서 (kubeconfig 구성용)"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "EKS가 자동 생성한 클러스터 보안 그룹 ID"
  value       = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}

output "node_group_status" {
  description = "노드그룹 상태"
  value       = aws_eks_node_group.this.status
}

output "node_role_arn" {
  description = "워커 노드 IAM 역할 ARN"
  value       = aws_iam_role.eks_node.arn
}
