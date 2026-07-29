// Server Component — "use client" 없음
// 서버에서 실행되므로 useState, useEffect, useRouter 사용 불가
// 데이터는 async/await 로 직접 fetch, 네비게이션은 <Link> 사용

import BookButton from "@/components/BookButton";
import { BASE_URL } from "@/lib/api/client";

// 백엔드 PerformanceDTO 와 일치
type Round = {
  roundId: number;
  roundTime: string;
  openTime: string;
  roundStatus: "OPEN" | "CLOSED" | "SOLDOUT";
};
type Performance = {
  performanceId: number;
  pTitle: string;
  pLocation: string;
  posterUrl: string;
  rounds: Round[];
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "예매 가능",
  CLOSED: "예매 종료",
  SOLDOUT: "매진",
};

const STATUS_CLASS: Record<string, string> = {
  OPEN: "badge badgeOpen",
  CLOSED: "badge badgeClosed",
  SOLDOUT: "badge badgeSoldout",
};


export default async function EventsPage() {
  ///events api 호출
  const res = await fetch(`${BASE_URL}/api/events`, { cache: "no-store" });
  const performances: Performance[] = await res.json();

  return (
    <div className="pageWrap">
      <div className="pageHeader">
        <h1 className="pageTitle">공연 목록</h1>
        <p className="pageSubtitle">예매하고 싶은 공연을 선택하세요.</p>
      </div>

      {performances.length === 0 && (
        <p className="loadingMsg">등록된 공연이 없습니다.</p>
      )}

      <div className="eventGrid">
        {performances.map((performance) => (
          <div key={performance.performanceId} className="eventCard">
            <div className="eventPoster">
              {/* posterUrl 이 있으면 이미지, 없으면 기본 배경  */}
              {performance.posterUrl
                ? <img src={performance.posterUrl} alt={performance.pTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "var(--surface2)" }} />
              }
            </div>

            <div className="eventInfo">
              <p className="eventTitle">{performance.pTitle}</p>
              <p className="eventLocation">{performance.pLocation}</p>

              <div className="eventRounds">
                {performance.rounds?.map((round) => (
                  <div key={round.roundId} className="eventRoundRow">
                    <span className="eventRoundTime">
                      {round.roundTime.replace("T", " ")}
                    </span>

                    {round.roundStatus !== "SOLDOUT" ? (
                      <BookButton
                        roundId={round.roundId}
                        roundTime={round.roundTime}
                        openTime={round.openTime}
                        title={performance.pTitle}
                      />
                    ) : (
                      <span className="badge badgeSoldout">매진</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
