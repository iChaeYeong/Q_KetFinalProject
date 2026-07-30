import { apiFetch } from "./client";
import type { Performance } from "../data/types";

// ============================================================
// GET /api/events
// 백엔드: PerformanceController.java → list()
// 기능: 전체 공연 목록 조회 (메인/목록 화면용)
//
// 사용 예시:
//   import { getEvents } from "@/lib/api/events";
//
//   useEffect(() => {
//     getEvents().then(setPerformances).finally(() => setLoading(false));
//   }, []);
//
// 요청: 파라미터 없음
// 응답 JSON (Performance[] — 공연마다 rounds 배열까지 포함해서 옴):
//   [
//     {
//       "performanceId": 1,
//       "pTitle": "뮤지컬 지킬앤하이드",
//       "pLocation": "고척스카이돔",
//       "posterUrl": "https://.../poster.jpg",
//       "rounds": [
//         { "roundId": 10, "performanceId": 1, "roundTime": "2026-08-15 19:00:00",
//           "openTime": "2026-08-01 10:00:00", "roundStatus": "OPEN" }
//       ]
//     }
//   ]
// ============================================================
export async function getEvents(): Promise<Performance[]> {
  return apiFetch<Performance[]>("/events");
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
