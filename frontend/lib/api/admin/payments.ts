import { apiFetch } from "../client";
import type { AdminPayment } from "@/lib/data/types";

// ============================================================
// GET /api/admin/payments
// 백엔드: AdminPaymentController.java → list()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 전체 사용자의 결제 내역을 결제상태(payStatus)/키워드(아이디·이름·공연명)로 필터 조회 (관리자 결제 관리 화면)
//
// 사용 예시:
//   import { getAdminPayments } from "@/lib/api/admin";
//
//   useEffect(() => {
//     getAdminPayments(status || undefined, keyword || undefined).then(setPayments);
//   }, [status]);
//
// 요청: payStatus(선택, "DONE"|"CANCELED"), keyword(선택, 아이디/이름/공연명 부분 일치) — query string
// 응답 JSON (AdminPayment[]):
//   [
//     {
//       "paymentId": 12, "reservationId": 34, "userId": "test01", "userNm": "홍길동",
//       "orderId": "order_abc123", "paymentKey": "toss_key_xyz", "amount": 99000,
//       "payStatus": "DONE", "approvedAt": "2026-08-01 19:05:00",
//       "pTitle": "아이유 콘서트 - The Golden Hour", "venueName": "고척스카이돔",
//       "roundTime": "2026-08-15 19:00:00", "seatRow": "A", "seatColume": "12", "grade": "S"
//     }
//   ]
// ============================================================
export const getAdminPayments = (payStatus?: string, keyword?: string) => {
  const params = new URLSearchParams();
  if (payStatus) params.set("payStatus", payStatus);
  if (keyword) params.set("keyword", keyword);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<AdminPayment[]>(`/admin/payments${query}`);
};

// ============================================================
// POST /api/admin/payments/{paymentId}/cancel
// 백엔드: AdminPaymentController.java → cancel()  (관리자(roleId 3)만 호출 가능, 아니면 403)
// 기능: 관리자가 사용자를 대신해 결제를 환불(취소) — 좌석도 함께 반납되어 다시 예매 가능해짐
//
// 사용 예시:
//   import { cancelAdminPayment } from "@/lib/api/admin";
//   await cancelAdminPayment(paymentId);
//
// 요청: path의 paymentId만 사용
// 응답 JSON (AdminPayment 중 결제 정보 부분, payStatus가 "CANCELED"로 바뀌어 옴)
// ============================================================
export const cancelAdminPayment = (paymentId: number) =>
  apiFetch<AdminPayment>(`/admin/payments/${paymentId}/cancel`, { method: "POST" });
