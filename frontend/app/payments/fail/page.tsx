type Props = {
  searchParams: {
    code?: string;
    message?: string;
  };
};

export default function PaymentFailPage({
  searchParams,
}: Props) {
  return (
    <div className="pageWrap">
      <h1 className="pageTitle">결제 실패</h1>

      <p>오류 코드: {searchParams.code}</p>
      <p>{searchParams.message}</p>
    </div>
  );
}