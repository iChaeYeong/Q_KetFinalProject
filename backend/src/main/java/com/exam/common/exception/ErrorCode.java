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
    DUPLICATE_USER_NM(HttpStatus.CONFLICT, "A004", "이미 동일한 이름으로 가입된 계정이 있습니다."),

    // Auth - 소셜 로그인 (OAuthController)
    EMAIL_ALREADY_REGISTERED(HttpStatus.CONFLICT, "A003", "이미 해당 이메일로 가입된 계정이 있습니다. 아이디/비밀번호로 로그인해 주세요."),
    OAUTH_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "A005", "소셜 로그인 처리 중 오류가 발생했습니다."),
    INVALID_OAUTH_STATE(HttpStatus.BAD_REQUEST, "A006", "잘못된 요청입니다. 다시 시도해 주세요."),

    // Auth - 비밀번호 찾기 (UserController)
    PASSWORD_RESET_TARGET_NOT_FOUND(HttpStatus.BAD_REQUEST, "A007", "아이디 또는 이메일이 일치하지 않습니다."),
    SOCIAL_ACCOUNT_NO_PASSWORD(HttpStatus.BAD_REQUEST, "A008", "소셜 로그인 계정입니다. 소셜 로그인으로 이용해 주세요."),
    INVALID_RESET_TOKEN(HttpStatus.BAD_REQUEST, "A009", "유효하지 않거나 만료된 링크입니다. 다시 요청해 주세요."),

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
