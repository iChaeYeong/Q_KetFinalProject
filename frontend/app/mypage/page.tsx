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
import type { Reservation } from "@/lib/data/types";
import { getMyReservations, cancelReservation } from "@/lib/api/reservations"

// 예매 상태 표시 라벨
const STATUS_LABEL: Record<string, string> = {
  RESERVED: "예매 완료",
  CANCELLED: "취소됨",
};
// 예매 상태 배지 CSS 클래스
const STATUS_CLASS: Record<string, string> = {
  RESERVED: "badge badgeOpen",
  CANCELLED: "badge badgeClosed",
};


export default function MyPage() {
  const router = useRouter();

  const { userSession } = useAuth();

  // 예매 내역 목록
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null); // 취소 중인 reservationId

  useEffect(() => {
    getMyReservations()
      .then(setReservations)
      .catch(() => setReservations([]))  //에러시
      .finally(() => setLoading(false));
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
      <div className="pageWrap">
        <div className="pageHeader">
          <h1 className="pageTitle">마이페이지</h1>
          <p className="pageSubtitle">계정 정보와 예매 내역을 확인합니다.</p>
        </div>

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

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>예매 내역</span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{reservations.length}건</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", justifyContent: "space-between" }}>
                <span>완료된 예매</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  {reservations.filter(r => r.reservedStatus === "RESERVED").length}건
                </span>
              </div>
            </div>
          </div>

          {/* 예매 내역 */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16, letterSpacing: "-0.02em" }}>
              예매 내역
            </h2>

            {loading && <p className="loadingMsg">불러오는 중...</p>}

            {!loading && reservations.length === 0 && (
              <div className="emptyMsg">
                <p style={{ fontSize: 32, marginBottom: 12 }}>🎫</p>
                <p>예매 내역이 없습니다.</p>
                <button
                  className="btnPrimary"
                  style={{ marginTop: 16 }}
                  onClick={() => router.push("/")}
                >
                  공연 보러 가기
                </button>
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
                    <div style={{ marginTop: 8 }}>
                      <span className={STATUS_CLASS[r.reservedStatus] ?? "badge badgeClosed"}>
                        {STATUS_LABEL[r.reservedStatus] ?? r.reservedStatus}
                      </span>
                    </div>
                  </div>

                  {r.reservedStatus === "RESERVED" && (
                    <button
                      className="btnDanger"
                      onClick={() => handleCancel(r.reservationId)}
                      disabled={cancelling === r.reservationId}
                    >
                      {cancelling === r.reservationId ? "처리 중..." : "취소"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
