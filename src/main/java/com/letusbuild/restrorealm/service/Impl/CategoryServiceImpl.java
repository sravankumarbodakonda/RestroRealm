package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.CategoryDto;
import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.repository.CategoryRepository;
import com.letusbuild.restrorealm.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final ModelMapper modelMapper;
    private static final String UPLOAD_DIR = "src/main/resources/static/images/categories/";
    private static final String IMAGE_PATH_PREFIX = "/images/categories/";

    @Override
    public CategoryDto getCategoryById(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
        return modelMapper.map(category, CategoryDto.class);
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(category -> modelMapper.map(category, CategoryDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryDto categoryDto) {
        // Handle image URL if provided
        processImageUrl(categoryDto);

        Category category = modelMapper.map(categoryDto, Category.class);
        Category savedCategory = categoryRepository.save(category);
        return modelMapper.map(savedCategory, CategoryDto.class);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long categoryId, CategoryDto categoryDto) {
        Category existingCategory = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Update basic fields
        existingCategory.setName(categoryDto.getName());
        existingCategory.setDescription(categoryDto.getDescription());
        existingCategory.setAgeRestricted(categoryDto.isAgeRestricted());
        existingCategory.setAvailableStartTime(categoryDto.getAvailableStartTime());
        existingCategory.setAvailableEndTime(categoryDto.getAvailableEndTime());

        // Handle image URL if provided
        if (categoryDto.getImageUrl() != null && !categoryDto.getImageUrl().trim().isEmpty()) {
            // If previous image was uploaded (not a URL), delete it
            if (isLocalImage(existingCategory.getImagePath())) {
                deleteImageFile(existingCategory.getImagePath());
            }
            existingCategory.setImagePath(categoryDto.getImageUrl());
        }
        // If a new image path is set (from file upload processing)
        else if (categoryDto.getImagePath() != null &&
                !categoryDto.getImagePath().equals(existingCategory.getImagePath())) {
            existingCategory.setImagePath(categoryDto.getImagePath());
        }

        Category updatedCategory = categoryRepository.save(existingCategory);
        return modelMapper.map(updatedCategory, CategoryDto.class);
    }

    @Override
    @Transactional
    public CategoryDto processImage(CategoryDto categoryDto, MultipartFile imageFile) {
        if (imageFile != null && !imageFile.isEmpty()) {
            // If updating an existing category with a file upload
            if (categoryDto.getId() != null) {
                try {
                    Category existingCategory = categoryRepository.findById(categoryDto.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryDto.getId()));

                    // Delete old image if it was a local file
                    if (isLocalImage(existingCategory.getImagePath())) {
                        deleteImageFile(existingCategory.getImagePath());
                    }
                } catch (ResourceNotFoundException e) {
                    // It's a new category, no existing image to delete
                    log.debug("No existing category found with id: {}", categoryDto.getId());
                }
            }

            // Save the new image and update the DTO
            String imagePath = saveImageFile(imageFile);
            categoryDto.setImagePath(imagePath);
            // Clear any imageUrl as we're using an uploaded file
            categoryDto.setImageUrl(null);
        }

        return categoryDto;
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Delete associated image if it's a local file
        if (isLocalImage(category.getImagePath())) {
            deleteImageFile(category.getImagePath());
        }

        categoryRepository.delete(category);
    }

    /**
     * Process the imageUrl field in the DTO if it exists
     */
    private void processImageUrl(CategoryDto categoryDto) {
        if (categoryDto.getImageUrl() != null && !categoryDto.getImageUrl().trim().isEmpty()) {
            categoryDto.setImagePath(categoryDto.getImageUrl());
        }
    }

    /**
     * Check if the image path refers to a locally stored file
     */
    private boolean isLocalImage(String imagePath) {
        return imagePath != null && imagePath.startsWith(IMAGE_PATH_PREFIX);
    }

    /**
     * Save an uploaded image file to the filesystem
     */
    private String saveImageFile(MultipartFile file) {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));

            // Sanitize filename
            String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String fileName = System.currentTimeMillis() + "_" + originalFilename;

            Path targetPath = Paths.get(UPLOAD_DIR + fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return IMAGE_PATH_PREFIX + fileName;
        } catch (IOException e) {
            log.error("Failed to save image file: {}", e.getMessage());
            throw new RuntimeException("Failed to store image file: " + e.getMessage(), e);
        }
    }

    /**
     * Delete an image file from the filesystem
     */
    private void deleteImageFile(String imagePath) {
        if (imagePath == null || !imagePath.startsWith(IMAGE_PATH_PREFIX)) {
            return;
        }

        try {
            String fileName = imagePath.substring(IMAGE_PATH_PREFIX.length());
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.deleteIfExists(filePath);
            log.info("Deleted image file: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete image file: {}", e.getMessage());
            // Don't throw exception here, just log the error
        }
    }
}
