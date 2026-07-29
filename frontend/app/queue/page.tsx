// Client Component — "use client" 필요한 이유:
//   1. 대기열 상태 폴링 (setInterval, useRef)
//   2. 대기 순번 실시간 업데이트 (useState: status)
//   3. 입장 완료 시 페이지 이동 (useRouter)
//   4. URL 쿼리 파라미터 읽기 (useSearchParams → Suspense 필수)
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { QueueStatus } from "@/lib/data/types";
import { joinQueue, getQueueStatus, leaveQueue } from "@/lib/api/queues";

// [TODO-QUEUE-NOTE]
// 대기열 흐름:
//   1. 페이지 진입 → POST /api/queues 로 대기열 등록 → queueToken 받기
//   2. 3초마다 GET /api/queues/{queueToken} 폴링 → position, status 확인
//   3. status === "ENTERED" 이면 폴링 중단 → /seats/{scheduleId} 로 이동
//   4. status === "EXPIRED" 이면 폴링 중단 → 에러 메시지 표시

function QueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터: /queue?scheduleId=1&title=공연명
  const scheduleId = Number(searchParams.get("scheduleId") ?? "0");
  const title = searchParams.get("title") ?? "공연";

  // 대기열 상태 (position, estimatedWait, status)
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState("");

  // [TODO-QUEUE-TOKEN] 대기열 토큰 저장용 ref (리렌더링 없이 보관)
  const tokenRef = useRef<string>("");

  // [TODO-QUEUE-INTERVAL] 폴링 인터벌 ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // [FIX-QUEUE-CANCEL] 언마운트 이후 도착하는 응답/타이머가 상태를 건드리지 못하게 막는 플래그
  // (React StrictMode의 effect 이중 실행으로 인해 orphan 타이머가 생기는 문제 방지)
  const cancelledRef = useRef(false);

  // [TODO-QUEUE-STOP] 폴링 중단 함수
  const stopPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
  };

  // [TODO-QUEUE-POLL] 3초마다 대기열 상태 조회
  // lib/api/queues.ts 의 getQueueStatus(token) 호출 → GET /api/queues/{token}
  // 응답을 setStatus 에 저장
  // status === "ENTERED" → stopPolling() 후 1.5초 뒤 router.push(`/seats/${scheduleId}`)
  // status === "EXPIRED" → stopPolling() 후 setError("대기열이 만료되었습니다.")
  const poll = async (token: string) => {
    try {
      const result = await getQueueStatus(token);
      if (cancelledRef.current) return;
      setStatus(result);

      if (result.status === "ENTERED") {
        stopPolling();
        redirectTimeoutRef.current = setTimeout(() => {
          if (cancelledRef.current) return;
          // push 대신 replace: 대기열 페이지를 히스토리에서 교체해야
          // 좌석 선택 화면에서 "뒤로가기"를 눌러도 대기열로 돌아가서 자동 재입장되는 문제가 안 생김
          router.replace(`/seats/${scheduleId}?queueToken=${token}`);
        }, 1500);
      } else if (result.status === "EXPIRED") {
        stopPolling();
        setError("대기열이 만료되었습니다.");
      }
    } catch (e: any) {
      if (cancelledRef.current) return;
      stopPolling();
      setError(e?.message ?? "서버에 연결할 수 없습니다.");
    }
  };

  // [TODO-QUEUE-JOIN] 페이지 진입 시 대기열 등록
  // 1. scheduleId 없으면 setError("잘못된 접근입니다.") 후 리턴
  // 2. lib/api/queues.ts 의 joinQueue(scheduleId) 호출 → POST /api/queues
  //    응답: { queueToken: "..." }
  // 3. tokenRef.current = queueToken
  // 4. poll(queueToken) 즉시 1회 호출
  // 5. setInterval(() => poll(queueToken), 3000) 로 3초마다 폴링 시작
  // 6. 백엔드 미연결 시 catch 블록에서 에러 표시 또는 데모 모드
  // 7. 컴포넌트 언마운트 시 stopPolling() 호출 (return stopPolling)
  useEffect(() => {
    cancelledRef.current = false;

    if (!scheduleId) {
      setError("잘못된 접근입니다.");
      return stopPolling;
    }

    joinQueue(scheduleId)
        .then(({ queueToken }) => {
          if (cancelledRef.current) return;
          tokenRef.current = queueToken;
          poll(queueToken);
          intervalRef.current = setInterval(() => poll(queueToken), 3000);
        })
        .catch((e: any) => {
          if (cancelledRef.current) return;
          setError(e?.message ?? "대기열 등록에 실패했습니다.");
        });

    const handleBeforeUnload = () => {
      if (tokenRef.current) leaveQueue(tokenRef.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelledRef.current = true;
      stopPolling();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [scheduleId]);

  // 대기시간 포맷 (초 → "약 N초" 또는 "약 N분")
  const formatWait = (seconds: number) => {
    if (seconds < 60) return `약 ${seconds}초`;
    return `약 ${Math.ceil(seconds / 60)}분`;
  };

  return (
    <div className="queueWrap">
      <div className="queueBox">
        <div className="queueIcon">🎫</div>
        <h1 className="queueTitle">대기열</h1>
        <p className="queueEventName">{title}</p>

        {error && <p className="errorMsg">{error}</p>}

        {/* 대기열 진입 중 (status 아직 없음) */}
        {!error && !status && (
          <>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)" }}>대기열에 진입하는 중...</p>
          </>
        )}

        {/* 대기 중 */}
        {status?.status === "WAITING" && (
          <>
            <div className="queuePosition">{status.position.toLocaleString()}</div>
            <p className="queuePositionLabel">내 앞 대기 인원</p>
            <p className="queueWait">
              예상 대기시간 <strong>{formatWait(status.estimatedWait)}</strong>
            </p>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
            <p className="queueNote">페이지를 벗어나지 마세요. 순번이 되면 자동으로 이동합니다.</p>
          </>
        )}

        {/* 입장 완료 */}
        {status?.status === "ENTERED" && (
          <>
            <div className="queueEntered">✅ 입장 가능합니다! 좌석 선택 페이지로 이동합니다...</div>
            <div className="queueDots">
              <div className="queueDot" />
              <div className="queueDot" />
              <div className="queueDot" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// [TODO-QUEUE-SUSPENSE] useSearchParams() 는 Suspense 안에서만 써야 함 — 이 구조 유지
export default function QueuePage() {
  return (
    <Suspense fallback={
      <div className="queueWrap">
        <div className="queueBox">
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>로딩 중...</p>
        </div>
      </div>
    }>
      <QueueContent />
    </Suspense>
  );
}
