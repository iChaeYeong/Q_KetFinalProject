# EKS 관련 리소스를 modules/eks 로 옮기면서 생긴 state 주소 변경 안내.
# 이게 없으면 Terraform이 EKS 클러스터/노드그룹을 "삭제 후 재생성"으로 오인함.
moved {
  from = aws_iam_role.eks_cluster
  to   = module.eks.aws_iam_role.eks_cluster
}

moved {
  from = aws_iam_role_policy_attachment.eks_cluster
  to   = module.eks.aws_iam_role_policy_attachment.eks_cluster
}

moved {
  from = aws_iam_role.eks_node
  to   = module.eks.aws_iam_role.eks_node
}

moved {
  from = aws_iam_role_policy_attachment.eks_node_worker
  to   = module.eks.aws_iam_role_policy_attachment.eks_node_worker
}

moved {
  from = aws_iam_role_policy_attachment.eks_node_cni
  to   = module.eks.aws_iam_role_policy_attachment.eks_node_cni
}

moved {
  from = aws_iam_role_policy_attachment.eks_node_ecr
  to   = module.eks.aws_iam_role_policy_attachment.eks_node_ecr
}

moved {
  from = aws_eks_cluster.this
  to   = module.eks.aws_eks_cluster.this
}

moved {
  from = aws_eks_node_group.this
  to   = module.eks.aws_eks_node_group.this
}

# RDS/ElastiCache를 modules/data 로 옮기면서 생긴 state 주소 변경 안내.
moved {
  from = aws_db_subnet_group.this
  to   = module.data_dev.aws_db_subnet_group.this
}

moved {
  from = aws_security_group.rds
  to   = module.data_dev.aws_security_group.rds
}

moved {
  from = aws_db_instance.this
  to   = module.data_dev.aws_db_instance.this
}
