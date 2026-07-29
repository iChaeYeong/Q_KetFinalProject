package com.exam.common.mapper;

import com.exam.common.dto.UserDTO;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {
    UserDTO findById(String userId);
    int save(UserDTO userDTO);
    List<UserDTO> findAll();
    int updateUser(UserDTO userDTO);
    List<Map<String, Object>> findAllRoles();
}
