"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ANONYMOUS,
  loadTossPayments,
} from "@tosspayments/tosspayments-sdk";

const GRADE_PRICE: Record<string, number> = {
  VIP: 220000,
  R: 154000,
  S: 99000,
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initializedRef = useRef(false);
  const widgetsRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reservationId = searchParams.get("reservationId");
  const roundId = searchParams.get("roundId");
  const seatId = searchParams.get("seatId");
  const seatRow = searchParams.get("seatRow");
  const seatColume = searchParams.get("seatColume");
  const grade = searchParams.get("grade") ?? "";
  const amount = GRADE_PRICE[grade] ?? 0;

  const isValid = Boolean(
    reservationId &&
    roundId &&
    seatId &&
    seatRow &&
    seatColume &&
    grade &&
    amount > 0
  );

  useEffect(() => {
    if (!isValid || initializedRef.current) return;

    const clientKey =
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setError("토스 테스트 클라이언트 키가 없습니다.");
      return;
    }

    initializedRef.current = true;

    const initializeWidget = async () => {
      const tossPayments =
        await loadTossPayments(clientKey);

      const widgets = tossPayments.widgets({
        customerKey: ANONYMOUS,
      });

      await widgets.setAmount({
        currency: "KRW",
        value: amount,
      });

      await Promise.all([
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT",
        }),
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      widgetsRef.current = widgets;
      setReady(true);
    };

    initializeWidget().catch((widgetError) => {
      console.error(widgetError);
      initializedRef.current = false;
      setError("결제위젯을 불러오지 못했습니다.");
    });
  }, [amount, isValid]);

  if (!isValid) {
    return (
      <div className="pageWrap">
        <h1 className="pageTitle">
          잘못된 접근입니다.
        </h1>

        <button
          className="btnPrimary"
          onClick={() => router.back()}
        >
          좌석 선택으로 돌아가기
        </button>
      </div>
    );
  }

  const handlePayment = async () => {
  if (!ready || !widgetsRef.current) return;

  // successUrl/failUrl 은 토스가 paymentKey/orderId/amount(또는 code/message)를 쿼리스트링으로
  // 덧붙여 리다이렉트하는 주소. 우리가 미리 붙여둔 파라미터는 그대로 유지된 채 넘어가므로,
  // 지금 이 화면이 받은 예약 식별자를 그대로 실어보냄 — success 페이지는 confirm API 호출에,
  // fail 페이지는 "다시 시도" 시 체크아웃 화면을 다시 여는 데 씀
  const forwardParams = searchParams.toString();

  try {
    await widgetsRef.current.requestPayment({
      orderId: `QKET-${crypto.randomUUID()}`,
      orderName: `Qket ${grade}석 예매`,
      successUrl: `${window.location.origin}/payments/success?${forwardParams}`,
      failUrl: `${window.location.origin}/payments/fail?${forwardParams}`,
    });
  } catch (error) {
    console.error("결제 요청 실패:", error);
  }
};

  return (
    <div className="pageWrap">
      <div className="pageHeader">
        <h1 className="pageTitle">
          결제 수단 선택
        </h1>

        <p className="pageSubtitle">
          예매 정보와 결제 금액을 확인해주세요.
        </p>
      </div>

      <div
        className="seatPanel"
        style={{
          width: "100%",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        <p className="seatPanelTitle">
          예매 정보
        </p>

        <div className="seatPanelRow">
          <span className="seatPanelLabel">
            좌석
          </span>

          <span className="seatPanelValue">
            {seatRow}{seatColume}
          </span>
        </div>

        <div className="seatPanelRow">
          <span className="seatPanelLabel">
            등급
          </span>

          <span className="seatPanelValue">
            {grade}
          </span>
        </div>

        <div className="seatPanelRow">
          <span className="seatPanelLabel">
            결제 금액
          </span>

          <span className="seatPanelValue">
            {amount.toLocaleString("ko-KR")}원
          </span>
        </div>

        <hr className="seatPanelDivider" />

        {error && (
          <p className="errorMsg">{error}</p>
        )}

        <div id="payment-method" />
        <div id="agreement" />

        <button
          type="button"
          className="btnPrimary"
          style={{ width: "100%" }}
          disabled={!ready}
          onClick={handlePayment}
        >
          {ready
            ? `${amount.toLocaleString("ko-KR")}원 결제하기`
            : "결제위젯 불러오는 중..."}
        </button>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <p className="loadingMsg">
          불러오는 중...
        </p>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}