"use client";

// 버튼 tsx import 추가
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import QueueModal from "@/components/QueueModal";

type Props = {
  roundId: number;
  openTime: string;
  roundTime: string;
  title: string;
};

// [BOOK-STATE] 버튼 상태 3가지
// hidden  - 10분 전보다 이전 (버튼 안 보임)
// pending - 10분 전 ~ 오픈시간 (버튼 보이지만 클릭 시 alert)
// open    - 오픈시간 이후 (버튼 활성화, /queue 이동)
// close   - 공연시간 이후 (버튼 비활성화)

type ButtonState = "Before" | "pending" | "open" | "closed";

export default function BookButton({ roundId, openTime, roundTime, title }: Props) {
  const router = useRouter();
  const { userSession } = useAuth();

  const [state, setState] = useState<ButtonState>("Before");
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    const open = new Date(openTime).getTime();
    const round = new Date(roundTime).getTime();

    const check = () => {
      const now = Date.now();
if (now >= round) {
        setState("closed");
      } else if (now >= open) {
        setState("open");
      } else if (now >= open - 10 * 60 * 1000) {
        setState("pending");
      } else {
        setState("Before");
      }
    };

    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [openTime, roundTime]);


  const openLabel = new Date(openTime).toLocaleString("ko-KR", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // [BOOK-HIDDEN] 10분 전보다 이전 — 오픈 시간 안내
  if (state === "Before") return (
    <div style={{ textAlign: "right" }}>
      <Badge variant="closed">예매 전</Badge>
      <p style={{ fontSize: "var(--font-xs)", color: "var(--text-3)", marginTop: "var(--space-0-5)" }}>오픈 {openLabel}</p>
    </div>
  );

  // [BOOK-PENDING] 10분 전 ~ 오픈 전 — 클릭 시 alert + 오픈 시간 안내
  // <Button 안에   variant = primary로 변경
  if (state === "pending") {
    return (
      <div style={{ textAlign: "right" }}>
        <Button
          variant="primary"
          style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-base)" }}
          onClick={() => {
            const now = new Date().toLocaleString("ko-KR");
            alert(`예매 오픈 전입니다.\n현재 시각: ${now}\n오픈 시각: ${new Date(openTime).toLocaleString("ko-KR")}`);
            console.log(`예매 오픈 전입니다.\n현재 시각: ${now}\n오픈 시각: ${new Date(openTime).toLocaleString("ko-KR")}`);

          }}
        >
          예매하기
        </Button>
        <p style={{ fontSize: "var(--font-xs)", color: "var(--text-3)", marginTop: "var(--space-0-5)" }}>오픈 {openLabel}</p>
      </div>
    );
  }

  if (state === "closed") return (
    <Badge variant="closed">예매 마감</Badge>
  );

  // [BOOK-OPEN] 오픈 이후 — 로그인 확인 후 대기열 팝업 오픈 (부모 페이지는 팝업 뒤에서 잠김)
  const handleBook = () => {
    if (!userSession) {
      alert("로그인 후 이용해주세요.");
      router.push("/login");
      return;
    }
    setShowQueue(true);
  };

  return (
    <>
      {/* <Button 안에   variant = primary로 변경 */}
      <Button
        variant="primary"
        style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-base)" }}
        onClick={handleBook}
      >
        예매하기
      </Button>
      {showQueue && (
        <QueueModal
          scheduleId={roundId}
          title={title}
          onClose={() => setShowQueue(false)}
        />
      )}
    </>
  );
}
