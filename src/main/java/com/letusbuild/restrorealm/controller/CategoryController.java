package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.letusbuild.restrorealm.dto.CategoryDto;
import com.letusbuild.restrorealm.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/category")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {
    private final CategoryService categoryService;
    private final ObjectMapper objectMapper;

    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_CATEGORY')")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long categoryId) {
        return ResponseEntity.ok(categoryService.getCategoryById(categoryId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_CATEGORIES')")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/public/all/")
    public ResponseEntity<List<CategoryDto>> getAllCategoriesPublic() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_CATEGORY')")
    public ResponseEntity<CategoryDto> createCategory(
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestPart(value = "imageUrl", required = false) String imageUrl) {
        try {
            // Parse the category JSON
            objectMapper.registerModule(new JavaTimeModule());
            CategoryDto categoryDto = objectMapper.readValue(categoryJson, CategoryDto.class);

            // Set imageUrl if provided as separate form field
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                categoryDto.setImageUrl(imageUrl.trim());
            }

            // Process the image file if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                categoryDto = categoryService.processImage(categoryDto, imageFile);
            }

            // Create the category
            CategoryDto createdCategory = categoryService.createCategory(categoryDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
        } catch (Exception e) {
            log.error("Error creating category: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CATEGORY')")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable Long categoryId,
            @RequestPart("category") String categoryJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestPart(value = "imageUrl", required = false) String imageUrl) {
        try {
            // Parse the category JSON
            objectMapper.registerModule(new JavaTimeModule());
            CategoryDto categoryDto = objectMapper.readValue(categoryJson, CategoryDto.class);

            // Set imageUrl if provided as separate form field
            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                categoryDto.setImageUrl(imageUrl.trim());
                log.info("Image URL provided as separate field: {}", imageUrl);
            }

            // Process the image file if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                categoryDto = categoryService.processImage(categoryDto, imageFile);
            }

            // Update the category
            CategoryDto updatedCategory = categoryService.updateCategory(categoryId, categoryDto);
            return ResponseEntity.ok(updatedCategory);
        } catch (Exception e) {
            log.error("Error updating category: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('DELETE_SINGLE_CATEGORY')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
