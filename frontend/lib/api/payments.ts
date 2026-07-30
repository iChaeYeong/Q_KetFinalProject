import { apiFetch } from "./client";
import type { Payment } from "../data/types";

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

// ============================================================
// GET /api/payments/my
// 백엔드: PaymentController.java → myPayments()  (로그인 필요)
// 기능: 내 결제 내역 조회 (마이페이지, 최신순)
//
// 사용 예시:
//   const payments = await getMyPayments();
//   setPayments(payments);
//
// 요청: 파라미터 없음
// 응답 JSON (Payment[]):
//   [
//     { "paymentId": 1, "reservationId": 225, "orderId": "QKET-...", "paymentKey": "...",
//       "amount": 220000, "payStatus": "DONE", "approvedAt": "2026-07-31 02:10:00",
//       "pTitle": "아이유 콘서트 - The Golden Hour", "roundTime": "2026-08-15 19:00:00",
//       "seatRow": "C", "seatColume": "47", "grade": "VIP" }
//   ]
// ============================================================
export async function getMyPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>("/payments/my");
}
