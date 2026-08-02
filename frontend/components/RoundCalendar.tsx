"use client";

// 공연 상세 화면의 회차 달력 (PER02_DETAIL02).
// 달력에서 날짜를 고르면 아래 회차 목록이 그 날짜만 남는 "필터" 방식이고,
// 달 이동(◀ ▶)은 보고 있는 달을 바꾼다.
//
// 지금은 공연의 전체 회차를 props 로 받아서 월 분리/필터를 전부 클라이언트에서 처리한다.
// 7단계에서 GET /api/events/{performanceId}/calendar?month=YYYY-MM 을 붙일 때는
// "달 이동" 시점에만 서버를 다시 부르고, 날짜 클릭 필터는 지금처럼 클라이언트에서 유지하면 된다
// (날짜 누를 때마다 요청하면 반응이 느려짐).

import { useMemo, useState } from "react";
import BookButton from "@/components/BookButton";
import { formatRoundTime, parseDateTime } from "@/lib/utils/datetime";
import type { PerformanceRound } from "@/lib/data/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Props = {
  rounds: PerformanceRound[];
  title: string;
};

type DatedRound = PerformanceRound & {
  year: number;
  month: number;
  day: number;
};

export default function RoundCalendar({ rounds, title }: Props) {
  // 회차마다 연/월/일을 미리 뽑아둔다 (달력 칸과 대조할 때 매번 파싱하지 않도록)
  const dated: DatedRound[] = useMemo(
    () =>
      rounds.map((round) => {
        const { year, month, day } = parseDateTime(round.roundTime);
        return { ...round, year, month, day };
      }),
    [rounds]
  );

  // 회차가 존재하는 달의 범위 — 이 밖으로는 달 이동을 막아서 빈 달을 계속 넘기지 않게 함
  const monthKeys = useMemo(() => {
    const keys = dated.map((r) => r.year * 12 + (r.month - 1));
    return keys.length > 0
      ? { min: Math.min(...keys), max: Math.max(...keys) }
      : null;
  }, [dated]);

  // 첫 회차가 있는 달부터 보여준다
  const [viewKey, setViewKey] = useState<number>(() =>
    monthKeys ? monthKeys.min : new Date().getUTCFullYear() * 12
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const viewYear = Math.floor(viewKey / 12);
  const viewMonth = (viewKey % 12) + 1;

  // 이 달에 속한 회차만
  const roundsThisMonth = dated.filter(
    (r) => r.year === viewYear && r.month === viewMonth
  );
  const daysWithRound = new Set(roundsThisMonth.map((r) => r.day));

  // 달력 격자 계산 — Date.UTC 로 만들어 실행 환경 타임존과 무관하게 같은 요일이 나오게 함
  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const canPrev = monthKeys !== null && viewKey > monthKeys.min;
  const canNext = monthKeys !== null && viewKey < monthKeys.max;

  const moveMonth = (delta: number) => {
    setViewKey((key) => key + delta);
    setSelectedDay(null); // 달이 바뀌면 날짜 선택은 해제 (다른 달의 날짜였으므로)
  };

  // 목록에 보여줄 회차 — 날짜를 고르면 그 날짜만, 아니면 이 달 전체
  const listed =
    selectedDay === null
      ? roundsThisMonth
      : roundsThisMonth.filter((r) => r.day === selectedDay);

  return (
    <section className="detailSection">
      <h3 className="detailSectionTitle">회차</h3>

      <div className="calendarHeader">
        <button
          type="button"
          className="calendarNav"
          onClick={() => moveMonth(-1)}
          disabled={!canPrev}
          aria-label="이전 달"
        >
          ‹
        </button>
        <span className="calendarMonth">
          {viewYear}년 {viewMonth}월
        </span>
        <button
          type="button"
          className="calendarNav"
          onClick={() => moveMonth(1)}
          disabled={!canNext}
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="calendarDow">
        {WEEKDAYS.map((name) => (
          <span key={name} className="calendarDowCell">
            {name}
          </span>
        ))}
      </div>

      <div className="calendarGrid">
        {/* 1일이 시작하는 요일만큼 빈 칸을 채워서 요일을 맞춤 */}
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} className="calendarCell calendarCellEmpty" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const hasRound = daysWithRound.has(day);
          const isSelected = selectedDay === day;

          // 회차가 없는 날은 버튼이 아니라 그냥 숫자로 (누를 게 없음)
          if (!hasRound) {
            return (
              <span key={day} className="calendarCell calendarCellMuted">
                {day}
              </span>
            );
          }

          return (
            <button
              key={day}
              type="button"
              className={`calendarCell calendarCellHas${isSelected ? " calendarCellSelected" : ""}`}
              aria-pressed={isSelected}
              aria-label={`${viewMonth}월 ${day}일 회차 보기`}
              // 같은 날짜를 다시 누르면 선택 해제 → 이 달 전체로 돌아감
              onClick={() => setSelectedDay(isSelected ? null : day)}
            >
              {day}
              <span className="calendarDot" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="calendarListHeader">
        <span className="calendarListLabel">
          {selectedDay === null
            ? `${viewMonth}월 전체 회차 ${listed.length}건`
            : `${viewMonth}월 ${selectedDay}일 회차 ${listed.length}건`}
        </span>
        {selectedDay !== null && (
          <button
            type="button"
            className="calendarClear"
            onClick={() => setSelectedDay(null)}
          >
            전체 보기
          </button>
        )}
      </div>

      <div className="roundList">
        {listed.length === 0 ? (
          <p className="detailEmpty">이 달에는 등록된 회차가 없습니다.</p>
        ) : (
          listed.map((round) => (
            <div key={round.roundId} className="roundRow">
              <span className="roundTime">{formatRoundTime(round.roundTime)}</span>
              <BookButton
                roundId={round.roundId}
                roundTime={round.roundTime}
                openTime={round.openTime}
                title={title}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
