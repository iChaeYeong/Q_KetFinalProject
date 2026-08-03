package com.exam.admin.controller;

import com.exam.auth.dto.UserDTO;
import com.exam.admin.dto.CategoryDTO;
import com.exam.common.exception.BusinessException;
import com.exam.common.exception.ErrorCode;
import com.exam.admin.service.CategoryService;
import com.exam.common.util.WebUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// 카테고리관리 — 공연 카테고리(콘서트/뮤지컬 등) 등록/수정/삭제. 관리자(3)만
@RestController
@RequestMapping("/admin/categories")
public class AdminCategoryController {

    private final CategoryService categoryService;

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private UserDTO getLoginUser(HttpSession session) {
        return (UserDTO) session.getAttribute("loginUser");
    }

    private boolean isAdmin(UserDTO user) {
        return user != null && Long.valueOf(3L).equals(user.getRoleId());
    }

    /***********************************
     * URL : "/admin/categories"
     * 이름 : 카테고리 목록 조회
     * 기능 : 등록된 공연 카테고리 전체 목록 조회 (관리 그리드, 사용여부 무관)
     * method : Get
     ************************************/
    @GetMapping
    public List<CategoryDTO> getCategories(HttpSession session) {
        if (!isAdmin(getLoginUser(session)))
            throw new BusinessException(ErrorCode.ADMIN_ONLY);
        return categoryService.getAllCategories();
    }

    /***********************************
     * URL : "/admin/categories"
     * 이름 : 카테고리 등록
     * 기능 : 관리자가 새 공연 카테고리를 등록 (카테고리명 중복 시 등록 제한)
     * method : Post
     ************************************/
    @PostMapping
    public Map<String, Object> createCategory(@RequestBody CategoryDTO body, HttpSession session,
            HttpServletRequest request) {
        UserDTO loginUser = getLoginUser(session);
        if (!isAdmin(loginUser))
            throw new BusinessException(ErrorCode.ADMIN_ONLY);
        body.setInsId(loginUser.getUserId());
        body.setInsIp(WebUtil.getClientIp(request));
        categoryService.createCategory(body);
        return Map.of("success", true);
    }
}
