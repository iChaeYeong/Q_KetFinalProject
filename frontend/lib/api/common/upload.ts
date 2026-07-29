// ============================================================
// POST /api/admin/upload
// 백엔드: AdminController.java → uploadPoster()  (S3에 업로드하고 URL을 돌려줌, 매니저 이상)
// 기능: 이미지 파일 업로드 (포스터든 프로필 사진이든 공통으로 재사용 가능)
//
// ⚠️ 다른 API들과 다르게 apiFetch를 안 씀 — 이유: JSON이 아니라 파일(이미지)을 보내야 해서
//    Content-Type: multipart/form-data 로 FormData를 실어 보내야 함
//    (apiFetch는 항상 JSON.stringify + application/json 헤더로 보내기 때문에 못 씀)
//
// 사용 예시 (<input type="file"> 의 onChange 핸들러 안에서):
//   import { uploadImage } from "@/lib/api/common";
//
//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     try {
//       const url = await uploadImage(file);        // 업로드된 이미지의 URL(문자열)이 옴
//       setForm(f => ({ ...f, posterUrl: url }));    // 그대로 다른 API 호출 시 posterUrl로 사용
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };
//   <input type="file" accept="image/*" onChange={handleFileChange} />
//
// 요청: JSON이 아니라 multipart/form-data — key는 반드시 "file" (백엔드 @RequestParam("file")과 이름 일치)
// 응답 JSON:
//   성공: { "success": true, "url": "https://.../posters/xxxx.jpg" }
//   실패: { "success": false, "message": "..." }
// ============================================================
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message ?? "이미지 업로드에 실패했습니다.");
  }
  return data.url as string;
};
