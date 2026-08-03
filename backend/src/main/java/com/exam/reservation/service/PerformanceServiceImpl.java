package com.exam.reservation.service;

import com.exam.common.dto.PageResponse;
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
     *  기능      :   공연 목록 조회, categoryId로 카테고리 필터링 가능
     *  param    :   categoryId(선택, null이면 전체)
     *  return   :   List<PerformanceDTO>
     ************************************/
    @Override
    public List<PerformanceDTO> getAllPerformances(Long categoryId) {
        return performanceMapper.findAll(categoryId);
    }

    /***********************************
     *  이름      :   getPerformances
     *  기능      :   공연 목록 페이지 단위 조회 (메인 화면 페이지네이션용), categoryId로 카테고리 필터링 가능
     *  param    :   page(1부터 시작), size, categoryId(선택, null이면 전체)
     *  return   :   PageResponse<PerformanceDTO>
     ************************************/
    @Override
    public PageResponse<PerformanceDTO> getPerformances(int page, int size, Long categoryId) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        int offset = (safePage - 1) * safeSize;
        List<PerformanceDTO> content = performanceMapper.findAllPaged(offset, safeSize, categoryId);
        long totalCount = performanceMapper.countAll(categoryId);
        return new PageResponse<>(content, safePage, safeSize, totalCount);
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
