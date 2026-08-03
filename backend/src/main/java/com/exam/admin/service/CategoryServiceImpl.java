package com.exam.admin.service;

import com.exam.admin.dto.CategoryDTO;
import com.exam.admin.mapper.CategoryMapper;
import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
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

    @Override
    public List<CategoryDTO> getAllCategories() {
        return categoryMapper.findAll();
    }

    @Override
    public void createCategory(CategoryDTO categoryDTO) {
        if (categoryMapper.existsByName(categoryDTO.getCategoryNm()))
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "이미 존재하는 카테고리명입니다.");
        categoryMapper.save(categoryDTO);
    }

    @Override
    public void updateCategory(CategoryDTO categoryDTO) {
        if (categoryDTO.getCategoryNm() != null
                && categoryMapper.existsByNameExcludingId(categoryDTO.getCategoryNm(), categoryDTO.getCategoryId()))
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "이미 존재하는 카테고리명입니다.");
        categoryMapper.updateCategory(categoryDTO);
    }
}
