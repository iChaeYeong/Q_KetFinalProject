package com.exam.reservation.service;
import com.exam.reservation.dto.PerformanceDTO;

import java.util.List;

public interface PerformanceService {
    List<PerformanceDTO> getAllPerformances();

//    PerformanceDTO getPerformance(Long performanceId);
//    List<PerformanceRoundDTO> getRounds(Long performanceId);
//    PerformanceRoundDTO getRound(Long roundId);
}
