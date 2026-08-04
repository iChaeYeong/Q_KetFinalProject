output "vpc_id" {
  description = "생성된 VPC ID"
  value       = module.network.vpc_id
}

output "vpc_cidr" {
  description = "생성된 VPC CIDR"
  value       = module.network.vpc_cidr
}

output "public_subnet_ids" {
  description = "퍼블릭 서브넷 ID 목록"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "프라이빗 서브넷 ID 목록"
  value       = module.network.private_subnet_ids
}

output "igw_id" {
  description = "인터넷 게이트웨이 ID"
  value       = module.network.igw_id
}

output "public_route_table_id" {
  description = "퍼블릭 라우팅 테이블 ID"
  value       = module.network.public_route_table_id
}

output "private_route_table_ids" {
  description = "프라이빗(일반) 라우팅 테이블 ID 목록 (AZ별)"
  value       = module.network.private_route_table_ids
}

output "private_data_route_table_id" {
  description = "프라이빗-데이터 라우팅 테이블 ID"
  value       = module.network.private_data_route_table_id
}

output "nat_gateway_ids" {
  description = "NAT Gateway ID 목록 (AZ별)"
  value       = module.network.nat_gateway_ids
}

output "nat_gateway_public_ips" {
  description = "NAT Gateway에 붙은 고정 IP 목록"
  value       = module.network.nat_gateway_public_ips
}
