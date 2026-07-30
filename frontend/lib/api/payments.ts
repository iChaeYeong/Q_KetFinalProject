import { apiFetch } from "./client";

// ============================================================
// POST /api/payments/confirm
// 백엔드: PaymentController.java → confirm()  (로그인 필요)
// 기능: 토스페이먼츠 결제 최종 승인 + 좌석 예매 확정
//
// successUrl 로 돌아온 paymentKey/orderId/amount 와, 좌석 선택 단계부터
// 쿼리스트링으로 들고 온 reservationId/roundId/seatId/queueToken 을 합쳐서 보냄
// ============================================================
export type PaymentConfirmParams = {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId: number;
  roundId: number;
  seatId: number;
  queueToken?: string;
};

export type PaymentConfirmResult = {
  paymentId: number;
  reservationId: number;
  userId: string;
  orderId: string;
  paymentKey: string;
  amount: number;
  payStatus: string;
  approvedAt: string;
};

export async function confirmPayment(
  params: PaymentConfirmParams
): Promise<PaymentConfirmResult> {
  return apiFetch<PaymentConfirmResult>("/payments/confirm", {
    method: "POST",
    body: params,
  });
}
