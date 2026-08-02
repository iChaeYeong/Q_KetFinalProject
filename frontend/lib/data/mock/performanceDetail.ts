import type { PerformanceDetail } from "../types";

// 백엔드 GET /api/events/{performanceId} 가 준비되기 전까지 화면 개발용으로 쓰는 임시 데이터.
// backend/src/main/resources/data.sql 의 시드와 값이 완전히 같으므로,
// 나중에 실제 API로 교체해도 화면에 보이는 내용이 그대로여야 한다.
// → 8단계에서 이 파일을 지우고 lib/api/events.ts 의 실제 호출로 교체한다.
//
// 화면 확인용 케이스 4가지:
//   5 (레미제라블)      공통 캐스팅 + 회차별 더블 캐스팅
//   9 (오페라의 유령)    공통 캐스팅만
//   1 (아이유 콘서트)    배역명 없음(castingNm null) + 특정 회차 게스트
//   2 (BTS)            캐스팅 없음 (빈 목록 UI)
export const MOCK_PERFORMANCE_DETAIL: Record<number, PerformanceDetail> = {
  5: {
    performanceId: 5,
    pTitle: "뮤지컬 레미제라블",
    pLocation: "블루스퀘어 마스터카드홀",
    posterUrl: "",
    // 달력 UI 확인용으로 회차를 늘려둔 상태 (실제 data.sql 시드는 아직 8/20~22 3회차뿐).
    // 8/22 처럼 하루 2회차(마티네+저녁), 9월까지 이어지는 월 이동 케이스를 포함.
    rounds: [
      { roundId: 13, performanceId: 5, roundTime: "2026-08-06 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 14, performanceId: 5, roundTime: "2026-08-07 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 15, performanceId: 5, roundTime: "2026-08-13 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 16, performanceId: 5, roundTime: "2026-08-14 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 10, performanceId: 5, roundTime: "2026-08-20 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 11, performanceId: 5, roundTime: "2026-08-21 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 12, performanceId: 5, roundTime: "2026-08-22 14:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 17, performanceId: 5, roundTime: "2026-08-22 19:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 18, performanceId: 5, roundTime: "2026-08-27 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 19, performanceId: 5, roundTime: "2026-08-28 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 20, performanceId: 5, roundTime: "2026-09-03 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 21, performanceId: 5, roundTime: "2026-09-04 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
    ],
    casts: [
      { castId: 1,  performanceId: 5, roundId: 10,   actorName: "김민석", castingNm: "장발장",     sortOrder: 0 },
      { castId: 2,  performanceId: 5, roundId: 11,   actorName: "이서준", castingNm: "장발장",     sortOrder: 0 },
      { castId: 3,  performanceId: 5, roundId: 12,   actorName: "김민석", castingNm: "장발장",     sortOrder: 0 },
      { castId: 4,  performanceId: 5, roundId: 10,   actorName: "박도현", castingNm: "자베르",     sortOrder: 1 },
      { castId: 5,  performanceId: 5, roundId: 11,   actorName: "박도현", castingNm: "자베르",     sortOrder: 1 },
      { castId: 6,  performanceId: 5, roundId: 12,   actorName: "강태영", castingNm: "자베르",     sortOrder: 1 },
      { castId: 7,  performanceId: 5, roundId: null, actorName: "한지우", castingNm: "판틴",       sortOrder: 2 },
      { castId: 8,  performanceId: 5, roundId: null, actorName: "윤소희", castingNm: "코제트",     sortOrder: 3 },
      { castId: 9,  performanceId: 5, roundId: null, actorName: "최현우", castingNm: "마리우스",   sortOrder: 4 },
      { castId: 10, performanceId: 5, roundId: null, actorName: "오세영", castingNm: "테나르디에", sortOrder: 5 },
    ],
  },

  9: {
    performanceId: 9,
    pTitle: "뮤지컬 오페라의 유령",
    pLocation: "블루스퀘어 마스터카드홀",
    posterUrl: "",
    rounds: [
      { roundId: 19, performanceId: 9, roundTime: "2026-09-10 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 20, performanceId: 9, roundTime: "2026-09-11 19:30:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 21, performanceId: 9, roundTime: "2026-09-12 14:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
    ],
    casts: [
      { castId: 11, performanceId: 9, roundId: null, actorName: "서지훈", castingNm: "팬텀",     sortOrder: 0 },
      { castId: 12, performanceId: 9, roundId: null, actorName: "임하늘", castingNm: "크리스틴", sortOrder: 1 },
      { castId: 13, performanceId: 9, roundId: null, actorName: "정우진", castingNm: "라울",     sortOrder: 2 },
      { castId: 14, performanceId: 9, roundId: null, actorName: "문가영", castingNm: "칼롯타",   sortOrder: 3 },
    ],
  },

  1: {
    performanceId: 1,
    pTitle: "아이유 콘서트 - The Golden Hour",
    pLocation: "서울 올림픽공원 체조경기장",
    posterUrl: "",
    rounds: [
      { roundId: 1, performanceId: 1, roundTime: "2026-08-15 19:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 2, performanceId: 1, roundTime: "2026-08-16 17:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
    ],
    casts: [
      { castId: 15, performanceId: 1, roundId: null, actorName: "아이유", castingNm: null, sortOrder: 0 },
      { castId: 16, performanceId: 1, roundId: 2,    actorName: "이하은", castingNm: null, sortOrder: 1 },
    ],
  },

  2: {
    performanceId: 2,
    pTitle: "BTS World Tour - Yet To Come",
    pLocation: "KSPO DOME",
    posterUrl: "",
    rounds: [
      { roundId: 3, performanceId: 2, roundTime: "2026-09-01 19:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
      { roundId: 4, performanceId: 2, roundTime: "2026-09-02 19:00:00", openTime: "2025-01-01 10:00:00", roundStatus: "OPEN" },
    ],
    casts: [],
  },
};
