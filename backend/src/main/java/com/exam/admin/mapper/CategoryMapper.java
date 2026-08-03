package com.exam.admin.mapper;

import com.exam.admin.dto.CategoryDTO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CategoryMapper {
    List<CategoryDTO> findActive();
}
