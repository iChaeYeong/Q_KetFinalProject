USE qket;

CREATE TABLE IF NOT EXISTS ROLES (
    role_id BIGINT NOT NULL AUTO_INCREMENT,
    role_name VARCHAR(255),

    PRIMARY KEY (role_id),
    UNIQUE KEY uk_role_name (role_name)
);

CREATE TABLE IF NOT EXISTS VENUE (
    venue_id BIGINT NOT NULL AUTO_INCREMENT,
    venue_name VARCHAR(255) NOT NULL,

    PRIMARY KEY (venue_id),
    UNIQUE KEY uk_venue_name (venue_name)
);

CREATE TABLE IF NOT EXISTS PERFORMANCES (
    performance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    p_title VARCHAR(255) NOT NULL,
    venue_id BIGINT NOT NULL,
    poster_url VARCHAR(500),
    created_per DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (venue_id) REFERENCES VENUE (venue_id)
);

-- user_id: 회원가입 시 입력받는 로그인 아이디를 그대로 PK로 사용 (auto_increment 아님)
CREATE TABLE IF NOT EXISTS USERS (
    user_id VARCHAR(50) NOT NULL,
    user_nm VARCHAR(255) NOT NULL,
    pwd VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    user_status VARCHAR(255) NOT NULL,
    created_user DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    FOREIGN KEY (role_id) REFERENCES ROLES (role_id),
    UNIQUE KEY uk_users_user_email (user_email)
);

-- open_time: 예매 오픈 시각. round_time(공연 시작 시각)과 별개로 "언제부터 예매 가능한지"를 나타냄
-- 예매 로직: NOW() < open_time 이면 예매 시도를 거부 (오픈런 시점 제어)
CREATE TABLE IF NOT EXISTS PERFORMANCE_ROUND (
    round_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    performance_id BIGINT NOT NULL,
    round_time DATETIME NOT NULL COMMENT '공연(회차) 시작 시각',
    open_time DATETIME NOT NULL COMMENT '예매 오픈 시각 (이 시각 이전에는 예매 불가)',
    round_status VARCHAR(255) NOT NULL,
    FOREIGN KEY (performance_id) REFERENCES PERFORMANCES (performance_id)
);

-- SEATS: round_id, status 제거. 공연장(venue) 소속으로 변경 (회차 구분 없이 좌석 자체는 공연장에 귀속)
CREATE TABLE IF NOT EXISTS SEATS (
    seat_id BIGINT NOT NULL AUTO_INCREMENT,
    venue_id BIGINT NOT NULL,
    seat_row VARCHAR(255) NOT NULL,
    seat_colume VARCHAR(255) NOT NULL,
    grade VARCHAR(255) NOT NULL,

    PRIMARY KEY (seat_id),
    FOREIGN KEY (venue_id) REFERENCES VENUE (venue_id),
    UNIQUE KEY uk_seats_venue_seat (venue_id, seat_row, seat_colume)
);

-- RESERVATIONS: performance_id 추가 (좌석-회차 슬롯을 회차 등록 시점에 미리 생성, user_id는 예매 전까지 NULL)
-- 예매하기 버튼 클릭 시: 애플리케이션 단에서 먼저 PERFORMANCE_ROUND.open_time <= NOW() 인지 확인한 뒤
--   UPDATE RESERVATIONS SET user_id=?, reserved_status='RESERVED', reserved_at=NOW()
--   WHERE seat_id=? AND round_id=? AND user_id IS NULL  (조건부 UPDATE로 중복예매 방지)
CREATE TABLE IF NOT EXISTS RESERVATIONS (
    reservation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NULL,
    seat_id BIGINT NOT NULL,
    round_id BIGINT NOT NULL,
    performance_id BIGINT NOT NULL,
    reserved_status VARCHAR(255) NOT NULL DEFAULT 'AVAILABLE',
    created_reserved DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '슬롯이 생성된 시각 (회차 등록 시점)',
    reserved_at DATETIME NULL COMMENT '실제 예매(버튼 클릭) 시각, 예매 전까지 NULL',

    FOREIGN KEY (user_id) REFERENCES USERS (user_id),
    FOREIGN KEY (seat_id) REFERENCES SEATS (seat_id),
    FOREIGN KEY (round_id) REFERENCES PERFORMANCE_ROUND (round_id),
    FOREIGN KEY (performance_id) REFERENCES PERFORMANCES (performance_id),
    UNIQUE KEY uk_reservations_seat_round (seat_id, round_id)
);
-- Test용 (예매 이력 남기기)
CREATE TABLE IF NOT EXISTS RESERVATION_HISTORY (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    seat_id BIGINT NOT NULL,  
    round_id BIGINT NOT NULL,
    performance_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,  -- 'RESERVED' / 'CANCELLED'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (seat_id) REFERENCES SEATS(seat_id),
    FOREIGN KEY (round_id) REFERENCES PERFORMANCE_ROUND(round_id),
    FOREIGN KEY (performance_id) REFERENCES PERFORMANCES(performance_id)
);

SHOW TABLES;