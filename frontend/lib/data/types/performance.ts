export type PerformanceRound = {
  roundId: number;
  performanceId: number;
  roundTime: string;
  openTime: string;
  roundStatus: "OPEN" | "CLOSED" | "SOLDOUT";
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
