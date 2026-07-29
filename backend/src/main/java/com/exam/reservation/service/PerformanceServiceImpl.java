package com.exam.reservation.service;

import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.mapper.PerformanceMapper;
import org.springframework.stereotype.Service;

import java.util.List;
/**
 *
 파일명: PerformanceServiceImpl.java
 *
 **/
@Service
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceMapper performanceMapper;

    public PerformanceServiceImpl(PerformanceMapper performanceMapper) {
        this.performanceMapper = performanceMapper;
    }
    /***********************************
     *  이름      :   getAllPerformances
     *  기능      :   공연 목록 조회
     *  param    :
     *  return   :   List<PerformanceDTO>
     ************************************/
    @Override
    public List<PerformanceDTO> getAllPerformances() {
        return performanceMapper.findAll();
    }

//    @Override
//    public PerformanceDTO getPerformance(Long performanceId) {
//        return performanceMapper.findById(performanceId);
//    }

//    @Override
//    public List<PerformanceRoundDTO> getRounds(Long performanceId) {
//        return performanceMapper.findRoundsByPerformanceId(performanceId);
//    }

//    @Override
//    public PerformanceRoundDTO getRound(Long roundId) {
//        return performanceMapper.findRoundById(roundId);
//    }
}
