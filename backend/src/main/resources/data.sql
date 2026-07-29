USE qket;
SET NAMES utf8mb4;

-- [주의] 기존 데이터 초기화 - 재실행 시에만 주석 해제하여 사용
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE RESERVATIONS;
-- TRUNCATE TABLE SEATS;
-- TRUNCATE TABLE PERFORMANCE_ROUND;
-- TRUNCATE TABLE PERFORMANCES;
-- TRUNCATE TABLE VENUE;
-- TRUNCATE TABLE USERS;
-- TRUNCATE TABLE ROLES;
-- SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- Qket 테스트 데이터
-- 공연장 6개 / 공연 10개 / 좌석 500~2000석
-- =========================

-- ============================================================
-- [테스트 케이스] 모든 계정 비밀번호: test1234
-- ============================================================
--
-- [TC-01] 로그인 성공
--   ID: testuser01 / PW: test1234
--   기대결과: 로그인 성공, 홈 화면 이동
--
-- [TC-02] 잘못된 비밀번호
--   ID: testuser01 / PW: wrong1234
--   기대결과: 로그인 실패 메시지 출력
--
-- [TC-03] 정지된 계정 로그인 시도
--   ID: testuser06 / PW: test1234  (status: SUSPENDED)
--   기대결과: 계정 정지 안내 메시지 출력, 로그인 불가
--
-- [TC-04] 마이페이지 - 예매내역 다건 조회
--   ID: testuser01 로그인 → 마이페이지
--   기대결과: 3건 예매내역 조회
--     · 아이유 콘서트 - The Golden Hour  1회차 (2026-08-15)  A-1  VIP
--     · 임영웅 - 영웅시대               1회차 (2026-10-01)  B-5  R
--     · 뮤지컬 레미제라블               1회차 (2026-08-20)  C-10 R
--
-- [TC-05] 마이페이지 - 예매내역 없는 유저
--   ID: testuser05 로그인 → 마이페이지
--   기대결과: 예매내역 없음 표시
--
-- [TC-06] 좌석 선택 화면 - 이미 예매된 좌석 비활성화 확인
--   아이유 콘서트 1회차(round_id=1) 좌석 선택 화면 진입
--   기대결과: A-1(testuser01 예매), A-2(testuser02 예매) 선택 불가로 표시
--
-- [TC-07] 동일 공연 다른 회차 중복 예매
--   ID: testuser02 로그인 → 마이페이지
--   기대결과: 2건 예매내역 조회
--     · 아이유 콘서트 1회차 (2026-08-15) A-2 VIP
--     · 아이유 콘서트 2회차 (2026-08-16) A-1 VIP  ← 같은 공연 다른 회차
--
-- [TC-08] 여러 공연장 예매 조회
--   ID: testuser04 로그인 → 마이페이지
--   기대결과: 2건 예매내역 조회 (공연장이 서로 다름)
--     · BTS World Tour 1회차 (2026-09-01)  KSPO DOME        A-2 VIP
--     · 세븐틴 - Be The Sun 1회차 (2026-09-05) KSPO DOME    D-20 R
--
-- [TC-09] 예매 취소 후 이력 조회
--   ID: testuser03 로그인 → 마이페이지
--   기대결과: BTS 1회차 A-1 VIP → 최종 상태 CANCELLED로 표시
--             (RESERVATION_HISTORY에 RESERVED→CANCELLED 이력 2건,
--              RESERVATIONS.user_id는 NULL)
--
-- [TC-10] 관리자 계정 로그인
--   ID: admin01 / PW: test1234  (role: ADMIN)
--   기대결과: 관리자 권한으로 로그인
--
-- [TC-11] 매니저 계정 로그인
--   ID: manager01 / PW: test1234  (role: MANAGER)
--   기대결과: 매니저 권한으로 로그인
-- ============================================================

-- ROLES
INSERT INTO ROLES (role_name) VALUES
  ('USER'),
  ('MANAGER'),
  ('ADMIN');

