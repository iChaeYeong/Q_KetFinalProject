package com.exam.common.dto;

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
}
