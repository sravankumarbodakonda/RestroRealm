package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.entity.MenuAddOn;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.repository.MenuAddOnRepository;
import com.letusbuild.restrorealm.service.MenuAddOnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuAddOnServiceImpl implements MenuAddOnService {
    private final MenuAddOnRepository menuAddOnRepository;
    private final ModelMapper modelMapper;
    private static final String UPLOAD_DIR = "src/main/resources/static/images/menu/add-on/";
    private static final String IMAGE_PATH_PREFIX = "/images/menu/add-on/";

    @Override
    public MenuAddOnDto getMenuAddOnById(Long menuAddOnId) {
        MenuAddOn menuAddOn = menuAddOnRepository.findById(menuAddOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on with ID: " + menuAddOnId + " not found"));
        return modelMapper.map(menuAddOn, MenuAddOnDto.class);
    }

    @Override
    public List<MenuAddOnDto> getAllMenuAddOns() {
        List<MenuAddOn> menuAddOns = menuAddOnRepository.findAll();
        return menuAddOns.stream()
                .map(menuAddOn -> modelMapper.map(menuAddOn, MenuAddOnDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto) {
        // This method handles creation when only URL is provided (no file upload)
        MenuAddOn menuAddOn = modelMapper.map(menuAddOnDto, MenuAddOn.class);

        // Process the image path if it exists
        if (menuAddOnDto.getImagePath() != null) {
            // If it's a web URL, store as-is
            if (isWebUrl(menuAddOnDto.getImagePath())) {
                menuAddOn.setImagePath(menuAddOnDto.getImagePath());
            }
            // If it's a local path without the prefix, add it
            else if (!menuAddOnDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                menuAddOn.setImagePath(IMAGE_PATH_PREFIX + menuAddOnDto.getImagePath());
            }
            // Otherwise, it's already correctly formatted
        }

        MenuAddOn savedMenuAddOn = menuAddOnRepository.save(menuAddOn);
        return modelMapper.map(savedMenuAddOn, MenuAddOnDto.class);
    }

    @Override
    @Transactional
    public MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto, MultipartFile imageFile) {
        try {
            // Handle image upload if file is provided
            if (imageFile != null && !imageFile.isEmpty()) {
                String imagePath = saveImage(imageFile);
                menuAddOnDto.setImagePath(imagePath);
            } else if (menuAddOnDto.getImagePath() != null && menuAddOnDto.getImagePath().startsWith("http")) {
                // Handle image URL, no processing needed, just keep the URL
            } else {
                // No image provided, set default or null
                menuAddOnDto.setImagePath(null);
            }

            // Continue with regular creation
            return createMenuAddOn(menuAddOnDto);
        } catch (IOException e) {
            log.error("Failed to save image for new menu add-on", e);
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto) {
        // This method handles update when only URL is provided (no file upload)
        MenuAddOn existingMenuAddOn = menuAddOnRepository.findById(menuAddOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on with ID: " + menuAddOnId + " not found"));

        // Update fields
        updateMenuAddOnFields(existingMenuAddOn, menuAddOnDto);

        MenuAddOn updatedMenuAddOn = menuAddOnRepository.save(existingMenuAddOn);
        return modelMapper.map(updatedMenuAddOn, MenuAddOnDto.class);
    }

    @Override
    @Transactional
    public MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto, MultipartFile imageFile) {
        try {
            MenuAddOn existingMenuAddOn = menuAddOnRepository.findById(menuAddOnId)
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on with ID: " + menuAddOnId + " not found"));

            if (imageFile != null && !imageFile.isEmpty()) {
                if (existingMenuAddOn.getImagePath() != null &&
                        existingMenuAddOn.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                    deleteImage(existingMenuAddOn.getImagePath());
                }

                String imagePath = saveImage(imageFile);
                menuAddOnDto.setImagePath(imagePath);
            }
            else if (menuAddOnDto.getImagePath() != null && isWebUrl(menuAddOnDto.getImagePath())) {
                if (existingMenuAddOn.getImagePath() != null &&
                        existingMenuAddOn.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                    deleteImage(existingMenuAddOn.getImagePath());
                }
            }

            updateMenuAddOnFields(existingMenuAddOn, menuAddOnDto);

            MenuAddOn updatedMenuAddOn = menuAddOnRepository.save(existingMenuAddOn);
            return modelMapper.map(updatedMenuAddOn, MenuAddOnDto.class);
        } catch (IOException e) {
            log.error("Failed to save image for menu add-on with ID: " + menuAddOnId, e);
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void deleteMenuAddOn(Long menuAddOnId) {
        MenuAddOn menuAddOn = menuAddOnRepository.findById(menuAddOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on with ID: " + menuAddOnId + " not found"));

        try {
            if (menuAddOn.getImagePath() != null && menuAddOn.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                deleteImage(menuAddOn.getImagePath());
            }
            menuAddOnRepository.deleteById(menuAddOnId);
            log.info("Menu Add-on with ID: {} has been deleted successfully", menuAddOnId);
        } catch (IOException e) {
            log.error("Error deleting image file for Menu Add-on with ID: {}", menuAddOnId, e);
            throw new RuntimeException("Failed to delete image file: " + e.getMessage(), e);
        }
    }

    private void updateMenuAddOnFields(MenuAddOn existingMenuAddOn, MenuAddOnDto menuAddOnDto) {
        // Update name
        if (menuAddOnDto.getAddOnName() != null) {
            existingMenuAddOn.setAddOnName(menuAddOnDto.getAddOnName());
        }

        // Update description
        existingMenuAddOn.setDescription(menuAddOnDto.getDescription());

        // Update price
        if (menuAddOnDto.getAddOnPrice() != null) {
            existingMenuAddOn.setAddOnPrice(menuAddOnDto.getAddOnPrice());
        }

        // Update active status
        existingMenuAddOn.setActive(menuAddOnDto.isActive());

        // Update suggested status
        existingMenuAddOn.setSuggested(menuAddOnDto.isSuggested());

        // Update calories
        if (menuAddOnDto.getCalories() != null) {
            existingMenuAddOn.setCalories(menuAddOnDto.getCalories());
        }

        // Update image path
        if (menuAddOnDto.getImagePath() != null) {
            if (isWebUrl(menuAddOnDto.getImagePath())) {
                existingMenuAddOn.setImagePath(menuAddOnDto.getImagePath());
            } else if (!menuAddOnDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                existingMenuAddOn.setImagePath(IMAGE_PATH_PREFIX + menuAddOnDto.getImagePath());
            } else {
                existingMenuAddOn.setImagePath(menuAddOnDto.getImagePath());
            }
        }

        // Update vegetarian status
        existingMenuAddOn.setVegetarian(menuAddOnDto.isVegetarian());

        // Update spice level
        if (menuAddOnDto.getSpiceLevel() != null) {
            existingMenuAddOn.setSpiceLevel(menuAddOnDto.getSpiceLevel());
        }

        // Update allergens
        if (menuAddOnDto.getAllergens() != null) {
            existingMenuAddOn.setAllergens(menuAddOnDto.getAllergens());
        }

        // Update menu item relationship
        if (menuAddOnDto.getMenuItem() != null) {
            existingMenuAddOn.setMenuItem(menuAddOnDto.getMenuItem());
        }

        // Update categories relationship
        if (menuAddOnDto.getCategories() != null) {
            existingMenuAddOn.setCategories(menuAddOnDto.getCategories());
        }
    }

    private boolean isWebUrl(String path) {
        return path != null && (path.startsWith("http://") || path.startsWith("https://"));
    }

    private String saveImage(MultipartFile file) throws IOException {
        Files.createDirectories(Paths.get(UPLOAD_DIR));

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return IMAGE_PATH_PREFIX + fileName;
    }

    private void deleteImage(String imagePath) throws IOException {
        if (imagePath != null && !isWebUrl(imagePath) && imagePath.startsWith(IMAGE_PATH_PREFIX)) {
            String fileName = imagePath.substring(IMAGE_PATH_PREFIX.length());
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.deleteIfExists(filePath);
        }
    }
}
