-- ============================================================
-- 3차 프로젝트 스키마 마이그레이션 — PER02(공연 상세/달력 조회) 범위
--
-- 기능 단위로 나눠서 개발하기로 해서, 이 파일에는 PER02_DETAIL01/02 에 필요한 것만 담는다.
-- 결제(PAYMENTS/REFUNDS), 좌석 선점(held_expires_at), 감상평(REVIEWS), 알림, 이메일 인증 등
-- 나머지 3차 테이블은 해당 기능을 개발할 때 추가한다. (설계 전문: project_design/Qket_3차_스키마설계_초안.md)
--
-- schema.sql 은 완전히 새 볼륨일 때만 실행되므로(docker-entrypoint-initdb.d),
-- 이미 데이터가 들어있는 로컬/개발 DB에는 이 파일로 증분 적용한다.
-- docker compose down -v 로 새로 만들 거면 이 파일은 필요 없음 (schema.sql 에 이미 반영돼 있음).
--
-- 실행 방법 — 반드시 --default-character-set=utf8mb4 를 붙일 것 (안 붙이면 한글이 깨짐):
--   docker exec -i qket-mysql mysql --default-character-set=utf8mb4 -uroot -p1234 qket < phase3_alter.sql
--
-- 이 파일은 docker-compose 에 마운트되지 않으므로 자동 실행되지 않음 (수동 실행 전용).
-- ============================================================

USE qket;

-- ── 1. CATEGORIES (PERFORMANCES.category_id 가 참조하므로 먼저 생성) ──
-- PER03_LIST02(카테고리별 공연 조회)용. PER02 자체에는 필수가 아니지만 PERFORMANCES 변경을 한 번에 끝내려고 같이 넣음
CREATE TABLE IF NOT EXISTS CATEGORIES (
    category_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_nm VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',

    ins_id VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    ins_ip VARCHAR(45) NULL,
    ins_de DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upt_id VARCHAR(50) NULL,
    upt_ip VARCHAR(45) NULL,
    upt_de DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_categories_nm (category_nm)
);

-- ── 2. PERFORMANCES 에 카테고리 FK 추가 ──
ALTER TABLE PERFORMANCES
    ADD COLUMN category_id BIGINT NULL COMMENT '공연 카테고리 — 기존 공연은 미분류(NULL)' AFTER venue_id;

ALTER TABLE PERFORMANCES
    ADD CONSTRAINT fk_performances_category FOREIGN KEY (category_id) REFERENCES CATEGORIES (category_id);

-- ── 3. PERFORMANCE_CAST (PER02_DETAIL01 공연 상세 - 캐스팅) ──
-- casting_nm: ERD 기준 컬럼명 (설계 초안의 role_name 에서 변경 — ROLES.role_name 과 헷갈리지 않게 하는 효과도 있음)
CREATE TABLE IF NOT EXISTS PERFORMANCE_CAST (
    cast_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    performance_id BIGINT NOT NULL,
    round_id BIGINT NULL COMMENT 'NULL이면 전체 회차 공통, 값이 있으면 해당 회차 전용',
    actor_name VARCHAR(100) NOT NULL COMMENT '배우 이름',
    casting_nm VARCHAR(100) NULL COMMENT '배역명',
    sort_order INT NOT NULL DEFAULT 0,

    ins_id VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    ins_ip VARCHAR(45) NULL,
    ins_de DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upt_id VARCHAR(50) NULL,
    upt_ip VARCHAR(45) NULL,
    upt_de DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (performance_id) REFERENCES PERFORMANCES (performance_id),
    FOREIGN KEY (round_id) REFERENCES PERFORMANCE_ROUND (round_id),
    KEY idx_cast_performance (performance_id, sort_order)
);

SHOW TABLES;
