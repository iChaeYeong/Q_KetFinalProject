// Client Component — "use client" 필요한 이유:
//   1. 좌석 선택 상태 관리 (useState: selected, seats)
//   2. 예매하기 버튼 onClick 이벤트 핸들러 (handleReserve)
//   3. 좌석 클릭 이벤트 핸들러 (handleSelect)
//   * 이상적으로는 좌석 목록 fetch 는 Server Component 에서 처리하고
//     선택/예매 인터랙션만 Client Component 로 분리하는 것이 좋음
//     (Server Component → props 로 seats 전달 → Client Component 에서 selection 처리)
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Seat } from "@/lib/data/types";
import { getSeats } from "@/lib/api/seats"
import { createReservation } from "@/lib/api/reservations"


// 등급 표시 라벨
const GRADE_LABEL: Record<string, string> = { VIP: "VIP석", R: "R석", S: "S석" };

// 등급별 가격 (백엔드에서 받아올 수도 있음)
const GRADE_PRICE: Record<string, string> = { VIP: "220,000원", R: "154,000원", S: "99,000원" };

export default function SeatsPage() {
  //동적라우팅 값 가져오기
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const searchParams = useSearchParams();
  const queueToken = searchParams.get("queueToken") ?? undefined;
  const router = useRouter();

  // 좌석 목록
  const [seats, setSeats] = useState<Seat[]>([]);

  // 선택된 좌석 (단일 선택)
  const [selected, setSelected] = useState<Seat | null>(null);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSeats(Number(scheduleId))
      .then(setSeats)
      .catch(() => setSeats([]))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // 3초마다 좌석 상태 폴링 (다른 사용자의 예매 반영)
  useEffect(() => {
    const id = setInterval(() => {
      getSeats(Number(scheduleId))
        .then(fresh => {
          setSeats(fresh);
          // 현재 선택 좌석이 폴링 결과에서 더 이상 AVAILABLE 아니면 선택 해제
          setSelected(prev => {
            if (!prev) return null;
            const updated = fresh.find(s => s.seatId === prev.seatId);
            return updated?.status === "AVAILABLE" ? prev : null;
          });
        })
        .catch(() => { });
    }, 3000);
    return () => clearInterval(id);
  }, [scheduleId]);


  // [TODO-SEATS-SELECT] 좌석 클릭 시 실행
  // status === "AVAILABLE" 인 좌석만 선택 가능
  // 이미 선택된 좌석 다시 클릭 시 선택 해제

  const handleSelect = (seat: Seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelected(prev => prev?.seatId === seat.seatId ? null : seat);
  };


  // [TODO-SEATS-RESERVE] 예매하기 버튼 클릭 시 실행
  // 1. selected 없으면 리턴
  // 2. setBooking(true)
  // 3. lib/api/reservations.ts 의 createReservation(scheduleId, selected.seatId) 호출
  //    → POST /api/reservations { roundId: scheduleId, seatId }
  // 4. 성공 시 setSuccess(true) → 2초 뒤 router.push("/mypage")
  // 5. 실패 시 setError(응답.message)
  // 6. catch 블록에서 setError("서버에 연결할 수 없습니다.")
  // 7. finally 에서 setBooking(false)
  const handleReserve = async () => {
    if (!selected) return; //아무것도 선택하지 않고 예매 시

    setBooking(true);
    try {
      const result = await createReservation(selected.reservationId, Number(scheduleId), selected.seatId, queueToken);
      if (result.success) {
        setSuccess(true);
        // push 대신 replace: 좌석 페이지를 히스토리에서 교체해야
        // 마이페이지에서 뒤로가기를 눌러도 예매 끝난 좌석 화면(스냅샷)으로 안 돌아감
        setTimeout(() => router.replace("/mypage"), 2000);
      } else {
        alert(result.message ?? "예매에 실패했습니다.");
        setSelected(null);
        getSeats(Number(scheduleId)).then(setSeats).catch(() => { });
      }
    } catch (e: any) {
      alert(e?.message ?? "서버에 연결할 수 없습니다.");
      setSelected(null);
      getSeats(Number(scheduleId)).then(setSeats).catch(() => { });
    } finally {
      setBooking(false);
    }


  };

  // 좌석 버튼 CSS 클래스 결정
  // selected → seatSelected / RESERVED → seatReserved / LOCKED → seatLocked
  // 등급별 색상: VIP → seatAvailableVip / R → seatAvailableR / S → seatAvailableS
  const seatClass = (seat: Seat): string => {
    const base = "seat";
    if (selected?.seatId === seat.seatId) {
      const gradeClass = seat.grade === "VIP" ? "seatAvailableVip" : seat.grade === "R" ? "seatAvailableR" : "seatAvailableS";
      return `${base} ${gradeClass} seatSelected`;
    }
    if (seat.status === "RESERVED") return `${base} seatReserved`;
    if (seat.status === "LOCKED") return `${base} seatLocked`;
    if (seat.grade === "VIP") return `${base} seatAvailableVip`;
    if (seat.grade === "R") return `${base} seatAvailableR`;
    return `${base} seatAvailableS`;
  };

  // 실제 응답 데이터에 존재하는 행(row)만 사용 (하드코딩 X)
  // → 예전엔 ROWS 가 A~H 로 고정돼 있어서 그 뒤 행(예: S석 구간)이 화면에 아예 안 그려지는 버그가 있었음
  const ROWS = Array.from(new Set(seats.map(s => s.seatRow))).sort();

  // 행별로 좌석 그룹핑 (열 번호 순 정렬) + 무대로부터의 순서(rowIndex) 기록 — 곡선/폭 계산에 사용
  const byRow = ROWS.map((row, rowIndex) => ({
    row,
    rowIndex,
    grade: seats.find(s => s.seatRow === row)?.grade ?? "S",
    seats: seats.filter(s => s.seatRow === row).sort((a, b) => Number(a.seatColume) - Number(b.seatColume)),
  }));

  // 연속된 같은 등급의 행들을 하나의 섹션으로 묶기 (VIP / R / S 구역 구분 표시용)
  const sections: { grade: string; rows: typeof byRow }[] = [];
  byRow.forEach(entry => {
    const last = sections[sections.length - 1];
    if (last && last.grade === entry.grade) {
      last.rows.push(entry);
    } else {
      sections.push({ grade: entry.grade, rows: [entry] });
    }
  });

  // 실제 공연장 배치도처럼 각 행을 좌/중앙/우 3개 블록으로 분할
  // (양옆 블록은 CSS 에서 무대 쪽으로 살짝 회전시켜 부채꼴로 감싸는 느낌을 냄
  //  — 좌석을 개별로 이동시키는 방식과 달리 블록 안 좌석은 완벽히 정렬돼 보임)
  const splitRow = (rowSeats: Seat[]) => {
    const n = rowSeats.length;
    if (n < 8) return { left: [] as Seat[], center: rowSeats, right: [] as Seat[] }; // 좌석이 적으면 분할 없이 중앙만
    const side = Math.max(2, Math.round(n / 4)); // 양옆 각 1/4, 중앙 1/2
    return {
      left: rowSeats.slice(0, side),
      center: rowSeats.slice(side, n - side),
      right: rowSeats.slice(n - side),
    };
  };

  return (
    <>
      <div className="pageWrapWide">
        <div className="pageHeader">
          <h1 className="pageTitle">좌석 선택</h1>
          <p className="pageSubtitle">원하는 좌석을 선택한 뒤 예매를 완료하세요.</p>
        </div>

        {loading ? (
          <p className="loadingMsg">좌석 정보를 불러오는 중...</p>
        ) : (
          <div className="seatLayout">
            {/* 좌석 배치도 */}
            <div className="seatMapWrap">
              <div className="seatStage">STAGE</div>

              {/* 범례 */}
              <div className="seatLegend">
                <div className="seatLegendItem">
                  <div className="seatLegendDot" style={{ background: "var(--vip-color)" }} />
                  <span>VIP석</span>
                </div>
                <div className="seatLegendItem">
                  <div className="seatLegendDot" style={{ background: "var(--r-color)" }} />
                  <span>R석</span>
                </div>
                <div className="seatLegendItem">
                  <div className="seatLegendDot" style={{ background: "var(--s-color)" }} />
                  <span>S석</span>
                </div>
                <div className="seatLegendItem">
                  <div className="seatLegendDot" style={{ background: "var(--border-strong)" }} />
                  <span>예매완료</span>
                </div>
              </div>

              {/* 좌석 그리드 — 각 구역을 좌/중앙/우 3개 블록으로 나누고 양옆 블록을 무대 쪽으로
                  살짝 기울여 실제 공연장 배치도처럼 무대를 감싸는 형태. 블록 내부는 CSS Grid(1fr)라
                  공연장 규모와 무관하게 항상 폭에 맞고 좌석 크기도 균일함 */}
              <div className="seatVenue">
                <div className="seatGrid">
                  {sections.map((section, si) => (
                    <div key={si} className="seatSection">
                      <div className="seatSectionHeader">
                        <span className={`badge badge${section.grade === "VIP" ? "Vip" : section.grade}`}>
                          {GRADE_LABEL[section.grade] ?? section.grade}
                        </span>
                      </div>
                      {(() => {
                        // 블록별 좌석 수 비율에 맞춰 폭을 배분 (좌석 크기가 블록 간에도 동일하게 보이도록)
                        const firstRow = section.rows[0]?.seats ?? [];
                        const proto = splitRow(firstRow);
                        return (
                          <div className="seatBlocks">
                            {/* 행 라벨 컬럼 */}
                            <div className="seatLabelCol">
                              {section.rows.map(({ row }) => (
                                <span key={row} className="seatRowLabel">{row}</span>
                              ))}
                            </div>
                            {(["left", "center", "right"] as const).map(pos => {
                              const protoCount = proto[pos].length;
                              if (protoCount === 0) return null;
                              const blockClass =
                                pos === "left" ? "seatBlock seatBlockLeft"
                                  : pos === "right" ? "seatBlock seatBlockRight"
                                    : "seatBlock";
                              return (
                                <div key={pos} className={blockClass} style={{ flexGrow: protoCount }}>
                                  {section.rows.map(({ row, seats: rowSeats }) => {
                                    const blockSeats = splitRow(rowSeats)[pos];
                                    return (
                                      <div
                                        key={row}
                                        className="seatBlockRow"
                                        style={{ gridTemplateColumns: `repeat(${Math.max(blockSeats.length, 1)}, minmax(0, 1fr))` }}
                                      >
                                        {blockSeats.map(seat => (
                                          <button
                                            key={seat.seatId}
                                            className={seatClass(seat)}
                                            onClick={() => handleSelect(seat)}
                                            disabled={seat.status !== "AVAILABLE"}
                                            title={`${row}${seat.seatColume} (${GRADE_LABEL[seat.grade]})`}
                                          />
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 선택 정보 패널 */}
            <div className="seatPanel">
              <p className="seatPanelTitle">예매 정보</p>

              {!selected ? (
                <p className="seatPanelEmpty">좌석을 선택하세요</p>
              ) : (
                <>
                  <div className="seatPanelRow">
                    <span className="seatPanelLabel">좌석</span>
                    <span className="seatPanelValue">{selected.seatRow}{selected.seatColume}</span>
                  </div>
                  <div className="seatPanelRow">
                    <span className="seatPanelLabel">등급</span>
                    <span className="seatPanelValue">
                      <span className={`badge badge${selected.grade === "VIP" ? "Vip" : selected.grade}`}>
                        {GRADE_LABEL[selected.grade]}
                      </span>
                    </span>
                  </div>
                  <div className="seatPanelRow">
                    <span className="seatPanelLabel">가격</span>
                    <span className="seatPanelValue">{GRADE_PRICE[selected.grade]}</span>
                  </div>
                  <hr className="seatPanelDivider" />

                  {success ? (
                    <p className="successMsg">예매 완료! 마이페이지로 이동합니다.</p>
                  ) : (
                    <>
                      <button
                        className="btnPrimary"
                        style={{ width: "100%" }}
                        onClick={handleReserve}
                        disabled={booking}
                      >
                        {booking ? "예매 중..." : "예매하기"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
