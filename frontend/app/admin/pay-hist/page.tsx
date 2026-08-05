"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatusMessage from "@/components/ui/StatusMessage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getAdminPayments, cancelAdminPayment, type AdminPayment } from "@/lib/api/admin";

// 결제 상태 표시 라벨/Badge variant (마이페이지 app/mypage/page.tsx 와 동일한 매핑)
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  DONE: "결제완료",
  CANCELED: "환불완료",
};
const PAYMENT_STATUS_VARIANT: Record<string, "open" | "closed"> = {
  DONE: "open",
  CANCELED: "closed",
};

const PAGE_SIZE = 8;

export default function AdminReservationsPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [page, setPage] = useState(1);

  // 환불 확인 모달 상태
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState("");

  const load = (payStatus: string, kw: string) => {
    setLoading(true);
    setMsg("");
    getAdminPayments(payStatus || undefined, kw || undefined)
      .then(setPayments)
      .catch((e) => setMsg(e instanceof Error ? e.message : "조회에 실패했습니다."))
      .finally(() => setLoading(false));
    setPage(1);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load(status, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userSession, status]);

  const handleSearch = () => {
    setKeyword(keywordInput.trim());
    load(status, keywordInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const pagedPayments = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleConfirmRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    setRefundError("");
    try {
      const updated = await cancelAdminPayment(refundTarget.paymentId);
      setPayments((prev) => prev.map((p) => (p.paymentId === updated.paymentId ? { ...p, ...updated } : p)));
      setRefundTarget(null);
    } catch (e) {
      setRefundError(e instanceof Error ? e.message : "환불 처리에 실패했습니다.");
    } finally {
      setRefunding(false);
    }
  };

  if (isLoading)
    return <div className="pageWrap"><StatusMessage variant="loading">불러오는 중...</StatusMessage></div>;

  return (
    <PageHeader
      variant="admin"
      title="결제 내역 관리"
      subtitle="전체 사용자의 결제 내역을 상태·키워드로 필터 조회하고, 환불 처리를 할 수 있습니다."
    >
      <div className="adminCard">
        <div className="adminCardTitle">필터</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="adminLabel">결제 상태</label>
            <select
              className="adminSelect"
              style={{ width: 140 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">전체</option>
              <option value="DONE">결제완료</option>
              <option value="CANCELED">환불완료</option>
            </select>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <label className="adminLabel">검색 (아이디·이름·공연명)</label>
            <input
              className="adminInput"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="예: test01, 홍길동, 지킬앤하이드"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>검색</Button>
        </div>
      </div>

      {msg && <StatusMessage variant="error">{msg}</StatusMessage>}

      {loading ? (
        <StatusMessage variant="loading">불러오는 중...</StatusMessage>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>결제자</th>
                <th>공연명</th>
                <th>장소</th>
                <th>회차</th>
                <th>좌석</th>
                <th>결제금액</th>
                <th>결제상태</th>
                <th>결제일시</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center" }}>조회된 결제 내역이 없습니다.</td></tr>
              ) : (
                pagedPayments.map((p) => (
                  <tr key={p.paymentId}>
                    <td className="adminCellId">{p.orderId}</td>
                    <td>{p.userNm} ({p.userId})</td>
                    <td>{p.pTitle}</td>
                    <td>{p.venueName}</td>
                    <td>
                      {new Date(p.roundTime).toLocaleString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td>
                      {p.seatRow}{p.seatColume}{" "}
                      <Badge variant={p.grade.toLowerCase() as "vip" | "r" | "s"}>{p.grade}</Badge>
                    </td>
                    <td>{p.amount.toLocaleString("ko-KR")}원</td>
                    <td>
                      <Badge variant={PAYMENT_STATUS_VARIANT[p.payStatus] ?? "closed"}>
                        {PAYMENT_STATUS_LABEL[p.payStatus] ?? p.payStatus}
                      </Badge>
                    </td>
                    <td>
                      {new Date(p.approvedAt).toLocaleString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td>
                      {p.payStatus === "DONE" && (
                        <Button variant="danger" onClick={() => { setRefundTarget(p); setRefundError(""); }}>
                          환불 처리
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <nav className="pagination" aria-label="페이지 이동">
          <button
            type="button"
            style={{ background: "none", font: "inherit", cursor: "pointer" }}
            className={`paginationArrow${page <= 1 ? " paginationDisabled" : ""}`}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              type="button"
              key={p}
              style={{ background: p === page ? undefined : "none", font: "inherit", cursor: "pointer" }}
              className={`paginationItem${p === page ? " paginationItemActive" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            style={{ background: "none", font: "inherit", cursor: "pointer" }}
            className={`paginationArrow${page >= totalPages ? " paginationDisabled" : ""}`}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            다음
          </button>
        </nav>
      )}

      <ConfirmDialog
        open={refundTarget !== null}
        title="결제를 환불 처리할까요?"
        description={
          refundTarget && (
            <>
              {refundTarget.userNm}({refundTarget.userId})님의 <b>{refundTarget.pTitle}</b> 결제
              ({refundTarget.amount.toLocaleString("ko-KR")}원)를 환불합니다. 좌석도 함께 반납되어 다시 예매 가능해집니다.
            </>
          )
        }
        confirmLabel="환불하기"
        confirmVariant="danger"
        loading={refunding}
        error={refundError}
        onConfirm={handleConfirmRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </PageHeader>
  );
}
