// Client Component — "use client" 필요한 이유:
//   1. 예매 취소 버튼 onClick 이벤트 핸들러 (handleCancel)
//   2. 로그인 세션 기반 사용자 정보 조회 (credentials: "include" 쿠키)
//   * 이상적으로는 유저 정보 + 예매 목록 fetch 를 Server Component 에서 처리하고
//     취소 버튼만 Client Component 로 분리하는 것이 좋지만,
//     세션 쿠키 forwarding 설정이 필요해 지금은 전체를 Client Component 로 유지
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Reservation, Payment } from "@/lib/data/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import { getMyReservations, cancelReservation } from "@/lib/api/reservations"
import { getMyPayments } from "@/lib/api/payments"

// 예매 상태 표시 라벨
const STATUS_LABEL: Record<string, string> = {
  RESERVED: "예매 완료",
  CANCELLED: "취소됨",
};
// 예매 상태별 Badge variant
const STATUS_VARIANT: Record<string, "open" | "closed"> = {
  RESERVED: "open",
  CANCELLED: "closed",
};


export default function MyPage() {
  const router = useRouter();

  const { userSession } = useAuth();

  // 예매 내역 목록
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // 결제 내역 목록
  const [payments, setPayments] = useState<Payment[]>([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null); // 취소 중인 reservationId

  useEffect(() => {
    getMyReservations()
      .then(setReservations)
      .catch(() => setReservations([]))  //에러시
      .finally(() => setLoading(false));

    getMyPayments()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, []);

  //예매버튼 클릭시 실행 이벤트
  const handleCancel = async (reservationId: number) => {
    if (!confirm("예매를 취소하시겠습니까?")) return;

    setCancelling(reservationId);
    try {
      await cancelReservation(reservationId);
      setReservations(prev =>
        prev.map(r => r.reservationId === reservationId
          ? { ...r, reservedStatus: "CANCELLED" }
          : r
        )
      );
    } finally {
      setCancelling(null);
    }
  };

  return (
    <>
      <PageHeader title="마이페이지" subtitle="계정 정보와 예매 내역을 확인합니다.">
        <div className="mypageGrid">
          {/* 프로필 카드 */}
          <div className="profileCard">
            <div className="profileAvatar">
              {/* [TODO-MYPAGE-AVATAR] user.userNm 첫 글자 표시, 없으면 "?" */}
              {userSession?.userNm?.[0] ?? "?"}
            </div>
            <p className="profileName">{userSession?.userNm ?? "—"}</p>
            <p className="profileId">@{userSession?.userId ?? "—"}</p>

            <hr className="divider" />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ fontSize: "var(--font-md)", color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>예매 내역</span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{reservations.length}건</span>
              </div>
              <div style={{ fontSize: "var(--font-md)", color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>완료된 예매</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  {reservations.filter(r => r.reservedStatus === "RESERVED").length}건
                </span>
              </div>
            </div>
          </div>

          {/* 예매 내역 */}
          <div>
            <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-4)", letterSpacing: "-0.02em" }}>
              예매 내역
            </h2>

            {loading && <StatusMessage variant="loading">불러오는 중...</StatusMessage>}

            {!loading && reservations.length === 0 && (
              <div className="emptyMsg">
                <p style={{ fontSize: "var(--font-2xl)", marginBottom: "var(--space-3)" }}>🎫</p>
                <p>예매 내역이 없습니다.</p>
                <Button
                  variant="primary"
                  style={{ marginTop: "var(--space-4)" }}
                  onClick={() => router.push("/")}
                >
                  공연 보러 가기
                </Button>
              </div>
            )}

            <div className="reservationList">
              {reservations.map(r => (
                <div key={r.reservationId} className="reservationCard">
                  <div className="reservationInfo">
                    <p className="reservationTitle">{r.pTitle}</p>
                    <div className="reservationMeta">
                      <span>📅 {new Date(r.roundTime).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>💺 {r.seatRow}행 {r.seatColume}번</span>
                      <span>🎟 {r.grade}</span>
                    </div>
                    <div style={{ marginTop: "var(--space-2)" }}>
                      <Badge variant={STATUS_VARIANT[r.reservedStatus] ?? "closed"}>
                        {STATUS_LABEL[r.reservedStatus] ?? r.reservedStatus}
                      </Badge>
                    </div>
                  </div>

                  {r.reservedStatus === "RESERVED" && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancel(r.reservationId)}
                      disabled={cancelling === r.reservationId}
                    >
                      {cancelling === r.reservationId ? "처리 중..." : "취소"}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* 결제 내역 */}
            <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 700, color: "var(--text)", margin: "32px 0 var(--space-4)", letterSpacing: "-0.02em" }}>
              결제 내역
            </h2>

            {paymentsLoading && <StatusMessage variant="loading">불러오는 중...</StatusMessage>}

            {!paymentsLoading && payments.length === 0 && (
              <div className="emptyMsg">
                <p>결제 내역이 없습니다.</p>
              </div>
            )}

            <div className="reservationList">
              {payments.map(p => (
                <div key={p.paymentId} className="reservationCard">
                  <div className="reservationInfo">
                    <p className="reservationTitle">{p.pTitle}</p>
                    <div className="reservationMeta">
                      <span>📅 {new Date(p.roundTime).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>💺 {p.seatRow}행 {p.seatColume}번</span>
                      <span>🎟 {p.grade}</span>
                      <span>💳 {p.amount.toLocaleString("ko-KR")}원</span>
                      <span>🕒 {new Date(p.approvedAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} 승인</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageHeader>
    </>
  );
}
