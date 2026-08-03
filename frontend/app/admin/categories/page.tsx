"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAdminCategories, createCategory, updateCategory, type Category } from "@/lib/api/admin";

type RowChange = { categoryNm?: string; sortOrder?: number; useYn?: string };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // categoryId → 변경된 값
  const [changes, setChanges] = useState<Record<number, RowChange>>({});
  const [saving, setSaving] = useState(false);

  const [newCategoryNm, setNewCategoryNm] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => getAdminCategories().then(setCategories);

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load().finally(() => setLoading(false));
  }, [isLoading, userSession]);

  const changeCount = Object.keys(changes).length;

  const handleChange = (categoryId: number, field: keyof RowChange, value: string | number) => {
    setChanges((prev) => ({ ...prev, [categoryId]: { ...prev[categoryId], [field]: value } }));
    setMsg("");
  };

  const getVal = <T,>(categoryId: number, field: keyof RowChange, original: T): T =>
    (changes[categoryId]?.[field] as T) ?? original;

  const handleAdd = async () => {
    if (!newCategoryNm.trim()) return;
    setAdding(true);
    setMsg("");
    try {
      await createCategory({ categoryNm: newCategoryNm.trim() });
      setNewCategoryNm("");
      await load();
      setMsg("카테고리가 추가되었습니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async () => {
    if (changeCount === 0) return;
    setSaving(true);
    setMsg("");
    try {
      await Promise.all(
        Object.entries(changes).map(([categoryIdStr, data]) => updateCategory(Number(categoryIdStr), data))
      );
      await load();
      setChanges({});
      setMsg(`${changeCount}건이 저장되었습니다.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading)
    return <div className="pageWrap"><p className="loadingMsg">불러오는 중...</p></div>;

  return (
    <div className="pageWrap">
      <div className="adminPageHeader">
        <div>
          <h1 className="pageTitle">카테고리관리</h1>
          <p className="pageSubtitle">공연 카테고리를 등록·수정합니다.</p>
        </div>
        <div className="adminHeaderActions">
          {msg && <span className={msg.includes("실패") ? "errorMsg" : "successMsg"} style={{ margin: 0 }}>{msg}</span>}
          <button className="btnPrimary" onClick={handleSave} disabled={saving || changeCount === 0}>
            {saving ? "저장 중..." : changeCount > 0 ? `저장 (${changeCount}건)` : "저장"}
          </button>
        </div>
      </div>

      <div className="adminCard">
        <div className="adminCardTitle">새 카테고리 추가</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="adminLabel">카테고리명</label>
            <input
              className="adminInput"
              value={newCategoryNm}
              onChange={(e) => setNewCategoryNm(e.target.value)}
              placeholder="예: 클래식"
            />
          </div>
          <button className="btnSecondary" onClick={handleAdd} disabled={adding}>
            {adding ? "추가 중..." : "행 추가"}
          </button>
        </div>
      </div>

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>카테고리명</th>
              <th>정렬순서</th>
              <th>사용여부</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const isDirty = !!changes[c.categoryId];
              return (
                <tr key={c.categoryId} className={isDirty ? "adminRowDirty" : ""}>
                  <td>
                    <input
                      className={`adminInput${changes[c.categoryId]?.categoryNm !== undefined ? " dirty" : ""}`}
                      value={getVal(c.categoryId, "categoryNm", c.categoryNm)}
                      onChange={(e) => handleChange(c.categoryId, "categoryNm", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`adminInput${changes[c.categoryId]?.sortOrder !== undefined ? " dirty" : ""}`}
                      type="number"
                      style={{ width: 70 }}
                      value={getVal(c.categoryId, "sortOrder", c.sortOrder)}
                      onChange={(e) => handleChange(c.categoryId, "sortOrder", Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <select
                      className={`adminSelect${changes[c.categoryId]?.useYn !== undefined ? " dirty" : ""}`}
                      style={{ width: "100%" }}
                      value={getVal(c.categoryId, "useYn", c.useYn)}
                      onChange={(e) => handleChange(c.categoryId, "useYn", e.target.value)}
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
