export type UserDTO = {
  userId: string;
  userNm: string;
  userEmail?: string;
  roleId?: number;
};

export type ApiResult = {
  success: boolean;
  message?: string;
};

export type LoginResult = ApiResult & {
  user?: UserDTO;
};

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

export type Seat = {
  reservationId: number;
  seatId: number;
  roundId: number;
  seatRow: string;
  seatColume: string;
  grade: "VIP" | "R" | "S";
  status: "AVAILABLE" | "LOCKED" | "RESERVED";
};

export type Reservation = {
  historyId: number;
  reservationId: number;
  pTitle: string;
  roundTime: string;
  seatRow: string;
  seatColume: string;
  grade: string;
  reservedStatus: string;
  createdReserved: string;
};

export type QueueStatus = {
  queueToken: string;
  position: number;
  estimatedWait: number;
  status: "WAITING" | "ENTERED" | "EXPIRED";
};
