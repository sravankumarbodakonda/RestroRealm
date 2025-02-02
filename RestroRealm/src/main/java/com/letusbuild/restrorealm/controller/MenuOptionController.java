package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuOptionDto;
import com.letusbuild.restrorealm.service.MenuOptionService;
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
@RequestMapping("/api/v1/menu-option")
@RequiredArgsConstructor
public class MenuOptionController {
    private final MenuOptionService menuOptionService;

    @GetMapping("/{menuOptionId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_OPTION')")
    public ResponseEntity<MenuOptionDto> getMenuOptionById(@PathVariable Long menuOptionId){
        return ResponseEntity.ok(menuOptionService.getMenuOptionById(menuOptionId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_OPTIONS')")
    public ResponseEntity<List<MenuOptionDto>> getAllMenuOptions(){
        return ResponseEntity.ok(menuOptionService.getAllMenuOptions());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_MENU_OPTION')")
    public ResponseEntity<MenuOptionDto> createMenuOption(
            @RequestPart("menuOption") String menuOptionJson,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuOptionDto menuOptionDto = objectMapper.readValue(menuOptionJson, MenuOptionDto.class);

            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = saveImage(imageFile);
                menuOptionDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuOptionService.createMenuOption(menuOptionDto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{menuOptionId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_OPTION')")
    public ResponseEntity<MenuOptionDto> updateMenuOption(@PathVariable Long menuOptionId,
                                                      @RequestPart("menuOption") String menuOptionJson,
                                                      @RequestPart(value = "image", required = false) MultipartFile imageFile){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuOptionDto menuOptionDto = objectMapper.readValue(menuOptionJson, MenuOptionDto.class);
            if (imageFile != null && !imageFile.isEmpty()) {
                MenuOptionDto existingOption = menuOptionService.getMenuOptionById(menuOptionId);
                if (existingOption.getImagePath() != null) {
                    deleteImage(existingOption.getImagePath());
                }
                String fileName = saveImage(imageFile);
                menuOptionDto.setImagePath(fileName);
            }
            return ResponseEntity.ok(menuOptionService.updateMenuOption(menuOptionId, menuOptionDto));
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

