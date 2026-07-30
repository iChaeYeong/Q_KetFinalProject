# Qket (공연 예매 시스템)

Spring Boot(백엔드) + Next.js/TypeScript(프론트엔드) 모노레포. `backend/`, `frontend/`, `docker-compose.yml`(MySQL 8 + Redis)로 구성.

## 백엔드 (`backend/`)

**레이어 구조**: `Controller → Service(interface) → ServiceImpl → Mapper(interface) → XML`
새 기능을 추가할 땐 이 4단 구조를 그대로 따른다. Controller가 Mapper를 직접 호출하지 않는다.

**패키지 구조** (`com.exam.*`) — 도메인별로 나뉘어 있고, 각 패키지 안에 `controller/dto/mapper/service/` 하위 폴더:
- `auth` — 로그인/세션/회원가입 (`UserController`, `UserDTO`)
- `admin` — 사용자·역할 관리(`AdminController`), 프로그램·메뉴 관리(`ProgramController`/`MenuController`, 관리자 전용 CRUD)
- `reservation` — 공연/좌석/예매(`PerformanceController`, `ReservationController`), 공연 관리(`AdminPerformanceController`, `/manage/*`)
- `common` — 도메인 무관 공통 기능: 예외 처리(`exception/`), 성공/에러 응답 어드바이스(`advice/`), 유틸(`WebUtil`), 파일 업로드(`CommonController`, `/common/upload`, 로그인만 하면 누구나 가능)
- `queue` — 예매 대기열

`ProgramService`/`MenuService`/관련 DTO·Mapper는 `common`이 아니라 **`admin` 패키지**에 있다 — 프로그램/메뉴 관리가 관리자 전용 기능이라서다. 단, `CommonController`의 `GET /common/menus/my`(로그인 사용자 메뉴 트리 조회)는 `admin.service.MenuService`를 가져다 쓴다 — 이건 관리자 전용이 아니라 전체 사용자가 쓰는 기능이라 common→admin 의존 방향이 살짝 어색하지만 의도적으로 그렇게 뒀다.

**API 응답 규격**:
- 새 컨트롤러는 그냥 데이터(List, DTO 등)를 `return`하면 됨 — `GlobalResponseAdvice`(`ResponseBodyAdvice`)가 자동으로 `{success, message, data, timestamp}`(`ApiResponse<T>`)로 감싼다.
- `Map`/`ApiResponse`/`ErrorResponse`/`String`을 직접 리턴하는 기존(레거시) 컨트롤러는 감싸지 않고, `timestamp` 필드만 주입해준다 (필드 순서: `success, timestamp, ...`).
- 실패는 `throw new BusinessException(ErrorCode.XXX)` (또는 커스텀 메시지 버전) — `ErrorCode` enum(`common.exception`)에 `(HttpStatus, code, message)` 정의. `GlobalExceptionHandler`(`RestControllerAdvice`)가 잡아서 `ErrorResponse{status, code, message, errors, timestamp}`로 응답. 성공(`ResponseBodyAdvice`)과 실패(`RestControllerAdvice`) 처리를 분리하는 게 이 프로젝트 관례.

**MyBatis**:
- XML 위치: `resources/com/exam/**/mapper/*.xml`, `namespace`는 Java Mapper 인터페이스의 FQN과 정확히 일치해야 함.
- `@Alias("XxxDTO")`가 붙은 DTO를 쓰는 패키지는 전부 `application.yml`의 `mybatis.type-aliases-package`에 등록돼 있어야 함 — DTO를 새 패키지로 옮기면 여기도 같이 고쳐야 한다.
- update 문에서 `<if test="field != null">` 가드는 "값을 명시적으로 null로 지우는" 게 정상 케이스인 필드(예: `parent_menu_id`, `program_id` 같은 nullable FK)에는 쓰면 안 됨 — 부분 요청(field 미포함)과 "null로 지우기"를 구분 못 해서, 의도치 않게 값이 사라짐. 이런 필드는 무조건 `SET field = #{field}`로 두고, **프론트가 항상 그 행의 전체 상태를 합쳐서 보내는 걸 전제**로 한다.

**인증/인가**:
- `HttpSession`(Redis-backed, Spring Session)에 `loginUser`(`UserDTO`) 저장. 각 컨트롤러가 `session.getAttribute("loginUser")`로 꺼내 씀.
- Role: `1=USER, 2=MANAGER, 3=ADMIN`. 각 컨트롤러에 `isAdmin()`/`isManagerOrAdmin()` 같은 헬퍼를 두고 하드코딩된 role 체크로 API 자체를 지킴 — 이건 프론트의 메뉴 표시 여부(PROGRAMS/ROLE_PROGRAMS 기반, 아래 참고)와는 **별개의 보안 계층**이라 서로 안 건드림.
- IP 추적: 데이터를 바꾸는 모든 컨트롤러가 `HttpServletRequest`를 받아서 `WebUtil.getClientIp(request)`로 **매 요청마다 라이브로** IP를 뽑아 `ins_ip`/`upt_ip`에 넣는다 (세션에 캐싱된 값 재사용 안 함 — 세션 도중 IP가 바뀌어도 정확하게 추적하기 위함).

