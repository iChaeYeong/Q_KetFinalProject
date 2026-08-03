package com.exam.reservation.service;
import com.exam.common.dto.PageResponse;
import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.dto.PerformanceRoundDTO;

import java.util.List;

public interface PerformanceService {
    List<PerformanceDTO> getAllPerformances(Long categoryId, String keyword);
    PageResponse<PerformanceDTO> getPerformances(int page, int size, Long categoryId, String keyword);
    PerformanceRoundDTO getRound(Long roundId);

//    PerformanceDTO getPerformance(Long performanceId);
//    List<PerformanceRoundDTO> getRounds(Long performanceId);
}
