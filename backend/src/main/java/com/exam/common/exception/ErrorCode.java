package com.exam.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
/*
* 400 잘못된 요청
* 401 로그인 필요
* 403 권한 없음
* 404 대상 없음
* 409 중복/충돌
* 500 서버 오류
*
*
*
*
* */
// 도메인별 에러 코드를 한곳에서 관리. 프론트는 message(사람이 읽는 문구)가 아니라
// code(A001 같은 고정 문자열)로 분기 처리할 수 있음 — message는 나중에 바뀌어도 code는 안 바뀌므로
@Getter
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "올바르지 않은 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C002", "서버 오류가 발생했습니다."),
    LOGIN_REQUIRED(HttpStatus.UNAUTHORIZED, "C003", "로그인이 필요합니다."),
    UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "파일 업로드에 실패했습니다."),

    // Auth (UserController)
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A001", "아이디 또는 비밀번호가 올바르지 않습니다."),
    SUSPENDED_ACCOUNT(HttpStatus.FORBIDDEN, "A002", "정지된 계정입니다. 고객센터에 문의하세요."),

    // Admin (AdminController)
    ADMIN_ONLY(HttpStatus.FORBIDDEN, "AD001", "관리자 권한이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AD002", "권한이 없습니다."),
    ROUND_ALREADY_OPEN(HttpStatus.BAD_REQUEST, "AD003", "예매 오픈된 회차입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