-- VENUE (공연장 6개)
INSERT INTO VENUE (venue_name) VALUES
  ('서울 올림픽공원 체조경기장'),
  ('KSPO DOME'),
  ('잠실실내체육관'),
  ('고척스카이돔'),
  ('블루스퀘어 마스터카드홀'),
  ('인천 파라다이스시티 아레나');

-- PERFORMANCES (공연 10개)
INSERT INTO PERFORMANCES (p_title, venue_id, poster_url) VALUES
  ('아이유 콘서트 - The Golden Hour',     1, 'https://example.com/poster/iu.jpg'),
  ('BTS World Tour - Yet To Come',       2, 'https://example.com/poster/bts.jpg'),
  ('BLACKPINK - Born Pink',              4, 'https://example.com/poster/blackpink.jpg'),
  ('임영웅 - 영웅시대',                   1, 'https://example.com/poster/lim.jpg'),
  ('뮤지컬 레미제라블',                   5, 'https://example.com/poster/miserable.jpg'),
  ('세븐틴 - Be The Sun',                2, 'https://example.com/poster/seventeen.jpg'),
  ('NewJeans 팬미팅 - Bunnies Camp',     3, 'https://example.com/poster/newjeans.jpg'),
  ('나훈아 - 테스형!',                    4, 'https://example.com/poster/na.jpg'),
  ('뮤지컬 오페라의 유령',                5, 'https://example.com/poster/phantom.jpg'),
  ('태연 - My Voice Concert',            6, 'https://example.com/poster/taeyeon.jpg');

