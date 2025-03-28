package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.dto.MenuItemDto;
import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.entity.Customization;
import com.letusbuild.restrorealm.entity.MenuAddOn;
import com.letusbuild.restrorealm.entity.MenuItem;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.repository.CustomizationRepository;
import com.letusbuild.restrorealm.repository.MenuAddOnRepository;
import com.letusbuild.restrorealm.repository.MenuItemRepository;
import com.letusbuild.restrorealm.service.CategoryService;
import com.letusbuild.restrorealm.service.MenuItemService;
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
public class MenuItemServiceImpl implements MenuItemService {
    private final MenuItemRepository menuItemRepository;
    private final MenuAddOnRepository menuAddOnRepository;
    private final CustomizationRepository customizationRepository;
    private final CategoryService categoryService;
    private final ModelMapper modelMapper;

    private static final String UPLOAD_DIR = "src/main/resources/static/images/menu/";
    private static final String IMAGE_PATH_PREFIX = "/images/menu/";

    @Override
    public MenuItemDto getMenuItemById(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));
        return modelMapper.map(menuItem, MenuItemDto.class);
    }

    @Override
    public List<MenuItemDto> getAllMenuItems() {
        List<MenuItem> menuItems = menuItemRepository.findAll();
        return menuItems.stream()
                .map(menuItem -> modelMapper.map(menuItem, MenuItemDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MenuItemDto createMenuItem(MenuItemDto menuItemDto) {
        MenuItem menuItem = modelMapper.map(menuItemDto, MenuItem.class);

        Category category = modelMapper.map(
                categoryService.getCategoryById(menuItemDto.getCategoryId()),
                Category.class
        );
        menuItem.setCategory(category);

        // Handle image path
        if (menuItemDto.getImagePath() != null) {
            if (isWebUrl(menuItemDto.getImagePath())) {
                menuItem.setImagePath(menuItemDto.getImagePath());
            } else if (!menuItemDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                menuItem.setImagePath(IMAGE_PATH_PREFIX + menuItemDto.getImagePath());
            } else {
                menuItem.setImagePath(menuItemDto.getImagePath());
            }
        }

        MenuItem savedMenuItem = menuItemRepository.save(menuItem);

        // Handle customizations if any
        if (menuItemDto.getCustomizations() != null && !menuItemDto.getCustomizations().isEmpty()) {
            for (Customization customization : menuItemDto.getCustomizations()) {
                customization.setMenuItem(savedMenuItem);
                customizationRepository.save(customization);
            }
        }

        return modelMapper.map(savedMenuItem, MenuItemDto.class);
    }

    @Override
    @Transactional
    public MenuItemDto createMenuItem(MenuItemDto menuItemDto, MultipartFile imageFile) {
        try {
            // Handle image upload if file is provided
            if (imageFile != null && !imageFile.isEmpty()) {
                String imagePath = saveImage(imageFile);
                menuItemDto.setImagePath(imagePath);
            } else if (menuItemDto.getImagePath() != null && isWebUrl(menuItemDto.getImagePath())) {
                // Handle image URL, no processing needed
            } else {
                // No image provided or simple path
                if (menuItemDto.getImagePath() != null && !menuItemDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                    menuItemDto.setImagePath(IMAGE_PATH_PREFIX + menuItemDto.getImagePath());
                }
            }

            // Continue with regular creation
            return createMenuItem(menuItemDto);
        } catch (IOException e) {
            log.error("Failed to save image for new menu item", e);
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
    }

//    @Override
//    @Transactional
//    public MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto) {
//        MenuItem existingMenuItem = menuItemRepository.findById(menuItemId)
//                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));
//
//        updateMenuItemFields(existingMenuItem, menuItemDto);
//
//        MenuItem updatedMenuItem = menuItemRepository.save(existingMenuItem);
//
//        // Update customizations if provided
//        if (menuItemDto.getCustomizations() != null) {
//            // Remove existing customizations not in the new list
//            List<Long> newCustomizationIds = menuItemDto.getCustomizations().stream()
//                    .filter(c -> c.getId() != null)
//                    .map(Customization::getId)
//                    .collect(Collectors.toList());
//
//            existingMenuItem.getCustomizations().stream()
//                    .filter(c -> !newCustomizationIds.contains(c.getId()))
//                    .forEach(customizationRepository::delete);
//
//            // Update or add new customizations
//            menuItemDto.getCustomizations().forEach(customization -> {
//                if (customization.getId() != null) {
//                    // Update existing
//                    Customization existingCustomization = customizationRepository.findById(customization.getId())
//                            .orElseThrow(() -> new ResourceNotFoundException("Customization Id - " + customization.getId() + " not found"));
//
//                    existingCustomization.setName(customization.getName());
//                    existingCustomization.setRequired(customization.isRequired());
//                    existingCustomization.setMultipleSelectionsAllowed(customization.isMultipleSelectionsAllowed());
//                    existingCustomization.setOptions(customization.getOptions());
//
//                    customizationRepository.save(existingCustomization);
//                } else {
//                    // Add new
//                    customization.setMenuItem(updatedMenuItem);
//                    customizationRepository.save(customization);
//                }
//            });
//        }
//
//        return modelMapper.map(updatedMenuItem, MenuItemDto.class);
//    }

//    @Override
//    @Transactional
//    public MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto, MultipartFile imageFile) {
//        try {
//            MenuItem existingMenuItem = menuItemRepository.findById(menuItemId)
//                    .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));
//
//            if (imageFile != null && !imageFile.isEmpty()) {
//                if (existingMenuItem.getImagePath() != null &&
//                        existingMenuItem.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
//                    deleteImage(existingMenuItem.getImagePath());
//                }
//
//                String imagePath = saveImage(imageFile);
//                menuItemDto.setImagePath(imagePath);
//            }
//            else if (menuItemDto.getImagePath() != null && isWebUrl(menuItemDto.getImagePath())) {
//                if (existingMenuItem.getImagePath() != null &&
//                        existingMenuItem.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
//                    deleteImage(existingMenuItem.getImagePath());
//                }
//            }
//
//            return updateMenuItem(menuItemId, menuItemDto);
//        } catch (IOException e) {
//            log.error("Failed to save image for menu item with ID: " + menuItemId, e);
//            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
//        }
//    }

    @Override
    @Transactional
    public void deleteMenuItem(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        try {
            if (menuItem.getImagePath() != null &&
                    menuItem.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                deleteImage(menuItem.getImagePath());
            }
            menuItemRepository.deleteById(menuItemId);
            log.info("Menu Item with ID: {} has been deleted successfully", menuItemId);
        } catch (IOException e) {
            log.error("Error deleting image file for Menu Item with ID: {}", menuItemId, e);
            throw new RuntimeException("Failed to delete image file: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public MenuItemDto addAddOnToMenuItem(Long menuItemId, Long addOnId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        MenuAddOn menuAddOn = menuAddOnRepository.findById(addOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on Id - " + addOnId + " not found"));

        menuAddOn.setMenuItem(menuItem);
        menuAddOnRepository.save(menuAddOn);

        return modelMapper.map(menuItem, MenuItemDto.class);
    }

    @Override
    @Transactional
    public MenuItemDto removeAddOnFromMenuItem(Long menuItemId, Long addOnId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        MenuAddOn menuAddOn = menuAddOnRepository.findById(addOnId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Add-on Id - " + addOnId + " not found"));

        if (menuAddOn.getMenuItem() != null && menuAddOn.getMenuItem().getId().equals(menuItemId)) {
            menuAddOn.setMenuItem(null);
            menuAddOnRepository.save(menuAddOn);
        }

        return modelMapper.map(menuItem, MenuItemDto.class);
    }

    @Override
    public List<MenuItemDto> searchMenuItems(String keyword) {
        List<MenuItem> menuItems = menuItemRepository.searchByKeyword(keyword);
        return menuItems.stream()
                .map(menuItem -> modelMapper.map(menuItem, MenuItemDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<MenuAddOnDto> getAddOnsByMenuItem(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        return menuItem.getAddOns().stream()
                .map(addOn -> modelMapper.map(addOn, MenuAddOnDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomizationDto> getCustomizationsByMenuItem(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        return menuItem.getCustomizations().stream()
                .map(customization -> modelMapper.map(customization, CustomizationDto.class))
                .collect(Collectors.toList());
    }

//    private void updateMenuItemFields(MenuItem existingMenuItem, MenuItemDto menuItemDto) {
//        // Update name
//        if (menuItemDto.getName() != null) {
//            existingMenuItem.setName(menuItemDto.getName());
//        }
//
//        // Update description
//        if (menuItemDto.getDescription() != null) {
//            existingMenuItem.setDescription(menuItemDto.getDescription());
//        }
//
//        // Update base price
//        if (menuItemDto.getBasePrice() != null) {
//            existingMenuItem.setBasePrice(menuItemDto.getBasePrice());
//        }
//
//        // Update availability status
//        existingMenuItem.setAvailable(menuItemDto.isUnavailable());
//
//        // Update restricted status
//        existingMenuItem.setRestricted(menuItemDto.isRestricted());
//
//        // Update calories
//        if (menuItemDto.getCalories() != null) {
//            existingMenuItem.setCalories(menuItemDto.getCalories());
//        }
//
//        // Update category if provided
//        if (menuItemDto.getCategoryId() != null) {
//            Category category = modelMapper.map(
//                    categoryService.getCategoryById(menuItemDto.getCategoryId()),
//                    Category.class
//            );
//            existingMenuItem.setCategory(category);
//        }
//
//        // Update image path
//        if (menuItemDto.getImagePath() != null) {
//            if (isWebUrl(menuItemDto.getImagePath())) {
//                existingMenuItem.setImagePath(menuItemDto.getImagePath());
//            } else if (!menuItemDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
//                existingMenuItem.setImagePath(IMAGE_PATH_PREFIX + menuItemDto.getImagePath());
//            } else {
//                existingMenuItem.setImagePath(menuItemDto.getImagePath());
//            }
//        }
//    }

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

    @Override
    public List<MenuItemDto> getMenuItemsByCategoryName(String categoryName) {
        log.info("Fetching menu items for category name: {}", categoryName);

        // Try case-sensitive search first
        List<MenuItem> menuItems = menuItemRepository.findByCategoryName(categoryName);

        // If no results, try case-insensitive search
        if (menuItems.isEmpty()) {
            log.info("No items found with exact case match. Trying case-insensitive search for: {}", categoryName);
            menuItems = menuItemRepository.findByCategoryNameIgnoreCase(categoryName);
        }

        log.info("Found {} menu items for category: {}", menuItems.size(), categoryName);

        return menuItems.stream()
                .map(menuItem -> modelMapper.map(menuItem, MenuItemDto.class))
                .collect(Collectors.toList());
    }

    // Fixed method 1: updateMenuItemFields method
    private void updateMenuItemFields(MenuItem existingMenuItem, MenuItemDto menuItemDto) {
        // Update name
        if (menuItemDto.getName() != null) {
            existingMenuItem.setName(menuItemDto.getName());
        }

        // Update description
        if (menuItemDto.getDescription() != null) {
            existingMenuItem.setDescription(menuItemDto.getDescription());
        }

        // Update base price
        if (menuItemDto.getBasePrice() != null) {
            existingMenuItem.setBasePrice(menuItemDto.getBasePrice());
        }

        // Update availability status - FIX: Make these opposite values
        existingMenuItem.setAvailable(!menuItemDto.isUnavailable());
        existingMenuItem.setUnavailable(menuItemDto.isUnavailable());

        // Update restricted status
        existingMenuItem.setRestricted(menuItemDto.isRestricted());

        // Update calories
        if (menuItemDto.getCalories() != null) {
            existingMenuItem.setCalories(menuItemDto.getCalories());
        }

        // Update category if provided
        if (menuItemDto.getCategoryId() != null) {
            Category category = modelMapper.map(
                    categoryService.getCategoryById(menuItemDto.getCategoryId()),
                    Category.class
            );
            existingMenuItem.setCategory(category);
        }

        // Update image path - with logging
        if (menuItemDto.getImagePath() != null) {
            log.info("Updating image path from '{}' to '{}'", existingMenuItem.getImagePath(), menuItemDto.getImagePath());

            if (isWebUrl(menuItemDto.getImagePath())) {
                existingMenuItem.setImagePath(menuItemDto.getImagePath());
            } else if (!menuItemDto.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                existingMenuItem.setImagePath(IMAGE_PATH_PREFIX + menuItemDto.getImagePath());
            } else {
                existingMenuItem.setImagePath(menuItemDto.getImagePath());
            }
        }

        // Update other boolean properties
        existingMenuItem.setVegetarian(menuItemDto.isVegetarian());
        existingMenuItem.setSpicy(menuItemDto.isSpicy());
        existingMenuItem.setNew(menuItemDto.isNew());
        existingMenuItem.setCustomizable(menuItemDto.isCustomizable());
        existingMenuItem.setHasAddOns(menuItemDto.isHasAddOns());

        // Update spice level if provided
        if (menuItemDto.getSpiceLevel() != null) {
            existingMenuItem.setSpiceLevel(menuItemDto.getSpiceLevel());
        }
    }

    // Fixed method 2: updateMenuItem with image file
    @Override
    @Transactional
    public MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto, MultipartFile imageFile) {
        try {
            MenuItem existingMenuItem = menuItemRepository.findById(menuItemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

            log.info("Updating menu item with ID: {}", menuItemId);
            log.info("Original image path: {}", existingMenuItem.getImagePath());

            if (imageFile != null && !imageFile.isEmpty()) {
                log.info("New image file provided: {}", imageFile.getOriginalFilename());

                // Delete old image if it exists
                if (existingMenuItem.getImagePath() != null &&
                        existingMenuItem.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                    deleteImage(existingMenuItem.getImagePath());
                }

                String imagePath = saveImage(imageFile);
                log.info("New image saved at path: {}", imagePath);
                menuItemDto.setImagePath(imagePath);
            }
            else if (menuItemDto.getImagePath() != null && isWebUrl(menuItemDto.getImagePath())) {
                log.info("New image URL provided: {}", menuItemDto.getImagePath());

                // Delete old image if it exists
                if (existingMenuItem.getImagePath() != null &&
                        existingMenuItem.getImagePath().startsWith(IMAGE_PATH_PREFIX)) {
                    deleteImage(existingMenuItem.getImagePath());
                }
            }

            MenuItemDto result = updateMenuItem(menuItemId, menuItemDto);
            log.info("Menu item updated successfully. New image path: {}", result.getImagePath());
            return result;
        } catch (IOException e) {
            log.error("Failed to save image for menu item with ID: " + menuItemId, e);
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
    }

    // Fixed method 3: Main updateMenuItem method
    @Override
    @Transactional
    public MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto) {
        MenuItem existingMenuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item Id - " + menuItemId + " not found"));

        // Store original path for logging
        String originalPath = existingMenuItem.getImagePath();

        // Update fields
        updateMenuItemFields(existingMenuItem, menuItemDto);

        // Ensure changes are detected by forcing a flush
        MenuItem updatedMenuItem = menuItemRepository.saveAndFlush(existingMenuItem);

        log.info("Menu item updated in database: ID={}, Name={}", updatedMenuItem.getId(), updatedMenuItem.getName());
        log.info("Image path changed from '{}' to '{}'", originalPath, updatedMenuItem.getImagePath());

        // Update customizations if provided
        if (menuItemDto.getCustomizations() != null) {
            // Remove existing customizations not in the new list
            List<Long> newCustomizationIds = menuItemDto.getCustomizations().stream()
                    .filter(c -> c.getId() != null)
                    .map(Customization::getId)
                    .collect(Collectors.toList());

            existingMenuItem.getCustomizations().stream()
                    .filter(c -> !newCustomizationIds.contains(c.getId()))
                    .forEach(customizationRepository::delete);

            // Update or add new customizations
            menuItemDto.getCustomizations().forEach(customization -> {
                if (customization.getId() != null) {
                    // Update existing
                    Customization existingCustomization = customizationRepository.findById(customization.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Customization Id - " + customization.getId() + " not found"));

                    existingCustomization.setName(customization.getName());
                    existingCustomization.setRequired(customization.isRequired());
                    existingCustomization.setMultipleSelectionsAllowed(customization.isMultipleSelectionsAllowed());
                    existingCustomization.setOptions(customization.getOptions());

                    customizationRepository.save(existingCustomization);
                } else {
                    // Add new
                    customization.setMenuItem(updatedMenuItem);
                    customizationRepository.save(customization);
                }
            });
        }

        return modelMapper.map(updatedMenuItem, MenuItemDto.class);
    }
}
