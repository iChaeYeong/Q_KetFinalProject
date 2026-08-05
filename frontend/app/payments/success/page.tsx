"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PAYMENT_WRAP_STYLE } from "@/lib/paymentStyles";
import { getRound } from "@/lib/api/events";
import type { RoundDetail } from "@/lib/data/types";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // React StrictMode/리렌더로 confirm이 두 번 나가는 것을 막기 위한 가드
  const requestedRef = useRef(false);

  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");
  const [error, setError] = useState("");

  // 예매한 공연 정보(공연명/장소/시간) — roundId로 별도 조회
  const [round, setRound] = useState<RoundDetail | null>(null);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const reservationId = searchParams.get("reservationId");
  const roundId = searchParams.get("roundId");
  const seatId = searchParams.get("seatId");
  const seatRow = searchParams.get("seatRow");
  const seatColume = searchParams.get("seatColume");
  const grade = searchParams.get("grade");
  const queueToken = searchParams.get("queueToken") ?? undefined;

  useEffect(() => {
    if (!roundId) return;
    getRound(Number(roundId))
      .then(setRound)
      .catch(() => setRound(null));
  }, [roundId]);

  useEffect(() => {
    if (requestedRef.current) return;

    if (!paymentKey || !orderId || !amount || !reservationId || !roundId || !seatId) {
      setStatus("error");
      setError("잘못된 접근입니다.");
      return;
    }

    requestedRef.current = true;

    confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
      reservationId: Number(reservationId),
      roundId: Number(roundId),
      seatId: Number(seatId),
      queueToken,
    })
      .then(() => {
        setStatus("done");
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError(e instanceof ApiError ? e.message : "결제 승인에 실패했습니다.");
      });
  }, [paymentKey, orderId, amount, reservationId, roundId, seatId, queueToken, router]);

  const handleRetry = () => {
    const params = new URLSearchParams({
      reservationId: reservationId!,
      roundId: roundId!,
      seatId: seatId!,
      seatRow: seatRow!,
      seatColume: seatColume!,
      grade: grade!,
    });
    if (queueToken) {
      params.set("queueToken", queueToken);
    }
    router.push(`/payments/checkout?${params.toString()}`);
  };

  const canRetry = Boolean(reservationId && roundId && seatId && seatRow && seatColume && grade);

  return (
    <div style={PAYMENT_WRAP_STYLE}>
      <div className="paymentBox">
        {status === "confirming" && (
          <>
            <div className="paymentSpinner" />
            <p className="paymentTitle">결제 승인 처리 중입니다</p>
            <p className="paymentDesc">잠시만 기다려주세요...</p>
          </>
        )}

        {status === "done" && (
          <>
            <div className="paymentIcon paymentIconSuccess">✓</div>
            <p className="paymentTitle">결제가 완료되었습니다</p>
            <p className="paymentDesc">예매가 정상적으로 확정되었습니다</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="paymentIcon paymentIconError">✕</div>
            <p className="paymentTitle">결제 승인에 실패했습니다</p>
            <p className="paymentDesc">{error}</p>
          </>
        )}

        {(status === "done" || status === "error") && orderId && (
          <div className="paymentSummary">
            {round && (
              <>
                <div className="seatPanelRow">
                  <span className="seatPanelLabel">공연명</span>
                  <span className="seatPanelValue">{round.pTitle}</span>
                </div>
                <div className="seatPanelRow">
                  <span className="seatPanelLabel">장소</span>
                  <span className="seatPanelValue">{round.pLocation}</span>
                </div>
                <div className="seatPanelRow">
                  <span className="seatPanelLabel">일시</span>
                  <span className="seatPanelValue">
                    {new Date(round.roundTime).toLocaleString("ko-KR", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <hr className="seatPanelDivider" />
              </>
            )}
            <div className="seatPanelRow">
              <span className="seatPanelLabel">주문번호</span>
              <span className="seatPanelValue">{orderId}</span>
            </div>
            {seatRow && seatColume && (
              <div className="seatPanelRow">
                <span className="seatPanelLabel">좌석</span>
                <span className="seatPanelValue">{seatRow}{seatColume}</span>
              </div>
            )}
            {grade && (
              <div className="seatPanelRow">
                <span className="seatPanelLabel">등급</span>
                <span className="seatPanelValue">
                  <Badge variant={grade.toLowerCase() as "vip" | "r" | "s"}>{grade}</Badge>
                </span>
              </div>
            )}
            <div className="seatPanelRow">
              <span className="seatPanelLabel">결제금액</span>
              <span className="seatPanelValue">{Number(amount ?? 0).toLocaleString("ko-KR")}원</span>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="paymentActions">
            <Button variant="primary" onClick={() => router.replace("/mypage")}>
              마이페이지로 이동
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="paymentActions">
            {canRetry && (
              <Button variant="primary" onClick={handleRetry}>
                다시 시도
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push("/")}>
              공연 목록으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={PAYMENT_WRAP_STYLE}><p className="loadingMsg">불러오는 중...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
