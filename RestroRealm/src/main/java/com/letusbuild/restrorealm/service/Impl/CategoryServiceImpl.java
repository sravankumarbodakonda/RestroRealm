package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.CategoryDto;
import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.repository.CategoryRepository;
import com.letusbuild.restrorealm.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final ModelMapper modelMapper;

    @Override
    public CategoryDto getCategoryById(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(()-> new RuntimeException("Category id - "+categoryId+" not found"));
        return modelMapper.map(category, CategoryDto.class);
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(category -> modelMapper.map(category,CategoryDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDto createCategory(CategoryDto categoryDto) {
        Category category = modelMapper.map(categoryDto, Category.class);
        category.setImagePath(categoryDto.getImagePath());
        Category savedCategory = categoryRepository.save(category);
        return modelMapper.map(savedCategory, CategoryDto.class);
    }

    @Override
    public CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto) {
        Category existingCategory = modelMapper.map(getCategoryById(categoryId), Category.class);
        existingCategory.setName(categoryDto.getName());
        existingCategory.setDescription(categoryDto.getDescription());
        existingCategory.setAgeRestricted(categoryDto.isAgeRestricted());
        existingCategory.setAvailableStartTime(categoryDto.getAvailableStartTime());
        existingCategory.setAvailableEndTime(categoryDto.getAvailableEndTime());
        if (categoryDto.getImagePath() != null) {
            existingCategory.setImagePath(categoryDto.getImagePath());
        }
        Category updatedCategory = categoryRepository.save(existingCategory);
        return modelMapper.map(updatedCategory, CategoryDto.class);
    }
}
