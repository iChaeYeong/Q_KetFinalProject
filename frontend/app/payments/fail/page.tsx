"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { PAYMENT_WRAP_STYLE } from "@/lib/paymentStyles";

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const reservationId = searchParams.get("reservationId");
  const roundId = searchParams.get("roundId");
  const seatId = searchParams.get("seatId");
  const seatRow = searchParams.get("seatRow");
  const seatColume = searchParams.get("seatColume");
  const grade = searchParams.get("grade");
  const queueToken = searchParams.get("queueToken");

  // 좌석 선택 단계부터 들고 온 정보가 남아있어야 같은 좌석으로 체크아웃 화면을 다시 열 수 있음
  const canRetry = Boolean(
    reservationId && roundId && seatId && seatRow && seatColume && grade
  );

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

  return (
    <div style={PAYMENT_WRAP_STYLE}>
      <div className="paymentBox">
        <div className="paymentIcon paymentIconError">✕</div>
        <p className="paymentTitle">결제가 완료되지 않았습니다</p>
        <p className="paymentDesc">{message ?? "결제 처리 중 문제가 발생했습니다."}</p>

        {code && (
          <div className="paymentSummary">
            <div className="seatPanelRow">
              <span className="seatPanelLabel">오류 코드</span>
              <span className="seatPanelValue">{code}</span>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="paymentWrap"><p className="loadingMsg">불러오는 중...</p></div>}>
      <FailContent />
    </Suspense>
  );
}
