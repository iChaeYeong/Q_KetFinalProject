import { apiFetch } from "./client";
import type { LoginResult, ApiResult, UserDTO } from "../data/types";

// POST /api/auth/login
// 실패 시 apiFetch 가 자동으로 Error throw → catch(e) { setError(e.message) }
export async function login(userId: string, pwd: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { userId, pwd },
  });
}

// POST /api/auth/logout
export async function logout(): Promise<ApiResult> {
  return apiFetch<ApiResult>("/auth/logout", { method: "POST" });
}

// POST /api/auth/register
// 실패 시 apiFetch 가 자동으로 Error throw → catch(e) { setError(e.message) }
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

// GET /api/auth/me — 로그인 상태면 유저 정보 반환, 아니면 null
export async function getMe(): Promise<UserDTO | null> {
  try {
    const data = await apiFetch<{ success: boolean; user: UserDTO }>("/auth/me");
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}