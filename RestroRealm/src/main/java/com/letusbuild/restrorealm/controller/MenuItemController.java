package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuItemDto;
import com.letusbuild.restrorealm.service.MenuItemService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/v1/menu-item")
@RequiredArgsConstructor
public class MenuItemController {
    private final MenuItemService menuItemService;

    @GetMapping("/{menuItemId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_ITEM')")
    public ResponseEntity<MenuItemDto> getMenuItemById(@PathVariable Long menuItemId){
        return ResponseEntity.ok(menuItemService.getMenuItemById(menuItemId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_ITEMS')")
    public ResponseEntity<List<MenuItemDto>> getAllMenuItems(){
        return ResponseEntity.ok(menuItemService.getAllMenuItems());
    }

    @PostMapping(value = "/", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAuthority('CREATE_MENU_ITEM')")
    public ResponseEntity<MenuItemDto> createMenuItem(
            @RequestPart("menuItem") String menuItemJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuItemDto menuItemDto = objectMapper.readValue(menuItemJson, MenuItemDto.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = saveImage(imageFile);
                menuItemDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuItemService.createMenuItem(menuItemDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping(value = "/{menuItemId}", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_ITEM')")
    public ResponseEntity<MenuItemDto> updateMenuItem(@PathVariable Long menuItemId,
                                                      @RequestPart("menuItem") String menuItemJson,
                                                      @RequestPart(value = "image", required = false) MultipartFile imageFile){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuItemDto menuItemDto = objectMapper.readValue(menuItemJson, MenuItemDto.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                MenuItemDto existingItem = menuItemService.getMenuItemById(menuItemId);
                if (existingItem.getImagePath() != null) {
                    deleteImage(existingItem.getImagePath());
                }
                String fileName = saveImage(imageFile);
                menuItemDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuItemService.updateMenuItem(menuItemId, menuItemDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    private String saveImage(MultipartFile file) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/images/menu/" + fileName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void deleteImage(String imagePath) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/";
            Path filePath = Paths.get(uploadDir + imagePath.substring(imagePath.lastIndexOf("/") + 1));
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete old image", e);
        }
    }
}
