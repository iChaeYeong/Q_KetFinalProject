// 서버 컴포넌트에서 직접 백엔드 호출 시 사용
// 로컬: localhost:8080 / Docker(K8s): Dockerfile runner 스테이지에서 CLUSTER_IP 주입
export const BASE_URL = process.env.CLUSTER_IP ?? 'http://localhost:8080';

// apiFetch<T>(path, options) 사용법:
//   - body 에 객체 넣으면 자동 JSON.stringify
//   - 응답 자동 JSON 파싱 → T 타입으로 반환
//   - 4xx / 5xx 응답이면 백엔드 message 로 Error 자동 throw
//     → 페이지에서 catch(e) { setError(e.message) } 하면 끝
export async function apiFetch<T = unknown>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: object }
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // 백엔드가 { message: "..." } 로 에러를 내려주면 그 메시지 사용
    throw new Error(data?.message ?? `요청 실패 (${res.status})`);
  }

  return data as T;
}
