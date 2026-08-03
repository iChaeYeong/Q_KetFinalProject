package com.exam.auth.service;

import com.exam.auth.dto.UserDTO;
import jakarta.servlet.http.HttpServletRequest;

public interface UserService {
    UserDTO login(String userId, String pwd);
    int register(UserDTO userDTO);
    void requestPasswordResetCode(String userId, String userEmail);
    void resetPassword(String token, String newPwd, HttpServletRequest request);
}
