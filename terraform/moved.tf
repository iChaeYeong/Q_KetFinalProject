# 네트워크 리소스를 modules/network 로 옮기면서 생긴 state 주소 변경 안내.
# 이게 없으면 Terraform이 "삭제 후 재생성"으로 오인해서 NAT Gateway 등 실제 리소스를 밀었다 다시 만들 수 있음.
moved {
  from = aws_vpc.this
  to   = module.network.aws_vpc.this
}

moved {
  from = aws_internet_gateway.this
  to   = module.network.aws_internet_gateway.this
}

moved {
  from = aws_subnet.public
  to   = module.network.aws_subnet.public
}

moved {
  from = aws_subnet.private
  to   = module.network.aws_subnet.private
}

moved {
  from = aws_route_table.public
  to   = module.network.aws_route_table.public
}

moved {
  from = aws_route_table.private
  to   = module.network.aws_route_table.private
}

moved {
  from = aws_route_table.private_data
  to   = module.network.aws_route_table.private_data
}

moved {
  from = aws_route_table_association.public
  to   = module.network.aws_route_table_association.public
}

moved {
  from = aws_route_table_association.private
  to   = module.network.aws_route_table_association.private
}

moved {
  from = aws_route_table_association.private_data
  to   = module.network.aws_route_table_association.private_data
}

moved {
  from = aws_eip.nat
  to   = module.network.aws_eip.nat
}

moved {
  from = aws_nat_gateway.this
  to   = module.network.aws_nat_gateway.this
}
