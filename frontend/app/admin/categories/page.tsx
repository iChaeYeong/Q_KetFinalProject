"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAdminCategories, createCategory, type Category } from "@/lib/api/admin";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { userSession, isLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [newCategoryNm, setNewCategoryNm] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => getAdminCategories().then(setCategories);

  useEffect(() => {
    if (isLoading) return;
    if (!userSession || userSession.roleId !== 3) { router.replace("/"); return; }
    load().finally(() => setLoading(false));
  }, [isLoading, userSession]);

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

  if (isLoading || loading)
    return <div className="pageWrap"><p className="loadingMsg">불러오는 중...</p></div>;

  return (
    <div className="pageWrap">
      <div className="adminPageHeader">
        <div>
          <h1 className="pageTitle">카테고리관리</h1>
          <p className="pageSubtitle">공연 카테고리를 등록합니다.</p>
        </div>
        <div className="adminHeaderActions">
          {msg && <span className={msg.includes("실패") ? "errorMsg" : "successMsg"} style={{ margin: 0 }}>{msg}</span>}
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
            {categories.map((c) => (
              <tr key={c.categoryId}>
                <td>{c.categoryNm}</td>
                <td>{c.sortOrder}</td>
                <td>{c.useYn === "Y" ? "사용" : "미사용"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
