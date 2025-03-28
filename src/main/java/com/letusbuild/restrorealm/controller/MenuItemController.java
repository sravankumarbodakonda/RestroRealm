package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuItemDto;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/v1/menu-item")
@RequiredArgsConstructor
@Slf4j
public class MenuItemController {
    private final MenuItemService menuItemService;

    @GetMapping("/{menuItemId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_ITEM')")
    public ResponseEntity<?> getMenuItemById(@PathVariable Long menuItemId) {
        try {
            log.info("Fetching menu item with id: {}", menuItemId);
            MenuItemDto menuItemDto = menuItemService.getMenuItemById(menuItemId);
            return ResponseEntity.ok(menuItemDto);
        } catch (ResourceNotFoundException e) {
            log.warn("Menu item not found with id: {}", menuItemId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching menu item with id {}: {}", menuItemId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve menu item: " + e.getMessage()));
        }
    }

    @GetMapping("/category/{categoryName}")
    public ResponseEntity<?> getMenuItemsByCategoryName(@PathVariable String categoryName) {
        try {
            log.info("Fetching menu items for category: {}", categoryName);
            List<MenuItemDto> menuItems = menuItemService.getMenuItemsByCategoryName(categoryName);

            Map<String, Object> response = new HashMap<>();
            response.put("items", menuItems);
            response.put("category", categoryName);
            response.put("count", menuItems.size());

            log.info("Found {} menu items for category: {}", menuItems.size(), categoryName);
            return ResponseEntity.ok(menuItems);
        } catch (Exception e) {
            log.error("Error fetching menu items for category {}: {}", categoryName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to retrieve menu items: " + e.getMessage(),
                            "category", categoryName
                    ));
        }
    }

    @GetMapping("/public/category/{categoryName}")
    public ResponseEntity<?> getMenuItemsByCategoryNamePublic(@PathVariable String categoryName) {
        try {
            log.info("Public API: Fetching menu items for category: {}", categoryName);
            List<MenuItemDto> menuItems = menuItemService.getMenuItemsByCategoryName(categoryName);
            log.info("Public API: Found {} menu items for category: {}", menuItems.size(), categoryName);
            return ResponseEntity.ok(menuItems);
        } catch (Exception e) {
            log.error("Public API: Error fetching menu items for category {}: {}", categoryName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to retrieve menu items: " + e.getMessage(),
                            "category", categoryName
                    ));
        }
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_ITEMS')")
    public ResponseEntity<?> getAllMenuItems() {
        try {
            log.info("Fetching all menu items");
            List<MenuItemDto> menuItems = menuItemService.getAllMenuItems();
            log.info("Fetched {} menu items", menuItems.size());
            return ResponseEntity.ok(menuItems);
        } catch (Exception e) {
            log.error("Error fetching all menu items: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve menu items: " + e.getMessage()));
        }
    }

    @GetMapping("/public/all/")
    public ResponseEntity<?> getAllMenuItemsPublic() {
        try {
            log.info("Public API: Fetching all menu items");
            List<MenuItemDto> menuItems = menuItemService.getAllMenuItems();
            log.info("Public API: Fetched {} menu items", menuItems.size());
            return ResponseEntity.ok(menuItems);
        } catch (Exception e) {
            log.error("Public API: Error fetching all menu items: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve menu items: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAuthority('CREATE_MENU_ITEM')")
    public ResponseEntity<?> createMenuItem(
            @RequestPart("menuItem") String menuItemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuItemDto menuItemDto = objectMapper.readValue(menuItemJson, MenuItemDto.class);
            log.info("Creating menu item: {}", menuItemDto.getName());

            if (imageFile != null && !imageFile.isEmpty()) {
                log.info("Processing image for menu item: {}", menuItemDto.getName());
                String fileName = saveImage(imageFile);
                menuItemDto.setImagePath(fileName);
            }

            MenuItemDto created = menuItemService.createMenuItem(menuItemDto);
            log.info("Menu item created successfully with id: {}", created.getId());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Error creating menu item: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to create menu item: " + e.getMessage()
            ));
        }
    }

    @PutMapping(value = "/{menuItemId}", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_ITEM')")
    public ResponseEntity<?> updateMenuItem(
            @PathVariable Long menuItemId,
            @RequestPart("menuItem") String menuItemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuItemDto menuItemDto = objectMapper.readValue(menuItemJson, MenuItemDto.class);
            log.info("Updating menu item with id: {}", menuItemId);

            if (imageFile != null && !imageFile.isEmpty()) {
                log.info("Processing new image for menu item id: {}", menuItemId);
                MenuItemDto existingItem = menuItemService.getMenuItemById(menuItemId);
                if (existingItem.getImagePath() != null) {
                    deleteImage(existingItem.getImagePath());
                }
                String fileName = saveImage(imageFile);
                menuItemDto.setImagePath(fileName);
            }

            MenuItemDto updated = menuItemService.updateMenuItem(menuItemId, menuItemDto);
            log.info("Menu item updated successfully with id: {}", menuItemId);
            return ResponseEntity.ok(updated);
        } catch (ResourceNotFoundException e) {
            log.warn("Menu item not found with id: {}", menuItemId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating menu item with id {}: {}", menuItemId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to update menu item: " + e.getMessage()
            ));
        }
    }

    private String saveImage(MultipartFile file) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Image saved successfully: {}", fileName);
            return "/images/menu/" + fileName;
        } catch (Exception e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void deleteImage(String imagePath) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/";
            Path filePath = Paths.get(uploadDir + imagePath.substring(imagePath.lastIndexOf("/") + 1));
            boolean deleted = Files.deleteIfExists(filePath);
            log.info("Image deleted successfully: {}, result: {}", imagePath, deleted);
        } catch (Exception e) {
            log.error("Failed to delete old image {}: {}", imagePath, e.getMessage(), e);
            throw new RuntimeException("Failed to delete old image", e);
        }
    }
}
