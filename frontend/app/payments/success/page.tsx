type Props = {
  searchParams: {
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  };
};

export default function PaymentSuccessPage({
  searchParams,
}: Props) {
  return (
    <div className="pageWrap">
      <h1 className="pageTitle">결제 인증 성공</h1>

      <p>
        주문번호: {searchParams.orderId}
      </p>

      <p>
        결제금액:{" "}
        {Number(searchParams.amount ?? 0).toLocaleString("ko-KR")}원
      </p>

      <p className="pageSubtitle">
        아직 서버 최종 승인이 필요한 상태입니다.
      </p>
    </div>
  );
}