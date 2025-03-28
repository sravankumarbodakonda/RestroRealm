package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.dto.CustomizationOptionDto;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.service.CustomizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/v1/customization")
@RequiredArgsConstructor
public class CustomizationController {
    private final CustomizationService customizationService;

    @GetMapping("/{customizationId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<?> getCustomizationById(@PathVariable Long customizationId) {
        try {
            CustomizationDto customizationDto = customizationService.getCustomizationById(customizationId);
            return ResponseEntity.ok(customizationDto);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve customization: " + e.getMessage()));
        }
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_CUSTOMIZATIONS')")
    public ResponseEntity<?> getAllCustomizations() {
        try {
            List<CustomizationDto> customizations = customizationService.getAllCustomizations();
            return ResponseEntity.ok(customizations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve customizations: " + e.getMessage()));
        }
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_CUSTOMIZATION')")
    public ResponseEntity<?> createCustomization(@RequestBody CustomizationDto customizationDto) {
        try {
            CustomizationDto createdCustomization = customizationService.createCustomization(customizationDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCustomization);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create customization: " + e.getMessage()));
        }
    }

    @PutMapping("/{customizationId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<?> updateCustomization(
            @PathVariable Long customizationId,
            @RequestBody CustomizationDto customizationDto) {
        try {
            CustomizationDto updatedCustomization = customizationService.updateCustomization(customizationId, customizationDto);
            return ResponseEntity.ok(updatedCustomization);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to update customization: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{customizationId}")
    @PreAuthorize("hasAuthority('DELETE_CUSTOMIZATION')")
    public ResponseEntity<?> deleteCustomization(@PathVariable Long customizationId) {
        try {
            customizationService.deleteCustomization(customizationId);
            return ResponseEntity.ok(Map.of("message", "Customization deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete customization: " + e.getMessage()));
        }
    }

    @GetMapping("/menu-item/{menuItemId}")
    public ResponseEntity<?> getCustomizationsByMenuItem(@PathVariable Long menuItemId) {
        try {
            List<CustomizationDto> customizations = customizationService.getCustomizationsByMenuItem(menuItemId);
            return ResponseEntity.ok(customizations);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve customizations: " + e.getMessage()));
        }
    }

    @PostMapping("/{customizationId}/option")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<?> addOptionToCustomization(
            @PathVariable Long customizationId,
            @RequestBody CustomizationOptionDto optionDto) {
        try {
            CustomizationOptionDto createdOption = customizationService.addOptionToCustomization(customizationId, optionDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOption);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to add option to customization: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{customizationId}/option/{optionId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<?> removeOptionFromCustomization(
            @PathVariable Long customizationId,
            @PathVariable Long optionId) {
        try {
            customizationService.removeOptionFromCustomization(customizationId, optionId);
            return ResponseEntity.ok(Map.of("message", "Option removed from customization successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove option from customization: " + e.getMessage()));
        }
    }
}
