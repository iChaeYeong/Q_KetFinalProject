// 회차를 반환하는 모든 쿼리가 VIEW로 바뀐다면 roundNo에 옵셔널 없애도됌
export type PerformanceRound = {
  roundId: number;
  performanceId: number;
  roundTime: string;
  openTime: string;
  roundStatus: "OPEN" | "CLOSED" | "SOLDOUT";
  roundNo?: number;
};

// GET /events/rounds/{roundId} 응답 — 결제 체크아웃 화면에서 예매 정보(공연명/장소/시간) 표시용
export type RoundDetail = {
  roundId: number;
  performanceId: number;
  pTitle: string;
  pLocation: string;
  roundTime: string;
  roundStatus: string;
};

export type Performance = {
  performanceId: number;
  pTitle: string;
  pLocation: string;
  posterUrl?: string;
  categoryId: number;
  categoryNm: string;
  rounds: PerformanceRound[];
};

// 백엔드 PageResponse<T>와 대응 (목록 페이지네이션 공통 응답 모양)
export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
};

// 공연 캐스팅 — PERFORMANCE_CAST 테이블과 1:1 대응
export type PerformanceCast = {
  castId: number;
  performanceId: number;
  // null = 전체 회차 공통 캐스팅 / 값 있음 = 그 회차 전용(뮤지컬 더블·트리플 캐스팅)
  roundId: number | null;
  actorName: string;
  // null = 배역 개념이 없는 공연(콘서트 등)
  castingNm: string | null;
  sortOrder: number;
};

// GET /api/events/{performanceId} 응답
// 목록용 Performance(공연정보 + 회차)에 캐스팅만 얹은 형태
export type PerformanceDetail = Performance & {
  casts: PerformanceCast[];
};
