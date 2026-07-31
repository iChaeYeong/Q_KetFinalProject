// Server Component — "use client" 없음
// 서버에서 실행되므로 useState, useEffect, useRouter 사용 불가
// 데이터는 async/await 로 직접 fetch, 네비게이션은 <Link> 사용

import BookButton from "@/components/BookButton";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import StatusMessage from "@/components/ui/StatusMessage";
import { BASE_URL, unwrap } from "@/lib/api/client";
import type { PageResponse } from "@/lib/data/types";

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

// 한 페이지에 보여줄 공연 개수 — 백엔드 PerformanceController.pagedList()의 size 기본값(8)과 맞춤
const PAGE_SIZE = 8;

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


export default async function EventsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(Number(searchParams.page) || 1, 1);

  //events api 호출 (페이지 단위)
  const res = await fetch(`${BASE_URL}/api/events/paged?page=${page}&size=${PAGE_SIZE}`, {
    cache: "no-store",
  });
  // GET /api/events/paged는 GlobalResponseAdvice가 { success, message, data, timestamp }로 감싸서 내려주므로
  // apiFetch를 안 거치는 이 직접 fetch()에서도 unwrap으로 data만 꺼내야 함
  const pageData = unwrap(await res.json()) as PageResponse<Performance>;
  const performances = pageData.content;
  console.log(JSON.stringify(pageData, null, 2));

  return (
    <PageHeader title="공연 목록" subtitle="예매하고 싶은 공연을 선택하세요.">
      {performances.length === 0 && (
        <StatusMessage variant="loading">등록된 공연이 없습니다.</StatusMessage>
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
                      <Badge variant="soldout">매진</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={pageData.page} totalPages={pageData.totalPages} basePath="/" />
    </PageHeader>
  );
}
