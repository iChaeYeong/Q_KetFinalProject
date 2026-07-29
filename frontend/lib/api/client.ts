// ============================================================
// 이 프로젝트에서 프론트 ↔ 백엔드(Spring Boot)가 통신하는 방법
// ============================================================
//
// 1) 요청 흐름
//    React 컴포넌트 → apiFetch("/events") 호출
//    → 실제로는 fetch("/api/events") 를 보냄
//    → next.config.mjs 의 rewrites 설정이 "/api/*" 를 백엔드 주소로 그대로 전달
//      (로컬: http://localhost:8080/api/events)
//    → Spring Boot 는 application.yml 에 context-path: /api 로 되어 있어서
//      컨트롤러에 @RequestMapping("/events") 라고만 적어도 실제 주소는 /api/events 가 됨
//
// 2) 로그인 상태 유지 (세션 쿠키)
//    apiFetch 는 항상 credentials: "include" 로 요청을 보냄
//    → 로그인 성공(POST /api/auth/login) 시 브라우저가 세션 쿠키를 저장해두고,
//      그 뒤로 보내는 모든 apiFetch 요청에 그 쿠키가 자동으로 실려감
//    → 백엔드는 컨트롤러 메서드 파라미터에 HttpSession session 을 받아서
//      session.getAttribute("loginUser") 로 로그인한 유저를 꺼내 씀
//    → 즉 프론트에서 매번 토큰을 실어 보낼 필요 없음, 쿠키가 알아서 해줌
//
// 3) 백엔드 컨트롤러를 새로 만들 때 기본 형태 (예시)
//    @RestController
//    @RequestMapping("/example")          // 실제 주소는 /api/example
//    public class ExampleController {
//
//        @PostMapping                     // POST /api/example
//        public ResponseEntity<?> create(@RequestBody ExampleDTO dto, HttpSession session) {
//            // dto 필드 이름은 프론트에서 body 로 보낸 JSON의 key와 정확히 같아야 함
//            // (대소문자까지 일치. 예: { "userNm": "..." } ↔ dto.getUserNm())
//            ...
//            return ResponseEntity.ok(Map.of("success", true));
//        }
//    }
//    → 프론트 쪽 대응 코드는 apiFetch<ResultType>("/example", { method: "POST", body: dto })
//
// 4) 프론트가 백엔드 응답을 처리하는 규칙
//    - 백엔드가 200번대 응답을 주면 → apiFetch 가 자동으로 JSON 파싱해서 반환
//    - 백엔드가 4xx/5xx (ResponseEntity.status(403).body(...) 등)를 주면
//      → apiFetch 가 응답의 message 필드를 읽어서 자동으로 Error를 throw 함
//      → 호출부에서는 그냥 try { ... } catch (e) { setError(e.message) } 만 하면 됨
//      → 즉 백엔드에서 에러를 내려줄 때는 항상 { "success": false, "message": "실패 이유" } 형태로 줘야 함
// ============================================================

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
