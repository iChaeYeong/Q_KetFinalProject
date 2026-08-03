package com.exam.reservation.controller;

import com.exam.common.dto.PageResponse;
import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.service.PerformanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    /***********************************
     *  URL      :  "/events"
     *  이름      :   list
     *  기능      :   공연조회 (categoryId로 카테고리 필터링, keyword로 제목/공연장 검색 가능)
     *  method   :   GET
     *  param    :   categoryId(선택), keyword(선택, 공연 제목/공연장 이름 부분 일치)
     *  result   :   List<PerformanceDTO>
     ************************************/
    @GetMapping
    public List<PerformanceDTO> list(@RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return performanceService.getAllPerformances(categoryId, keyword);
    }

    /***********************************
     *  URL      :  "/events/paged"
     *  이름      :   pagedList
     *  기능      :   공연 목록 페이지 단위 조회 (메인 공연 목록 화면 페이지네이션용),
     *              categoryId로 카테고리 필터링, keyword로 제목/공연장 검색 가능
     *  method   :   GET
     *  param    :   page(기본값 1), size(기본값 8), categoryId(선택), keyword(선택)
     *  result   :   PageResponse<PerformanceDTO>
     ************************************/
    @GetMapping("/paged")
    public PageResponse<PerformanceDTO> pagedList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return performanceService.getPerformances(page, size, categoryId, keyword);
    }

//    @GetMapping("/{performanceId}")
//    public Map<String, Object> detail(@PathVariable Long performanceId) {
//        PerformanceDTO performance = performanceService.getPerformance(performanceId);
//        List<PerformanceRoundDTO> rounds = performanceService.getRounds(performanceId);
//        return Map.of("performance", performance, "rounds", rounds);
//    }

//    @GetMapping("/rounds/{roundId}")
//    public PerformanceRoundDTO round(@PathVariable Long roundId) {
//        return performanceService.getRound(roundId);
//    }
}
