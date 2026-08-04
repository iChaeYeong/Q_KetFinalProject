package com.exam.review.mapper;

import com.exam.review.dto.ReviewDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReviewMapper {
    int save(ReviewDTO reviewDTO);
    List<ReviewDTO> findByPerformanceId(Long performanceId);
    ReviewDTO findById(Long reviewId);
    int update(ReviewDTO reviewDTO);
    int markDeleted(@Param("reviewId") Long reviewId, @Param("uptId") String uptId, @Param("uptIp") String uptIp);
}
