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
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PAYMENT_WRAP_STYLE } from "@/lib/paymentStyles";
import { getRound } from "@/lib/api/events";
import type { RoundDetail } from "@/lib/data/types";

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

  // widgetOpen: 위젯을 최초로 한 번 불러왔는지 (한 번 true가 되면 계속 true — 재초기화 방지)
  // modalVisible: 팝업이 지금 화면에 보이는지 (닫아도 위젯 내용은 유지, 다시 열면 그대로 보임)
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // 예매할 공연 정보(공연명/장소/시간) — roundId로 별도 조회
  const [round, setRound] = useState<RoundDetail | null>(null);

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
    if (!roundId) return;
    getRound(Number(roundId))
      .then(setRound)
      .catch(() => setRound(null));
  }, [roundId]);

  // "결제하기" 버튼을 눌러 widgetOpen이 true가 된 다음에만 토스 위젯을 불러와서 팝업 안에 마운트함
  useEffect(() => {
    if (!widgetOpen || !isValid || initializedRef.current) return;

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
      setWidgetOpen(false);
      setModalVisible(false);
      setError("결제위젯을 불러오지 못했습니다.");
    });
  }, [widgetOpen, amount, isValid]);

  if (!isValid) {
    return (
      <div style={PAYMENT_WRAP_STYLE}>
        <div className="paymentBox">
          <p className="paymentTitle">잘못된 접근입니다</p>
          <div className="paymentActions">
            <Button variant="primary" onClick={() => router.back()}>
              좌석 선택으로 돌아가기
            </Button>
          </div>
        </div>
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

  // 메인 화면의 "OOO원 결제하기" 버튼 — 누르면 결제 수단 선택 팝업을 열기만 함(처음이면 위젯도 같이 불러옴)
  const handleOpen = () => {
    setWidgetOpen(true);
    setModalVisible(true);
  };

  return (
    <div style={PAYMENT_WRAP_STYLE}>
      <div className="paymentBox" style={{ maxWidth: 480, textAlign: "left", display: modalVisible ? "none" : "block" }}>
        <p className="paymentTitle" style={{ textAlign: "center" }}>
          결제 수단 선택
        </p>
        <p className="paymentDesc" style={{ textAlign: "center" }}>
          예매 정보와 결제 금액을 확인해주세요.
        </p>

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
            <span className="seatPanelLabel">좌석</span>
            <span className="seatPanelValue">{seatRow}{seatColume}</span>
          </div>

          <div className="seatPanelRow">
            <span className="seatPanelLabel">등급</span>
            <span className="seatPanelValue">
              <Badge variant={grade.toLowerCase() as "vip" | "r" | "s"}>{grade}</Badge>
            </span>
          </div>

          <div className="seatPanelRow">
            <span className="seatPanelLabel">결제 금액</span>
            <span className="seatPanelValue">{amount.toLocaleString("ko-KR")}원</span>
          </div>
        </div>

        <hr className="seatPanelDivider" />

        {error && <p className="errorMsg">{error}</p>}

        <Button
          variant="primary"
          fullWidth
          style={{ marginTop: "var(--space-4)" }}
          onClick={handleOpen}
        >
          {amount.toLocaleString("ko-KR")}원 결제하기
        </Button>
      </div>

      {/* 결제 수단 선택 팝업 — widgetOpen이 한 번 true가 된 뒤로는 DOM에서 안 지워지고
          modalVisible로 보이기만 껐다 켰다 함 (지웠다 다시 그리면 토스 위젯을 다시 불러와야 해서) */}
      {widgetOpen && (
        <div
          className="adminModalOverlay"
          style={{ display: modalVisible ? "flex" : "none" }}
          onClick={() => setModalVisible(false)}
        >
          <div
            className="adminModal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adminModalHeader">
              <p style={{ fontWeight: 700, fontSize: "var(--font-xl)" }}>결제 수단 선택</p>
              <button
                type="button"
                className="adminModalClose"
                onClick={() => setModalVisible(false)}
              >
                ×
              </button>
            </div>

            <div className="adminModalBody">
              <div id="payment-method" />
              <div id="agreement" />
            </div>

            <div className="adminModalFooter">
              <Button
                variant="primary"
                fullWidth
                disabled={!ready}
                onClick={handlePayment}
              >
                {ready
                  ? `${amount.toLocaleString("ko-KR")}원 결제하기`
                  : "결제위젯 불러오는 중..."}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={PAYMENT_WRAP_STYLE}>
          <p className="loadingMsg">불러오는 중...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
