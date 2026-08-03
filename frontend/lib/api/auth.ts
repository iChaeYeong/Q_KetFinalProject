import { apiFetch } from "./client";
import type { LoginResult, ApiResult, UserDTO } from "../data/types";

// ============================================================
// POST /api/auth/login
// 백엔드: UserController.java → login()
// 기능: 로그인 — 성공하면 서버가 세션 쿠키를 내려줌 (credentials: "include" 로 브라우저가 자동 저장)
//
// 사용 예시:
//   import { login } from "@/lib/api/auth";
//
//   const handleLogin = async () => {
//     try {
//       const result = await login(userId, pwd);
//       setUserSession(result.user ?? null);   // useAuth() 의 setUserSession
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "userId": "test01", "pwd": "1234" }
//
// 응답 JSON (백엔드 → 프론트, 성공 시):
//   { "success": true, "user": { "userId": "test01", "userNm": "홍길동", "roleId": 1 } }
// 실패 시 (401) apiFetch 가 자동으로 Error를 던짐 → catch(e) { setError(e.message) }
// ============================================================
export async function login(userId: string, pwd: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { userId, pwd },
  });
}

// ============================================================
// POST /api/auth/logout
// 백엔드: UserController.java → logout()
// 기능: 로그아웃 — 서버 세션 제거
//
// 사용 예시:
//   await logout();
//   setUserSession(null);   // useAuth() 의 setUserSession — 이걸 꼭 같이 해줘야 화면도 로그아웃 상태로 바뀜
//
// 요청: body 없음
// 응답 JSON: { "success": true }
// ============================================================
export async function logout(): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/logout", { method: "POST" });
}

// ============================================================
// POST /api/auth/signup
// 백엔드: UserController.java → register()
// 기능: 회원가입
//
// 사용 예시:
//   try {
//     await signup(userId, userNm, userEmail, pwd);
//     router.push("/login");
//   } catch (e: any) {
//     setError(e.message);
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "userId": "test01", "userNm": "홍길동", "userEmail": "a@a.com", "pwd": "1234" }
//
// 응답 JSON:
//   성공: { "success": true, "message": "회원가입이 완료되었습니다." }
//   실패: { "success": false, "message": "..." } → apiFetch 가 Error 로 throw
// ============================================================
export async function signup(
  userId: string,
  userNm: string,
  userEmail: string,
  pwd: string
): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/signup", {
    method: "POST",
    body: { userId, userNm, userEmail, pwd },
  });
}

// ============================================================
// GET /api/auth/me
// 백엔드: UserController.java → me()  (세션에 저장된 로그인 유저 정보를 그대로 돌려줌)
// 기능: 현재 세션이 로그인 상태인지 확인 + 로그인 상태면 유저 정보 반환
//
// 응답 JSON:
//   로그인 상태: { "success": true, "user": { "userId": "...", "userNm": "...", "roleId": 1 } }
//   비로그인:   { "success": false, "message": "로그인이 필요합니다." }
//   (참고: 백엔드가 이 경우도 200 OK 로 내려주기 때문에 아래 코드는 success 값만 보고 분기함)
//
// 주의: 이 함수는 AuthContext.tsx 안에서만 호출됨 — 다른 화면에서 로그인 유저 정보가 필요하면
//       여기서 또 부르지 말고 useAuth() 훅으로 Context에 저장된 값을 가져다 쓸 것
//       (여기서 또 부르면 Context가 들고 있는 세션값이랑 따로 노는 이중 상태가 생김)
//   예시: const { userSession, isLoading } = useAuth();
// ============================================================
export async function getMe(): Promise<UserDTO | null> {
  try {
    const data = await apiFetch<{ success: boolean; user: UserDTO }>("/auth/me");
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

// ============================================================
// POST /api/auth/password/code
// 백엔드: UserController.java → requestPasswordResetCode()
// 기능: 비밀번호 찾기 1단계 — 아이디+이메일이 일치하는 계정에 비밀번호 재설정 링크를 이메일로 발송
//
// 사용 예시:
//   import { requestPasswordResetCode } from "@/lib/api/auth";
//
//   try {
//     await requestPasswordResetCode(userId, userEmail);
//     setStep("sent"); // "이메일을 확인하세요" 안내 화면으로 전환
//   } catch (e: any) {
//     setError(e.message);
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "userId": "test01", "userEmail": "a@a.com" }
//
// 응답 JSON:
//   성공: { "success": true, "message": "비밀번호 재설정 링크를 이메일로 전송했습니다." }
//   실패: apiFetch 가 Error 로 throw (아이디/이메일 불일치, 소셜 로그인 전용 계정 등)
// ============================================================
export async function requestPasswordResetCode(
  userId: string,
  userEmail: string
): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/password/code", {
    method: "POST",
    body: { userId, userEmail },
  });
}

// ============================================================
// POST /api/auth/password/reset
// 백엔드: UserController.java → resetPassword()
// 기능: 비밀번호 찾기 2단계 — 이메일로 받은 링크의 토큰(?token=...) 확인 후 새 비밀번호로 변경
//       (1회용 토큰, 15분 만료). 이 링크로 열리는 페이지는 app/(auth)/find-password/confirm/page.tsx
//
// 사용 예시:
//   import { resetPassword } from "@/lib/api/auth";
//
//   const token = searchParams.get("token")!;
//   try {
//     await resetPassword(token, newPwd);
//     setStep("done");
//   } catch (e: any) {
//     setError(e.message);
//   }
//
// 요청 JSON (프론트 → 백엔드, body):
//   { "token": "xYz...(랜덤 토큰)", "newPwd": "새비밀번호" }
//
// 응답 JSON:
//   성공: { "success": true, "message": "비밀번호가 재설정되었습니다." }
//   실패: apiFetch 가 Error 로 throw (토큰 무효/만료 등)
// ============================================================
export async function resetPassword(token: string, newPwd: string): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/password/reset", {
    method: "POST",
    body: { token, newPwd },
  });
}
