# 포스터 이미지 업로드용 버킷. CloudFront(OAC)로만 읽을 수 있게 완전히 private로 막음 —
# 버킷 직접 URL로는 절대 접근 불가, 항상 CloudFront 도메인을 거쳐야 함.
resource "aws_s3_bucket" "posters" {
  bucket = "${var.project_name}-posters-${var.environment}"
}

resource "aws_s3_bucket_public_access_block" "posters" {
  bucket = aws_s3_bucket.posters.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront(OAC)만 이 버킷을 읽을 수 있게 허용 — 그것도 "이 배포에서 온 요청"으로 한정
resource "aws_s3_bucket_policy" "posters" {
  bucket = aws_s3_bucket.posters.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.posters.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.posters.arn
          }
        }
      }
    ]
  })
}
