package com.exam.auth.service;

import com.exam.auth.dto.UserDTO;
import com.exam.auth.mapper.UserMapper;
import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.common.util.WebUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

/***********************************
 *  파일명     :   UserServiceImpl.java
 *  기능       :   userId와 같은 데이터가 있는지 조회
 *  param    :   String, String
 *  result   :   UserDTO  (유저정보)
 ************************************/


@Service
public class UserServiceImpl implements UserService {

    // 비밀번호 재설정 링크의 토큰을 Redis에 저장할 때 쓰는 키 prefix(값은 userId), 유효시간
    private static final String RESET_TOKEN_KEY_PREFIX = "pwdResetToken:";
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(15);

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final RedisTemplate<String, Object> redisTemplate;

    // 소셜 로그인 완료 후 리다이렉트할 프론트엔드 origin — 비밀번호 재설정 링크를 만들 때도 재사용
    @Value("${app.base-url}")
    private String baseUrl;

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder,
                            JavaMailSender mailSender, RedisTemplate<String, Object> redisTemplate) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.redisTemplate = redisTemplate;
    }

    /***********************************
     *  이름      :   login
     *  기능      :   userId와 같은 데이터가 있는지 조회
     *  param    :   String, String
     *  result   :   UserDTO  (유저정보)
     ************************************/
    @Override
    public UserDTO login(String userId, String pwd) {
        UserDTO user = userMapper.findById(userId);
        if (user == null) return null;
        if (!passwordEncoder.matches(pwd, user.getPwd())) return null;
        if ("SUSPENDED".equals(user.getUserStatus())) {
            throw new IllegalStateException("정지된 계정입니다. 고객센터에 문의하세요.");
        }
        user.setPwd(null);
        return user;
    }

    /***********************************
     *  이름      :   register
     *  기능      :   유저정보 DB에 저장 후 처리한 행 갯수 반환
     *  param    :   UserDTO
     *  result   :   int
     ************************************/
    @Override
    @Transactional
    public int register(UserDTO userDTO) {
        // user_email은 DB에 UNIQUE 제약이 있지만, 그 위반을 그냥 두면 컨트롤러가 잡아서
        // 200 OK + success:false 로 응답해버려 프론트가 실패를 못 알아챔 → 미리 체크해서 명확히 던짐
        if (userMapper.findByEmail(userDTO.getUserEmail()) != null) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_REGISTERED);
        }
        // 동일명의 계정생성 방지: user_nm엔 DB 유니크 제약이 없어서 서비스 단에서 직접 체크
        // (COUNT로 체크 — 소셜 로그인 자동가입은 이 체크 대상이 아니라 이미 같은 이름이 여러 개 있을 수 있음)
        if (userMapper.countByUserNm(userDTO.getUserNm()) > 0) {
            throw new BusinessException(ErrorCode.DUPLICATE_USER_NM);
        }
        userDTO.setPwd(passwordEncoder.encode(userDTO.getPwd())); //암호화
        return userMapper.save(userDTO); // INSERT, DELETE ,UPDATE 의 결과를 저장 시 처리한 행 갯수를 가져옴
    }

    /***********************************
     *  이름      :   requestPasswordResetCode
     *  기능      :   아이디+이메일이 일치하는 LOCAL 계정에 비밀번호 재설정 링크를 발급해 이메일로 발송
     *  param    :   String, String
     *  result   :   void
     ************************************/
    @Override
    public void requestPasswordResetCode(String userId, String userEmail) {
        UserDTO user = userMapper.findById(userId);
        if (user == null || !user.getUserEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TARGET_NOT_FOUND);
        }
        if (user.getPwd() == null) {
            throw new BusinessException(ErrorCode.SOCIAL_ACCOUNT_NO_PASSWORD);
        }

        // 추측 불가능한 랜덤 토큰 — 값은 userId, 토큰 자체가 Redis 키(있으면 유효, 없으면 만료/이미 사용됨)
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        redisTemplate.opsForValue().set(RESET_TOKEN_KEY_PREFIX + token, userId, RESET_TOKEN_TTL);

        String link = baseUrl + "/find-password/confirm?token=" + token;
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(userEmail);
        mail.setSubject("[Q-Ket] 비밀번호 재설정 링크");
        mail.setText("아래 링크를 눌러 비밀번호를 재설정해 주세요. 15분 이내에 클릭해야 합니다.\n" + link);
        mailSender.send(mail);
    }

    /***********************************
     *  이름      :   resetPassword
     *  기능      :   재설정 링크의 토큰 확인 후 새 비밀번호로 변경 (1회용 토큰, 사용 후 즉시 삭제)
     *  param    :   String, String, HttpServletRequest
     *  result   :   void
     ************************************/
    @Override
    @Transactional
    public void resetPassword(String token, String newPwd, HttpServletRequest request) {
        Object userId = redisTemplate.opsForValue().get(RESET_TOKEN_KEY_PREFIX + token);
        if (userId == null) {
            throw new BusinessException(ErrorCode.INVALID_RESET_TOKEN);
        }
        redisTemplate.delete(RESET_TOKEN_KEY_PREFIX + token);

        userMapper.updatePwd(userId.toString(), passwordEncoder.encode(newPwd), userId.toString(), WebUtil.getClientIp(request));
    }
}
