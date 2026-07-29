package com.exam.common.service;

import com.exam.common.dto.UserDTO;

public interface UserService {
    UserDTO login(String userId, String pwd);
    int register(UserDTO userDTO);
}