## 프론트엔드 (`frontend/`)

**API 호출**: 모든 API는 `lib/api/client.ts`의 `apiFetch<T>(path, options)`를 통해 호출.
- 자동으로 `credentials:"include"`(세션 쿠키), JSON 직렬화/역직렬화.
- 백엔드가 `{success,data,timestamp}` 모양으로 감싸서 응답하면 `data`만 자동으로 꺼내줌(`unwrap()`) — 호출부는 신경 안 써도 됨.
- 실패 시 `ApiError`(code/status/errors 포함)를 throw.
- `apiFetch`를 안 거치고 서버 컴포넌트에서 직접 `fetch()`를 쓰는 곳(절대경로 URL 호출)이 있다면, 거기서도 `unwrap()`을 직접 불러다 써야 함 — 안 그러면 배열인 줄 알고 `.map()`했다가 터지는 버그가 남.

**폴더 구조**: 백엔드 패키지 경계를 그대로 미러링.
- `lib/api/<domain>/index.ts` — 도메인별 API 함수 (예: `lib/api/admin/`, `lib/api/manage/`(공연 관리, `/manage/*`), `lib/api/common/`(업로드, 메뉴 조회))
- `lib/data/types/<domain>.ts` — 도메인별 TypeScript 타입, `lib/data/types/index.ts`에서 전부 barrel export. 새 도메인 타입 추가 시 여기 등록.

**동적 메뉴/권한**: `PROGRAMS`/`ROLE_PROGRAMS`/`MENUS` 테이블 기반으로 `SiteNav.tsx`가 로그인 사용자 role에 맞는 메뉴 트리를 `GET /common/menus/my`로 받아와 렌더링 (하드코딩된 role 체크 아님). `MENUS.program_id`가 `NULL`이면 "그룹 전용" 메뉴(자기 자신은 클릭할 페이지 없이 하위메뉴만 호버로 노출, 예: 상단 "관리자" 드롭다운). **이건 화면(메뉴 노출/페이지 접근)에만 적용되는 시스템이고, 백엔드 API 자체의 권한 체크는 위에 적은 대로 각 컨트롤러가 별도로 하드코딩해서 지킨다.**

**관리자 그리드 페이지 패턴** (`app/admin/*/page.tsx`, 예: `users`, `programs`, `menus`):
- `changes: Record<id, Partial<Row>>` state로 dirty-tracking, "저장" 버튼으로 한 번에 배치 저장.
- 필드가 null이 될 수 있으면(예: `parentMenuId`) `getVal`을 `?? original`(nullish coalescing)이 아니라 **`field in changes[id]`로 판단**해야 함 — `??`는 "명시적으로 null로 바꿈"과 "안 바꿈(undefined)"을 구분 못 해서 화면에 반영이 안 되는 버그가 생긴다.
- 저장 시에도 마찬가지로, null 허용 필드가 있는 행은 변경된 필드만 보내지 말고 **그 행의 최종 상태 전체**를 합쳐서 보내야 한다 (안 그러면 위 MyBatis 항목에서 설명한 이유로 서버가 안 보낸 필드를 null로 덮어씀).

## DB (`backend/src/main/resources/schema.sql`, `data.sql`)

- 모든 테이블에 감사 컬럼 6개: `ins_id`(기본값 `'SYSTEM'`, 로그인 전 행위엔 이 값), `ins_ip`, `ins_de`, `upt_id`, `upt_ip`, `upt_de`(`ON UPDATE CURRENT_TIMESTAMP`). 새 테이블 추가 시 이 6개 컬럼을 그대로 포함시킨다.
- `spring.sql.init.mode: never` — Spring Boot는 이 파일들을 직접 실행하지 않음. `docker-entrypoint-initdb.d`를 통해 **완전히 새 볼륨일 때만** 자동 실행됨.
- 그래서 로컬 개발 중 스키마를 바꿀 땐 두 가지 방법 중 하나:
  1. `docker compose down -v && up -d` — 완전 재생성 (기존 데이터 다 날아감, 시드로 복구).
  2. 지금 떠 있는 컨테이너에 직접 `docker exec -i qket-mysql mysql --default-character-set=utf8mb4 -uroot -p1234 qket -e "..."`로 `ALTER`/`INSERT` — **반드시 `--default-character-set=utf8mb4`를 붙일 것**. 안 붙이면 클라이언트가 latin1로 붙어서 한글이 이중 인코딩으로 깨진 채 저장된다 (실제로 한 번 겪은 버그).
  - 어느 쪽이든 바꾼 내용은 `schema.sql`/`data.sql`에도 반드시 반영해서 파일과 라이브 DB가 어긋나지 않게 유지한다. `docker exec`로 DB에 직접 낸 변경사항을 파일에 옮기는 걸 잊기 쉬우니 주의.
