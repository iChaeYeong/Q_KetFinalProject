package com.exam.admin.service;

import com.exam.admin.dto.CategoryDTO;
import com.exam.admin.mapper.CategoryMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<CategoryDTO> getActiveCategories() {
        return categoryMapper.findActive();
    }
}
