package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.CategoryDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CategoryService {
    CategoryDto getCategoryById(Long categoryId);
    List<CategoryDto> getAllCategories();
    CategoryDto createCategory(CategoryDto categoryDto);
    CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto);
    CategoryDto processImage(CategoryDto categoryDto, MultipartFile imageFile);
    void deleteCategory(Long categoryId);
}
