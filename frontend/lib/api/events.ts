import { apiFetch } from "./client";
import type { Category, PageResponse, Performance } from "../data/types";

// ============================================================
// GET /api/events
// 백엔드: PerformanceController.java → list()
// 기능: 전체 공연 목록 조회 (메인/목록 화면용), categoryId로 카테고리 필터링·keyword로 제목/공연장 검색 가능
//
// 사용 예시:
//   import { getEvents } from "@/lib/api/events";
//
//   useEffect(() => {
//     getEvents().then(setPerformances).finally(() => setLoading(false));
//   }, []);
//
// 요청: categoryId(선택, 없으면 전체), keyword(선택, 제목/공연장 부분 일치) — query string
// 응답 JSON (Performance[] — 공연마다 rounds 배열까지 포함해서 옴):
//   [
//     {
//       "performanceId": 1,
//       "pTitle": "뮤지컬 지킬앤하이드",
//       "pLocation": "고척스카이돔",
//       "posterUrl": "https://.../poster.jpg",
//       "categoryId": 2,
//       "categoryNm": "뮤지컬",
//       "rounds": [
//         { "roundId": 10, "performanceId": 1, "roundTime": "2026-08-15 19:00:00",
//           "openTime": "2026-08-01 10:00:00", "roundStatus": "OPEN" }
//       ]
//     }
//   ]
// ============================================================
export async function getEvents(categoryId?: number, keyword?: string): Promise<Performance[]> {
  const params = new URLSearchParams();
  if (categoryId != null) params.set("categoryId", String(categoryId));
  if (keyword) params.set("keyword", keyword);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Performance[]>(`/events${query}`);
}

// ============================================================
// GET /api/events/paged
// 백엔드: PerformanceController.java → pagedList()
// 기능: 공연 목록 페이지 단위 조회 (메인 공연 목록 화면 페이지네이션용),
//      categoryId로 카테고리 필터링·keyword로 제목/공연장 검색 가능
//
// 사용 예시:
//   import { getEventsPaged } from "@/lib/api/events";
//
//   const { content, page, totalPages } = await getEventsPaged(1, 8, categoryId, keyword);
//
// 요청: page(1부터 시작, 기본 1), size(기본 8), categoryId(선택), keyword(선택) — query string
// 응답 JSON (PageResponse<Performance>):
//   {
//     "content": [
//       {
//         "performanceId": 1,
//         "pTitle": "뮤지컬 지킬앤하이드",
//         "pLocation": "고척스카이돔",
//         "posterUrl": "https://.../poster.jpg",
//         "categoryId": 2,
//         "categoryNm": "뮤지컬",
//         "rounds": [
//           { "roundId": 10, "performanceId": 1, "roundTime": "2026-08-15 19:00:00",
//             "openTime": "2026-08-01 10:00:00", "roundStatus": "OPEN" }
//         ]
//       }
//     ],
//     "page": 1,
//     "size": 8,
//     "totalCount": 42,
//     "totalPages": 6
//   }
// ============================================================
export async function getEventsPaged(
  page = 1,
  size = 8,
  categoryId?: number,
  keyword?: string
): Promise<PageResponse<Performance>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (categoryId != null) params.set("categoryId", String(categoryId));
  if (keyword) params.set("keyword", keyword);
  return apiFetch<PageResponse<Performance>>(`/events/paged?${params.toString()}`);
}

// ============================================================
// GET /api/events/categories
// 백엔드: PerformanceController.java → categories()
// 기능: 사용 중인 공연 카테고리 목록 조회 (홈 화면 카테고리 필터, 공연 등록/수정 폼의 카테고리 선택용)
//
// 사용 예시:
//   import { getCategories } from "@/lib/api/events";
//
//   const categories = await getCategories();
//
// 요청: 파라미터 없음
// 응답 JSON (Category[]):
//   [
//     { "categoryId": 1, "categoryNm": "콘서트", "sortOrder": 1, "useYn": "Y" },
//     { "categoryId": 2, "categoryNm": "뮤지컬", "sortOrder": 2, "useYn": "Y" }
//   ]
// ============================================================
export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/events/categories");
}

// ============================================================
// GET /api/events/{eventId}
// 기능: 공연 상세 조회 (제목, 장소, 포스터, 회차 목록)
//
// ⚠️ 주의: 백엔드 PerformanceController.java 에 이 엔드포인트(/events/{performanceId})가
//    아직 주석 처리되어 있어서 지금 호출하면 404가 납니다. 실제로 쓰는 곳도 아직 없음.
//    쓰려면 먼저 백엔드에서 해당 @GetMapping 주석을 풀어야 함.
//
// 사용 예시 (백엔드 준비되면):
//   const perf = await getEvent(performanceId);
// ============================================================
export async function getEvent(eventId: number): Promise<Performance> {
  return apiFetch<Performance>(`/events/${eventId}`);
}
