// Server Component — 목 데이터를 그대로 읽어 렌더링만 함 ("use client" 없음)
// 탭 전환처럼 상태가 필요한 부분은 components/PerformanceTabs.tsx(Client Component)로 분리했다.
// 8단계에서 실제 API를 붙일 때 async 함수로 바꾸고 MOCK_… 자리를 getEvent() 호출로 교체한다.

import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import PerformanceTabs, { type RoundCastGroup } from "@/components/PerformanceTabs";
import RoundCalendar from "@/components/RoundCalendar";
import { MOCK_PERFORMANCE_DETAIL } from "@/lib/data/mock/performanceDetail";
import { formatRoundTime } from "@/lib/utils/datetime";

export default function PerformanceDetailPage({
  params,
}: {
  params: { performanceId: string };
}) {
  const performanceId = Number(params.performanceId);
  const detail = MOCK_PERFORMANCE_DETAIL[performanceId];

  // 없는 공연이면 404 (notFound()의 반환 타입이 never라 아래에서 detail이 자동으로 좁혀짐)
  if (!detail) notFound();

  // 전체 회차 공통 캐스팅
  const commonCasts = detail.casts
    .filter((cast) => cast.roundId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // 회차별 캐스팅 — 회차 순서대로 묶음. 캐스팅이 없는 회차는 제외
  const roundCasts: RoundCastGroup[] = detail.rounds
    .map((round) => ({
      roundId: round.roundId,
      roundLabel: formatRoundTime(round.roundTime),
      casts: detail.casts
        .filter((cast) => cast.roundId === round.roundId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((group) => group.casts.length > 0);

  // 상단 요약에 쓰는 "배우 수" — casts 배열 길이를 그대로 쓰면 회차별 중복 출연이 이중으로 세어져
  // (예: 3회차 모두 나오는 배우가 3명으로 계산됨) 실제 배우 수보다 크게 보인다. 이름 기준으로 중복 제거.
  const actorCount = new Set(detail.casts.map((cast) => cast.actorName)).size;

  return (
    <PageHeader title={detail.pTitle} subtitle={detail.pLocation}>
      <div className="detailTop">
        <div className="detailPoster">
          {detail.posterUrl
            ? <img src={detail.posterUrl} alt={detail.pTitle} />
            : <div className="detailPosterEmpty" />}
        </div>

        <div className="detailInfo">
          <h2 className="detailTitle">{detail.pTitle}</h2>
          <dl className="detailMeta">
            <div className="detailMetaRow">
              <dt>공연장</dt>
              <dd>{detail.pLocation}</dd>
            </div>
            <div className="detailMetaRow">
              <dt>회차</dt>
              <dd>총 {detail.rounds.length}회</dd>
            </div>
            <div className="detailMetaRow">
              <dt>출연</dt>
              <dd>
                {actorCount > 0
                  ? `배우 ${actorCount}명${roundCasts.length > 0 ? " · 회차별 캐스팅 있음" : ""}`
                  : "정보 없음"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 회차 — 달력에서 날짜를 고르면 아래 목록이 그 날짜만 남는다 */}
      <RoundCalendar rounds={detail.rounds} title={detail.pTitle} />

      {/* 출연진 / 감상평 탭 */}
      <PerformanceTabs commonCasts={commonCasts} roundCasts={roundCasts} />
    </PageHeader>
  );
}