-- USERS (password: test1234)
INSERT INTO USERS (user_id, user_nm, pwd, user_email, role_id, user_status) VALUES
  ('admin01',    '관리자01',    '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'admin01@qket.com',    3, 'ACTIVE'),
  ('manager01',  '매니저01',   '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'manager01@qket.com',  2, 'ACTIVE'),
  ('testuser01', '테스트유저01', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser01@qket.com', 1, 'ACTIVE'),
  ('testuser02', '테스트유저02', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser02@qket.com', 1, 'ACTIVE'),
  ('testuser03', '테스트유저03', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser03@qket.com', 1, 'ACTIVE'),
  ('testuser04', '테스트유저04', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser04@qket.com', 1, 'ACTIVE'),
  ('testuser05', '테스트유저05', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser05@qket.com', 1, 'ACTIVE'),
  ('testuser06', '테스트유저06', '$2b$10$hWBKmcDTCeEpTSo69AszSOq83qcpV.y7HJwWtweymXyxLmL7kD4Am', 'testuser06@qket.com', 1, 'SUSPENDED');

-- PERFORMANCE_ROUND
-- [로컬 테스트 편의] open_time을 전부 과거로 당겨서 로컬에서 바로 "예매하기"가 눌리도록 함
-- (round_time = 실제 공연 일시는 원래 값 그대로 유지 — 화면/데이터상 의미는 안 바뀜)
INSERT INTO PERFORMANCE_ROUND (performance_id, round_time, open_time, round_status) VALUES
  -- 아이유 (venue=1)
  (1, '2026-08-15 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (1, '2026-08-16 17:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- BTS (venue=2)
  (2, '2026-09-01 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (2, '2026-09-02 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- BLACKPINK (venue=4)
  (3, '2026-09-15 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (3, '2026-09-16 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 임영웅 (venue=1)
  (4, '2026-10-01 18:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (4, '2026-10-02 18:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (4, '2026-10-03 15:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 뮤지컬 레미제라블 (venue=5)
  (5, '2026-08-20 19:30:00', '2025-01-01 10:00:00', 'OPEN'),
  (5, '2026-08-21 19:30:00', '2025-01-01 10:00:00', 'OPEN'),
  (5, '2026-08-22 14:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 세븐틴 (venue=2)
  (6, '2026-09-05 18:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (6, '2026-09-06 15:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- NewJeans (venue=3)
  (7, '2026-08-30 17:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (7, '2026-08-31 17:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 나훈아 (venue=4)
  (8, '2026-10-10 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (8, '2026-10-11 17:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 뮤지컬 오페라의 유령 (venue=5)
  (9, '2026-09-10 19:30:00', '2025-01-01 10:00:00', 'OPEN'),
  (9, '2026-09-11 19:30:00', '2025-01-01 10:00:00', 'OPEN'),
  (9, '2026-09-12 14:00:00', '2025-01-01 10:00:00', 'OPEN'),
  -- 태연 (venue=6)
  (10, '2026-11-01 19:00:00', '2025-01-01 10:00:00', 'OPEN'),
  (10, '2026-11-02 17:00:00', '2025-01-01 10:00:00', 'OPEN');

-- =========================
-- SEATS
-- 숫자 생성: a(1-10) x b(0,10,20,...) CROSS JOIN 으로 1-N 시퀀스 생성
-- 행(row): CHAR(64+n) → A,B,C,...
-- 등급: 1-3행 VIP / 4-10행 R / 나머지 S
-- =========================

-- venue 1: 서울 올림픽공원 체조경기장 (A-T행=20행, 1-50열=50열 → 1000석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 1, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 3 THEN 'VIP' WHEN r.n <= 10 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
      UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40) b
   WHERE a.n + b.n <= 50) c;

-- venue 2: KSPO DOME (A-T행=20행, 1-60열=60열 → 1200석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 2, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 3 THEN 'VIP' WHEN r.n <= 10 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
      UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40 UNION ALL SELECT 50) b
   WHERE a.n + b.n <= 60) c;

-- venue 3: 잠실실내체육관 (A-P행=16행, 1-50열=50열 → 800석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 3, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 2 THEN 'VIP' WHEN r.n <= 8 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
      UNION ALL SELECT 16) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40) b
   WHERE a.n + b.n <= 50) c;

-- venue 4: 고척스카이돔 (A-Y행=25행, 1-80열=80열 → 2000석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 4, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 3 THEN 'VIP' WHEN r.n <= 12 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
      UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
      UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40
               UNION ALL SELECT 50 UNION ALL SELECT 60 UNION ALL SELECT 70) b
   WHERE a.n + b.n <= 80) c;

-- venue 5: 블루스퀘어 마스터카드홀 (A-J행=10행, 1-50열=50열 → 500석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 5, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 2 THEN 'VIP' WHEN r.n <= 6 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40) b
   WHERE a.n + b.n <= 50) c;

-- venue 6: 인천 파라다이스시티 아레나 (A-O행=15행, 1-60열=60열 → 900석)
INSERT INTO SEATS (venue_id, seat_row, seat_colume, grade)
SELECT 6, CHAR(64 + r.n), c.n,
  CASE WHEN r.n <= 2 THEN 'VIP' WHEN r.n <= 8 THEN 'R' ELSE 'S' END
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
      UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15) r
CROSS JOIN
  (SELECT a.n + b.n AS n
   FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
         UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) a
   CROSS JOIN (SELECT 0 n UNION ALL SELECT 10 UNION ALL SELECT 20 UNION ALL SELECT 30 UNION ALL SELECT 40 UNION ALL SELECT 50) b
   WHERE a.n + b.n <= 60) c;

-- =========================
-- RESERVATIONS
-- 각 공연의 venue_id와 같은 venue의 좌석 x 해당 공연 회차 조합
-- =========================
INSERT INTO RESERVATIONS (user_id, seat_id, round_id, performance_id, reserved_status)
SELECT NULL, s.seat_id, r.round_id, r.performance_id, 'AVAILABLE'
FROM SEATS s
CROSS JOIN PERFORMANCE_ROUND r
INNER JOIN PERFORMANCES p ON r.performance_id = p.performance_id
WHERE p.venue_id = s.venue_id;

-- ============================================================
-- 데모용 예매 데이터
-- ============================================================

-- [TC-04 / TC-06] testuser01: 아이유 1회차 A-1 VIP
UPDATE RESERVATIONS SET user_id = 'testuser01', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 1 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='1')
  AND user_id IS NULL;

-- [TC-04] testuser01: 임영웅 1회차 B-5 R
UPDATE RESERVATIONS SET user_id = 'testuser01', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 7 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='B' AND seat_colume='5')
  AND user_id IS NULL;

-- [TC-04] testuser01: 뮤지컬 레미제라블 1회차 C-10 R
UPDATE RESERVATIONS SET user_id = 'testuser01', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 10 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=5 AND seat_row='C' AND seat_colume='10')
  AND user_id IS NULL;

-- [TC-06 / TC-07] testuser02: 아이유 1회차 A-2 VIP
UPDATE RESERVATIONS SET user_id = 'testuser02', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 1 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='2')
  AND user_id IS NULL;

-- [TC-07] testuser02: 아이유 2회차 A-1 VIP (동일 공연 다른 회차)
UPDATE RESERVATIONS SET user_id = 'testuser02', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 2 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='1')
  AND user_id IS NULL;

-- [TC-09] testuser03: BTS 1회차 A-1 → 예매 후 취소 (RESERVATIONS는 NULL 유지)

-- [TC-08] testuser04: BTS 1회차 A-2 VIP
UPDATE RESERVATIONS SET user_id = 'testuser04', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 3 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='A' AND seat_colume='2')
  AND user_id IS NULL;

-- [TC-08] testuser04: 세븐틴 1회차 D-20 R (다른 공연장, 같은 venue_id=2)
UPDATE RESERVATIONS SET user_id = 'testuser04', reserved_status = 'RESERVED', reserved_at = NOW()
WHERE round_id = 13 AND seat_id = (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='D' AND seat_colume='20')
  AND user_id IS NULL;

-- [TC-05] testuser05: 예매내역 없음 (UPDATE 없음)

-- ============================================================
-- RESERVATION_HISTORY (마이페이지 조회 기준 테이블)
-- RESERVATIONS UPDATE와 반드시 쌍으로 관리
-- action='RESERVED' → RESERVATIONS.user_id 있음
-- action='CANCELLED' → RESERVATIONS.user_id=NULL
-- ============================================================

-- [TC-04] testuser01: 아이유 1회차 A-1 VIP
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser01', (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='1'),
       1, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 1;

-- [TC-04] testuser01: 임영웅 1회차 B-5 R
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser01', (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='B' AND seat_colume='5'),
       7, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 7;

-- [TC-04] testuser01: 뮤지컬 레미제라블 1회차 C-10 R
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser01', (SELECT seat_id FROM SEATS WHERE venue_id=5 AND seat_row='C' AND seat_colume='10'),
       10, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 10;

-- [TC-07] testuser02: 아이유 1회차 A-2 VIP
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser02', (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='2'),
       1, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 1;

-- [TC-07] testuser02: 아이유 2회차 A-1 VIP
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser02', (SELECT seat_id FROM SEATS WHERE venue_id=1 AND seat_row='A' AND seat_colume='1'),
       2, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 2;

-- [TC-09] testuser03: BTS 1회차 A-1 → RESERVED 후 CANCELLED (RESERVATIONS는 NULL)
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser03', (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='A' AND seat_colume='1'),
       3, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 3;

INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser03', (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='A' AND seat_colume='1'),
       3, performance_id, 'CANCELLED' FROM PERFORMANCE_ROUND WHERE round_id = 3;

-- [TC-08] testuser04: BTS 1회차 A-2 VIP
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser04', (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='A' AND seat_colume='2'),
       3, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 3;

-- [TC-08] testuser04: 세븐틴 1회차 D-20 R
INSERT INTO RESERVATION_HISTORY (user_id, seat_id, round_id, performance_id, action)
SELECT 'testuser04', (SELECT seat_id FROM SEATS WHERE venue_id=2 AND seat_row='D' AND seat_colume='20'),
       13, performance_id, 'RESERVED' FROM PERFORMANCE_ROUND WHERE round_id = 13;
