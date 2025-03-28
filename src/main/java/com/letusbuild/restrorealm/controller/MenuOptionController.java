package com.letusbuild.restrorealm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.letusbuild.restrorealm.dto.MenuOptionDto;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.exception.ValidationException;
import com.letusbuild.restrorealm.service.MenuOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/menu-option")
@RequiredArgsConstructor
public class MenuOptionController {

    private final MenuOptionService menuOptionService;
    private final ObjectMapper objectMapper;

    @GetMapping("/{menuOptionId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_MENU_OPTION')")
    public ResponseEntity<MenuOptionDto> getMenuOptionById(@PathVariable Long menuOptionId) {
        return ResponseEntity.ok(menuOptionService.getMenuOptionById(menuOptionId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_OPTIONS')")
    public ResponseEntity<List<MenuOptionDto>> getAllMenuOptions() {
        return ResponseEntity.ok(menuOptionService.getAllMenuOptions());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('READ_ALL_MENU_OPTIONS')")
    public ResponseEntity<List<MenuOptionDto>> getAllActiveMenuOptions() {
        return ResponseEntity.ok(menuOptionService.getAllActiveMenuOptions());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_MENU_OPTION')")
    public ResponseEntity<?> createMenuOption(
            @RequestPart("option") String optionJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "imageUrl", required = false) String imageUrl) {
        try {
            MenuOptionDto menuOptionDto = objectMapper.readValue(optionJson, MenuOptionDto.class);
            MenuOptionDto createdOption = menuOptionService.createMenuOption(menuOptionDto, image, imageUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOption);
        } catch (ValidationException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create menu option: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{menuOptionId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_MENU_OPTION')")
    public ResponseEntity<?> updateMenuOption(
            @PathVariable Long menuOptionId,
            @RequestPart("option") String optionJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "imageUrl", required = false) String imageUrl) {
        try {
            MenuOptionDto menuOptionDto = objectMapper.readValue(optionJson, MenuOptionDto.class);
            MenuOptionDto updatedOption = menuOptionService.updateMenuOption(menuOptionId, menuOptionDto, image, imageUrl);
            return ResponseEntity.ok(updatedOption);
        } catch (ResourceNotFoundException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (ValidationException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update menu option: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{menuOptionId}")
    @PreAuthorize("hasAuthority('DELETE_MENU_OPTION')")
    public ResponseEntity<?> deleteMenuOption(@PathVariable Long menuOptionId) {
        try {
            menuOptionService.deleteMenuOption(menuOptionId);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete menu option: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
