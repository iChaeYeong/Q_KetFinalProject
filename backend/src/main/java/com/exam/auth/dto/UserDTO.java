package com.exam.auth.dto;

import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.io.Serializable;

@Data
@Alias("UserDTO")
public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String userId;
    private String pwd;
    private String userNm;
    private String userEmail;
    private String userStatus;
    private Long roleId;
    private String roleName;

    // 감사(audit) 컬럼 — 등록자/수정자 ID·IP
    private String insId;
    private String insIp;
    private String uptId;
    private String uptIp;
}
