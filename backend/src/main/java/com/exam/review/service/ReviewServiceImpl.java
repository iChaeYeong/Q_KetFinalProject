package com.exam.review.service;

import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.reservation.service.ReservationService;
import com.exam.review.dto.ReviewDTO;
import com.exam.review.mapper.ReviewMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;
    private final ReservationService reservationService;

    public ReviewServiceImpl(ReviewMapper reviewMapper, ReservationService reservationService) {
        this.reviewMapper = reviewMapper;
        this.reservationService = reservationService;
    }

    /***********************************
     *  이름      :  write
     *  기능      :  감상평 작성 — 예매자만 가능, 공연당 1개만 허용
     *  param    :  Long, String, String, boolean, String
     *  return   :  ReviewDTO
     ************************************/
    @Override
    @Transactional
    public ReviewDTO write(Long performanceId, String userId, String content, int rating, boolean containsSpoiler, String clientIp) {
        requireValidRating(rating);
        if (!reservationService.hasReservation(userId, performanceId)) {
            throw new BusinessException(ErrorCode.REVIEW_WRITE_NOT_ALLOWED);
        }
        boolean alreadyReviewed = reviewMapper.findByPerformanceId(performanceId).stream()
                .anyMatch(r -> r.getUserId().equals(userId));
        if (alreadyReviewed) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        ReviewDTO review = new ReviewDTO();
        review.setPerformanceId(performanceId);
        review.setUserId(userId);
        review.setContent(content);
        review.setRating(rating);
        review.setContainsSpoiler(containsSpoiler ? "Y" : "N");
        review.setInsId(userId);
        review.setInsIp(clientIp);

        reviewMapper.save(review);
        return reviewMapper.findById(review.getReviewId());
    }

    /***********************************
     *  이름      :  list
     *  기능      :  공연별 감상평 목록 조회 (공개, use_yn='Y'만)
     *  param    :  Long
     *  return   :  List<ReviewDTO>
     ************************************/
    @Override
    public List<ReviewDTO> list(Long performanceId) {
        return reviewMapper.findByPerformanceId(performanceId);
    }

    /***********************************
     *  이름      :  update
     *  기능      :  감상평 수정 (본인만)
     *  param    :  Long, String, String, boolean, String
     *  return   :  ReviewDTO
     ************************************/
    @Override
    @Transactional
    public ReviewDTO update(Long reviewId, String userId, String content, int rating, boolean containsSpoiler, String clientIp) {
        requireValidRating(rating);
        ReviewDTO review = requireOwnedReview(reviewId, userId);

        review.setContent(content);
        review.setRating(rating);
        review.setContainsSpoiler(containsSpoiler ? "Y" : "N");
        review.setUptId(userId);
        review.setUptIp(clientIp);
        reviewMapper.update(review);

        return reviewMapper.findById(reviewId);
    }

    /***********************************
     *  이름      :  delete
     *  기능      :  감상평 삭제 (본인만, 물리삭제 아니고 use_yn='N' 소프트 삭제)
     *  param    :  Long, String, String
     *  return   :  void
     ************************************/
    @Override
    public void delete(Long reviewId, String userId, String clientIp) {
        requireOwnedReview(reviewId, userId);
        reviewMapper.markDeleted(reviewId, userId, clientIp);
    }

    private void requireValidRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "별점은 1~5 사이여야 합니다.");
        }
    }

    // 본인 소유가 아니면 남의 리뷰가 존재한다는 사실 자체를 숨기기 위해 NOT_FOUND로 위장 (Payment 패턴과 동일)
    private ReviewDTO requireOwnedReview(Long reviewId, String userId) {
        ReviewDTO review = reviewMapper.findById(reviewId);
        if (review == null || !review.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_FOUND);
        }
        return review;
    }
}
