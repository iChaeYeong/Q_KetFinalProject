package com.exam.common.controller;

import com.exam.common.dto.UserDTO;
import com.exam.common.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class UserController {

    UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
    /***********************************
     *  URL      :  "/auth/login"
     *  이름      :   로그인
     *  기능      :   로그인 시킨다
     *  method   :   POST
     *  param    :   UserDTO, HttpSession
     *  result   :   Map<String, Object>
     *  Return   : ResponseEntity<Map<String, Object>>
     ************************************/
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody UserDTO userDTO, HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        try {
            UserDTO user = userService.login(userDTO.getUserId(), userDTO.getPwd());
            if (user == null) {
                result.put("success", false);
                result.put("message", "아이디 또는 비밀번호가 올바르지 않습니다.");
                return ResponseEntity.status(401).body(result);
            }
            //spring session이 자동으로 user 세션정보 redis에 저장
            session.setAttribute("loginUser", user);
            result.put("success", true);
            result.put("user", user);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.status(403).body(result);
        }
    }

    /***********************************
     *  URL      :  "/auth/logout"
     *  이름      :   로그아웃
     *  기능      :   로그아웃 시킨다
     *  method   :   POST
     *  param    :   HttpSession
     *  result   :   Map<String, Object>
    ************************************/
    @PostMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        //redis의 세션 제거
        session.invalidate();
        return Map.of("success", true);
    }

    /***********************************
     *  URL      :  "/auth/signup"
     *  이름      :   회원가입
     *  기능      :   회원가입 시킨다
     *  method   :   POST
     *  param    :   UserDTO
     *  result   :   Map<String, Object> 완료 메세지
     ************************************/
    @PostMapping("/signup")
    public Map<String, Object> register(@RequestBody UserDTO userDTO) {
        Map<String, Object> result = new HashMap<>();
        try {
            int n = userService.register(userDTO);
            if (n > 0) {
                result.put("success", true);
                result.put("message", "회원가입이 완료되었습니다.");
            } else {
                result.put("success", false);
                result.put("message", "회원가입에 실패했습니다.");
            }
        } catch (Exception e) {
            result.put("success", false);
            //result.put("message", "이미 사용 중인 아이디 또는 이메일입니다.");
            result.put("message", e.getMessage());
        }
        return result;
    }

    /***********************************
     *  URL      :  "/auth/me"
     *  이름      :   세션(redis) 확인
     *  기능      :   redis의 캐시를 통해 사용자가 로그인 상태인지 확인한다
     *  method   :   GET
     *  param    :   HttpSession
     *  result   :   Map<String, Object> 완료 메세지
     ************************************/
    @GetMapping("/me")
    public Map<String, Object> me(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        UserDTO user = (UserDTO) session.getAttribute("loginUser");
        if (user == null) {
            result.put("success", false);
            result.put("message", "로그인이 필요합니다.");
        } else {
            result.put("success", true);
            result.put("user", user);
        }
        return result;
    }
}
