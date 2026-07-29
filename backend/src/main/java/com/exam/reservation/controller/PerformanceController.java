package com.exam.reservation.controller;

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
     *  기능      :   공연조회
     *  method   :   GET
     *  param    :
     *  result   :   List<PerformanceDTO>
     ************************************/
    @GetMapping
    public List<PerformanceDTO> list() {
        return performanceService.getAllPerformances();
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
