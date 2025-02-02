package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.letusbuild.restrorealm.dto.CategoryDto;
import com.letusbuild.restrorealm.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Controller
@RequestMapping("/api/v1/category")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_CATEGORY')")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long categoryId){
        return ResponseEntity.ok(categoryService.getCategoryById(categoryId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_CATEGORIES')")
    public ResponseEntity<List<CategoryDto>> getAllCategories(){
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_CATEGORY')")
    public ResponseEntity<CategoryDto> createCategory(
            @RequestPart("category") String category,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            CategoryDto categoryDto = objectMapper.readValue(category, CategoryDto.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = saveImage(imageFile);
                categoryDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(categoryService.createCategory(categoryDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CATEGORY')")
    public ResponseEntity<CategoryDto> updateCategory(@PathVariable Long categoryId,
                                                      @RequestPart("category") String category,
                                                      @RequestPart(value = "image", required = false) MultipartFile imageFile){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            CategoryDto categoryDto = objectMapper.readValue(category, CategoryDto.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                CategoryDto existingCategory = categoryService.getCategoryById(categoryId);
                if (existingCategory.getImagePath() != null) {
                    deleteImage(existingCategory.getImagePath());
                }
                String fileName = saveImage(imageFile);
                categoryDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(categoryService.updateCategory(categoryId, categoryDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    private String saveImage(MultipartFile file) {
        try {
            String uploadDir = "src/main/resources/static/images/categories/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/images/categories/" + fileName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void deleteImage(String imagePath) {
        try {
            String uploadDir = "src/main/resources/static/images/categories/";
            Path filePath = Paths.get(uploadDir + imagePath.substring(imagePath.lastIndexOf("/") + 1));
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete old image", e);
        }
    }

}
