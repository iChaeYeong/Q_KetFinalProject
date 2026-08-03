package com.exam.reservation.controller;

import com.exam.admin.dto.CategoryDTO;
import com.exam.admin.service.CategoryService;
import com.exam.common.dto.PageResponse;
import com.exam.reservation.dto.PerformanceDTO;
import com.exam.reservation.dto.RoundDTO;
import com.exam.reservation.service.PerformanceService;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
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
     *  기능      :   공연조회 (categoryId로 카테고리 필터링 가능)
     *  method   :   GET
     *  param    :   categoryId(선택)
     *  result   :   List<PerformanceDTO>
     ************************************/
    @GetMapping
    public List<PerformanceDTO> list(@RequestParam(required = false) Long categoryId) {
        return performanceService.getAllPerformances(categoryId);
    }

    /***********************************
     *  URL      :  "/events/paged"
     *  이름      :   pagedList
     *  기능      :   공연 목록 페이지 단위 조회 (메인 공연 목록 화면 페이지네이션용), categoryId로 카테고리 필터링 가능
     *  method   :   GET
     *  param    :   page(기본값 1), size(기본값 8), categoryId(선택)
     *  result   :   PageResponse<PerformanceDTO>
     ************************************/
    @GetMapping("/paged")
    public PageResponse<PerformanceDTO> pagedList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) Long categoryId) {
        return performanceService.getPerformances(page, size, categoryId);
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

    /***********************************
     *  URL      :  "/events/{performanceId}"
     *  이름      :   detail
     *  기능      :   공연 상세 조회 (회차 + 캐스팅)
     *  method   :   GET
     *  param    :
     *  result   :
     ************************************/

    @GetMapping("/{performanceId}")
    public PerformanceDTO detail(@PathVariable Long performanceId) {
        return performanceService.getPerformanceDetail(performanceId);
    }


    /***********************************
     *  URL      :  "/events/{performanceId}/calendar"
     *  이름      :   calendar
     *  기능      :   달력용 - 해당 월의 회차 목록 조회
     *  method   :   GET
     *  param    :   month("2026-08" 형식, 생략 가능 — 없으면 이번 달)
     *  result   :   List<RoundDTO>
     ************************************/
    // [month 파라미터 처리 방식]
    // 원래 @RequestParam String month (필수)였는데, 파라미터를 빼고 호출하면 Spring이
    // MissingServletRequestParameterException 을 던지고 GlobalExceptionHandler 에 해당 핸들러가 없어서
    // 500(C002 서버 오류)으로 떨어졌다. 클라이언트 잘못인데 서버 오류로 보이는 게 문제.
    //
    // 해결: 필수에서 빼고(required = false) 없으면 "이번 달"을 기본값으로 쓴다.
    //   - 달력 화면은 처음 열 때 볼 달이 정해져 있지 않은 게 자연스러워서 기본값이 실제로 쓸모 있음
    //   - GlobalExceptionHandler 를 건드리면 다른 API 응답까지 같이 바뀌므로 이 API 안에서만 해결
    // 참고: "2026-13" 같은 잘못된 형식이 들어오면 DATE_FORMAT 비교에서 아무것도 안 맞아 빈 배열이 나온다
    //       (파라미터 바인딩이라 SQL 주입 위험은 없음).
    @GetMapping("/{performanceId}/calendar")
    public List<RoundDTO> calendar(@PathVariable Long performanceId,
                                   @RequestParam(required = false) String month) {
        String targetMonth = (month == null || month.isBlank())
                ? YearMonth.now().toString()   // "2026-08"
                : month;
        return performanceService.getRoundsByMonth(performanceId, targetMonth);
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
