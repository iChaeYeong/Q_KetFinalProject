package com.exam.reservation.service;
import com.exam.common.dto.PageResponse;
import com.exam.reservation.dto.PerformanceDTO;

import java.util.List;

public interface PerformanceService {
    List<PerformanceDTO> getAllPerformances();
    PageResponse<PerformanceDTO> getPerformances(int page, int size);

//    PerformanceDTO getPerformance(Long performanceId);
//    List<PerformanceRoundDTO> getRounds(Long performanceId);
//    PerformanceRoundDTO getRound(Long roundId);
}
