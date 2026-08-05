import type { CSSProperties } from "react";

// styles/payment.css의 .paymentWrap 클래스가 컴파일된 CSS 번들에서 원인 불명으로 누락되는
// 문제가 있어(같은 파일의 다른 .payment* 클래스는 전부 정상 로드됨) 임시로 인라인 스타일로 대체함.
export const PAYMENT_WRAP_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 58px)",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "var(--bg)",
  overflowX: "hidden",
};
