package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.dto.MenuItemDto;
import com.letusbuild.restrorealm.service.MenuAddOnService;
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
@RequestMapping("/api/v1/menu-addon")
@RequiredArgsConstructor
public class MenuAddOnController {
    private final MenuAddOnService menuAddOnService;

    @GetMapping("/{menuAddOnId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_ADD_ON')")
    public ResponseEntity<MenuAddOnDto> getMenuAddOnById(@PathVariable Long menuAddOnId){
        return ResponseEntity.ok(menuAddOnService.getMenuAddOnById(menuAddOnId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_ADD_ONS')")
    public ResponseEntity<List<MenuAddOnDto>> getAllMenuAddOns(){
        return ResponseEntity.ok(menuAddOnService.getAllMenuAddOns());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_MENU_ADD_ON')")
    public ResponseEntity<MenuAddOnDto> createMenuAddOn(
            @RequestPart("menuAddon") String menuAddon,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuAddOnDto menuAddOnDto = objectMapper.readValue(menuAddon, MenuAddOnDto.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = saveImage(imageFile);
                menuAddOnDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuAddOnService.createMenuAddOn(menuAddOnDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{menuAddOnId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_ADD_ON')")
    public ResponseEntity<MenuAddOnDto> updateMenuAddOn(@PathVariable Long menuAddonId,
                                                      @RequestPart("menuAddon") String menuAddon,
                                                      @RequestPart(value = "image", required = false) MultipartFile imageFile){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuAddOnDto menuAddOnDto = objectMapper.readValue(menuAddon, MenuAddOnDto.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                MenuAddOnDto existingAddon = menuAddOnService.getMenuAddOnById(menuAddonId);
                if (existingAddon.getImagePath() != null) {
                    deleteImage(existingAddon.getImagePath());
                }
                String fileName = saveImage(imageFile);
                menuAddOnDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuAddOnService.updateMenuAddOn(menuAddonId, menuAddOnDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }
    private String saveImage(MultipartFile file) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/add-on/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/images/menu/add-on/" + fileName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void deleteImage(String imagePath) {
        try {
            String uploadDir = "src/main/resources/static/images/menu/add-on/";
            Path filePath = Paths.get(uploadDir + imagePath.substring(imagePath.lastIndexOf("/") + 1));
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete old image", e);
        }
    }
}
