export type Payment = {
  paymentId: number;
  reservationId: number;
  orderId: string;
  paymentKey: string;
  amount: number;
  payStatus: string;
  approvedAt: string;
  pTitle: string;
  venueName: string;
  roundTime: string;
  seatRow: string;
  seatColume: string;
  grade: string;
};

// 관리자 결제 내역 필터 조회용 — 일반 Payment에 결제자 정보(userId/userNm)가 추가된 형태
export type AdminPayment = Payment & {
  userId: string;
  userNm: string;
};
