package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.service.MenuAddOnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/v1/menu-addon")
@RequiredArgsConstructor
public class MenuAddOnController {
    private final MenuAddOnService menuAddOnService;

    @GetMapping("/{menuAddOnId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_ADD_ON')")
    public ResponseEntity<?> getMenuAddOnById(@PathVariable Long menuAddOnId){
        try {
            MenuAddOnDto menuAddOnDto = menuAddOnService.getMenuAddOnById(menuAddOnId);
            return ResponseEntity.ok(menuAddOnDto);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve menu add-on: " + e.getMessage()));
        }
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_ADD_ONS')")
    public ResponseEntity<?> getAllMenuAddOns(){
        try {
            List<MenuAddOnDto> menuAddOns = menuAddOnService.getAllMenuAddOns();
            return ResponseEntity.ok(menuAddOns);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve menu add-ons: " + e.getMessage()));
        }
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_MENU_ADD_ON')")
    public ResponseEntity<?> createMenuAddOn(
            @RequestPart("addon") String addon,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            @RequestPart(value = "imageUrl", required = false) String imageUrl) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuAddOnDto menuAddOnDto = objectMapper.readValue(addon, MenuAddOnDto.class);

            // Set the image URL if provided
            if (imageUrl != null && !imageUrl.isEmpty()) {
                menuAddOnDto.setImagePath(imageUrl);
            }

            // Pass both DTO and image file to service layer
            MenuAddOnDto createdAddOn = menuAddOnService.createMenuAddOn(menuAddOnDto, imageFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAddOn);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create menu add-on: " + e.getMessage()));
        }
    }

    @PutMapping("/{menuAddOnId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_ADD_ON')")
    public ResponseEntity<?> updateMenuAddOn(@PathVariable Long menuAddOnId,
                                             @RequestPart("addon") String addon,
                                             @RequestPart(value = "image", required = false) MultipartFile imageFile,
                                             @RequestPart(value = "imageUrl", required = false) String imageUrl){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MenuAddOnDto menuAddOnDto = objectMapper.readValue(addon, MenuAddOnDto.class);

            // Set the image URL if provided
            if (imageUrl != null && !imageUrl.isEmpty()) {
                menuAddOnDto.setImagePath(imageUrl);
            }

            // Pass both DTO, ID and image file to service layer
            MenuAddOnDto updatedAddOn = menuAddOnService.updateMenuAddOn(menuAddOnId, menuAddOnDto, imageFile);
            return ResponseEntity.ok(updatedAddOn);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to update menu add-on: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{menuAddOnId}")
    @PreAuthorize("hasAuthority('DELETE_MENU_ADD_ON')")
    public ResponseEntity<?> deleteMenuAddOn(@PathVariable Long menuAddOnId) {
        try {
            menuAddOnService.deleteMenuAddOn(menuAddOnId);
            return ResponseEntity.ok(Map.of("message", "Menu add-on deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete menu add-on: " + e.getMessage()));
        }
    }
}
