"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  addRound,
  updatePerformance,
  deletePerformance,
  deleteRound,
  uploadPoster,
} from "@/lib/api/admin";
import type { Performance, PerformanceRound } from "@/lib/data/types";

const toMysqlDatetime = (v: string) => {
  if (!v) return v;
  return (v.length === 16 ? v + ":00" : v).replace("T", " ");
};

// API에서 오는 "2026-08-15 19:00:00" → datetime-local 입력값 "2026-08-15T19:00"
const toInputDatetime = (v: string) => {
  if (!v) return "";
  return v.replace(" ", "T").substring(0, 16);
};

const isLocked = (perf: Performance) =>
  perf.rounds?.some(r => new Date(r.openTime) <= new Date()) ?? false;

export default function AdminPerformancesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  // 수정 모달
  const [editingPerf, setEditingPerf] = useState<Performance | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPosterUrl, setEditPosterUrl] = useState("");
  const [editPreview, setEditPreview] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // 회차 수정 값 추적: { [roundId]: { roundTime, openTime } }
  const [roundEdits, setRoundEdits] = useState<Record<number, { roundTime: string; openTime: string }>>({});

  // 회차 추가 (수정 모달 내)
  const [newRound, setNewRound] = useState({ roundTime: "", openTime: "" });
  const [addingRound, setAddingRound] = useState(false);

  const editTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || (userSession.roleId !== 2 && userSession.roleId !== 3)) {
      router.replace("/");
      return;
    }
    fetch("/api/events", { credentials: "include" })
      .then(r => r.json())
      .then(perfs => setPerformances(perfs))
      .finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const openEdit = (perf: Performance) => {
    setEditingPerf(perf);
    setEditTitle(perf.pTitle);
    setEditPosterUrl(perf.posterUrl ?? "");
    setEditPreview(perf.posterUrl ?? "");
    setEditMsg(null);
    setNewRound({ roundTime: "", openTime: "" });
    // 기존 회차 값을 input 형식으로 초기화
    const edits: Record<number, { roundTime: string; openTime: string }> = {};
    perf.rounds?.forEach(r => {
      edits[r.roundId] = {
        roundTime: toInputDatetime(r.roundTime),
        openTime: toInputDatetime(r.openTime),
      };
    });
    setRoundEdits(edits);
  };

  const closeEdit = () => { setEditingPerf(null); setEditMsg(null); };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPreview(URL.createObjectURL(file));
    setEditUploading(true);
    try {
      const url = await uploadPoster(file);
      setEditPosterUrl(url);
    } catch (err: any) {
      setEditMsg({ text: err?.message ?? "이미지 업로드 실패", ok: false });
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingPerf) return;
    if (!editTitle.trim()) { editTitleRef.current?.focus(); setEditMsg({ text: "제목을 입력하세요.", ok: false }); return; }
    setEditSaving(true);
    try {
      const unlockedRounds = (editingPerf.rounds ?? []).filter(r => new Date(r.openTime) > new Date());
      await updatePerformance(editingPerf.performanceId, {
        pTitle: editTitle,
        posterUrl: editPosterUrl,
        rounds: unlockedRounds.map(r => ({
          roundId: r.roundId,
          roundTime: toMysqlDatetime(roundEdits[r.roundId]?.roundTime ?? toInputDatetime(r.roundTime)),
          openTime: toMysqlDatetime(roundEdits[r.roundId]?.openTime ?? toInputDatetime(r.openTime)),
        })),
      });

      setPerformances(prev =>
        prev.map(p => p.performanceId === editingPerf.performanceId
          ? { ...p, pTitle: editTitle, posterUrl: editPosterUrl }
          : p)
      );
      setEditMsg({ text: "저장되었습니다.", ok: true });
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "저장에 실패했습니다.", ok: false });
    } finally { setEditSaving(false); }
  };

  const handleDeleteRound = async (roundId: number) => {
    if (!editingPerf) return;
    if (!confirm("이 회차를 삭제하시겠습니까?")) return;
    try {
      await deleteRound(editingPerf.performanceId, roundId);
      const updated = { ...editingPerf, rounds: editingPerf.rounds.filter(r => r.roundId !== roundId) };
      setEditingPerf(updated);
      setPerformances(prev => prev.map(p => p.performanceId === editingPerf.performanceId ? updated : p));
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "회차 삭제에 실패했습니다.", ok: false });
    }
  };

  const handleAddRound = async () => {
    if (!editingPerf || !newRound.roundTime || !newRound.openTime) {
      setEditMsg({ text: "회차 시간을 모두 입력하세요.", ok: false });
      return;
    }
    setAddingRound(true);
    try {
      const { roundId } = await addRound(editingPerf.performanceId, {
        roundTime: toMysqlDatetime(newRound.roundTime),
        openTime: toMysqlDatetime(newRound.openTime),
      });
      const added: PerformanceRound = {
        roundId,
        performanceId: editingPerf.performanceId,
        roundTime: newRound.roundTime,
        openTime: newRound.openTime,
        roundStatus: "OPEN",
      };
      const updated = { ...editingPerf, rounds: [...(editingPerf.rounds ?? []), added] };
      setEditingPerf(updated);
      setPerformances(prev => prev.map(p => p.performanceId === editingPerf.performanceId ? updated : p));
      setNewRound({ roundTime: "", openTime: "" });
      setEditMsg({ text: "회차가 추가되었습니다.", ok: true });
    } catch (e: any) {
      setEditMsg({ text: e?.message ?? "회차 추가에 실패했습니다.", ok: false });
    } finally { setAddingRound(false); }
  };

  const handleDeletePerformance = async (perf: Performance) => {
    if (isLocked(perf)) return;
    if (!confirm(`"${perf.pTitle}" 공연을 삭제하시겠습니까?`)) return;
    try {
      await deletePerformance(perf.performanceId);
      setPerformances(prev => prev.filter(p => p.performanceId !== perf.performanceId));
    } catch (e: any) {
      alert(e?.message ?? "삭제에 실패했습니다.");
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><p className="loadingMsg">불러오는 중...</p></div>;

  const locked = editingPerf ? isLocked(editingPerf) : false;

  return (
    <div className="pageWrap">
      <div className="adminPageHeader">
        <div>
          <h1 className="pageTitle">공연 관리</h1>
          <p className="pageSubtitle">공연을 수정하거나 삭제합니다.</p>
        </div>
        <button className="btnPrimary" onClick={() => router.push("/admin/performances/new")}>
          + 공연 추가
        </button>
      </div>

      {performances.length === 0 && <p className="loadingMsg">등록된 공연이 없습니다.</p>}

      <div className="adminPerfGrid">
        {performances.map(perf => {
          const locked = isLocked(perf);
          return (
            <div key={perf.performanceId} className="adminPerfCard">
              <div className="adminPerfPoster">
                {perf.posterUrl
                  ? <img src={perf.posterUrl} alt={perf.pTitle} />
                  : <div className="adminPerfPosterEmpty" />}
              </div>
              <div className="adminPerfInfo">
                <p className="adminPerfTitle">{perf.pTitle}</p>
                <p className="adminPerfVenue">{perf.pLocation}</p>
                <p className="adminPerfRounds">{perf.rounds?.length ?? 0}회차</p>
                {(perf.rounds ?? []).map((r) => {
                  const roundLocked = new Date(r.openTime) <= new Date();
                  return (
                    <div key={r.roundId} className="adminPerfRoundDetail">
                      <span>공연 {toInputDatetime(r.roundTime).replace("T", " ")}</span>
                      <span>예매 {toInputDatetime(r.openTime).replace("T", " ")} {roundLocked && "🔒"}</span>
                    </div>
                  );
                })}
              </div>
              <div className="adminPerfActions">
                <button className="btnSecondary" onClick={() => openEdit(perf)}>수정</button>
                <button
                  className="btnDanger"
                  onClick={() => handleDeletePerformance(perf)}
                  disabled={locked}
                  title={locked ? "예매 오픈된 회차가 있어 삭제할 수 없습니다." : ""}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 수정 모달 */}
      {editingPerf && (
        <div className="adminModalOverlay" onClick={closeEdit}>
          <div className="adminModal" onClick={e => e.stopPropagation()}>
            <div className="adminModalHeader">
              <h2 className="adminCardTitle" style={{ margin: 0 }}>공연 수정</h2>
              <button className="adminModalClose" onClick={closeEdit}>✕</button>
            </div>

            <div className="adminModalBody">
              {/* 제목 */}
              <div className="adminFormRow">
                <label className="adminLabel">공연 제목 <span className="adminRequired">*</span></label>
                <input
                  ref={editTitleRef}
                  className="adminInput"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              </div>

              {/* 포스터 */}
              <div className="adminFormRow">
                <label className="adminLabel">포스터 이미지</label>
                <div className="adminPosterWrap">
                  {editPreview && (
                    <div className="adminPosterPreview">
                      <img src={editPreview} alt="미리보기" />
                      {editUploading && <div className="adminPosterOverlay">업로드 중...</div>}
                    </div>
                  )}
                  <label className="adminFileLabel">
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleEditFileChange} />
                    {editPreview ? "이미지 변경" : "이미지 선택"}
                  </label>
                </div>
              </div>

              {/* 회차 목록 */}
              <div className="adminFormSection">
                <label className="adminLabel" style={{ display: "block", marginBottom: 10 }}>회차 목록</label>
                {(editingPerf.rounds ?? []).length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 10 }}>등록된 회차가 없습니다.</p>
                )}
                {(editingPerf.rounds ?? []).map((r, idx) => {
                  const roundLocked = new Date(r.openTime) <= new Date();
                  return (
                    <div key={r.roundId} className="adminRoundCard">
                      <div className="adminRoundCardHeader">
                        <span className="adminRoundNum">{idx + 1}회차</span>
                        {roundLocked && <span style={{ fontSize: 11, color: "var(--error)" }}>🔒 오픈됨 — 수정 불가</span>}
                        <button
                          className="btnDanger"
                          style={{ marginLeft: "auto", padding: "4px 10px", fontSize: 12 }}
                          onClick={() => handleDeleteRound(r.roundId)}
                          disabled={roundLocked}
                          title={roundLocked ? "오픈된 회차는 삭제할 수 없습니다." : ""}
                        >
                          삭제
                        </button>
                      </div>
                      <div className="adminRoundCardBody">
                        <div className="adminFormRow" style={{ marginBottom: 0 }}>
                          <label className="adminLabel">공연 시간</label>
                          <input
                            className="adminInput"
                            type="datetime-local"
                            disabled={roundLocked}
                            value={roundEdits[r.roundId]?.roundTime ?? ""}
                            onChange={e => setRoundEdits(prev => ({
                              ...prev,
                              [r.roundId]: { ...prev[r.roundId], roundTime: e.target.value },
                            }))}
                          />
                        </div>
                        <div className="adminFormRow" style={{ marginBottom: 0 }}>
                          <label className="adminLabel">예매 오픈</label>
                          <input
                            className="adminInput"
                            type="datetime-local"
                            disabled={roundLocked}
                            value={roundEdits[r.roundId]?.openTime ?? ""}
                            onChange={e => setRoundEdits(prev => ({
                              ...prev,
                              [r.roundId]: { ...prev[r.roundId], openTime: e.target.value },
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 회차 추가 */}
                <div className="adminRoundRow" style={{ marginTop: 8 }}>
                  <div className="adminFormRow" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="adminLabel">공연 시간</label>
                    <input className="adminInput" type="datetime-local" value={newRound.roundTime}
                      onChange={e => setNewRound(r => ({ ...r, roundTime: e.target.value }))} />
                  </div>
                  <div className="adminFormRow" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="adminLabel">예매 오픈</label>
                    <input className="adminInput" type="datetime-local" value={newRound.openTime}
                      onChange={e => setNewRound(r => ({ ...r, openTime: e.target.value }))} />
                  </div>
                  <button className="btnSecondary" style={{ alignSelf: "flex-end" }}
                    onClick={handleAddRound} disabled={addingRound}>
                    {addingRound ? "추가 중..." : "+ 회차"}
                  </button>
                </div>
              </div>

              {editMsg && <p className={editMsg.ok ? "successMsg" : "errorMsg"}>{editMsg.text}</p>}
            </div>

            <div className="adminModalFooter">
              <button className="btnSecondary" onClick={closeEdit}>닫기</button>
              <button className="btnPrimary" onClick={handleEditSave} disabled={editSaving || editUploading}>
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
