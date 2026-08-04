package com.exam.review.service;

import com.exam.review.dto.ReviewDTO;

import java.util.List;

public interface ReviewService {
    ReviewDTO write(Long performanceId, String userId, String content, int rating, boolean containsSpoiler, String clientIp);
    List<ReviewDTO> list(Long performanceId);
    ReviewDTO update(Long reviewId, String userId, String content, int rating, boolean containsSpoiler, String clientIp);
    void delete(Long reviewId, String userId, String clientIp);
}
