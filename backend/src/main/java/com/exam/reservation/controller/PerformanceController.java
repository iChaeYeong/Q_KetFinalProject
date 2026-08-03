package com.exam.reservation.controller;

import com.exam.admin.dto.CategoryDTO;
import com.exam.admin.service.CategoryService;
import com.exam.common.dto.PageResponse;
import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.service.PerformanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/events")
public class PerformanceController {

    private final PerformanceService performanceService;
    // 카테고리는 관리 대상 데이터라 admin 패키지에 있지만, 카테고리별 공연 조회는 비로그인 사용자도
    // 접근하는 홈 화면 기능이라 로그인이 필요한 CommonController 대신 공개 컨트롤러인 여기서 노출한다
    // (CommonController가 admin.service.MenuService를 가져다 쓰는 것과 같은 취지의 의도적인 도메인 간 의존)
    private final CategoryService categoryService;

    public PerformanceController(PerformanceService performanceService, CategoryService categoryService) {
        this.performanceService = performanceService;
        this.categoryService = categoryService;
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

    /***********************************
     *  URL      :  "/events/categories"
     *  이름      :   카테고리 목록 조회
     *  기능      :   사용 중인 공연 카테고리 목록 조회 (홈 화면 카테고리 필터, 공연 등록/수정 폼의 카테고리 선택용)
     *  method   :   GET
     *  param    :
     *  result   :   List<CategoryDTO>
     ************************************/
    @GetMapping("/categories")
    public List<CategoryDTO> categories() {
        return categoryService.getActiveCategories();
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
