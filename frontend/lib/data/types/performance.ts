export type PerformanceRound = {
  roundId: number;
  performanceId: number;
  roundTime: string;
  openTime: string;
  roundStatus: "OPEN" | "CLOSED" | "SOLDOUT";
};

export type Performance = {
  performanceId: number;
  pTitle: string;
  pLocation: string;
  posterUrl?: string;
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
