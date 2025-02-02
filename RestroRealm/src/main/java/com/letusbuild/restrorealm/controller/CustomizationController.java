package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.service.CustomizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/api/v1/customization")
@RequiredArgsConstructor
public class CustomizationController {
    private final CustomizationService customizationService;

    @GetMapping("/{customizationId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<CustomizationDto> getCustomizationById(@PathVariable Long customizationId){
        return ResponseEntity.ok(customizationService.getCustomizationById(customizationId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_CUSTOMIZATIONS')")
    public ResponseEntity<List<CustomizationDto>> getAllCustomizations(){
        return ResponseEntity.ok(customizationService.getAllCustomizations());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_CUSTOMIZATION')")
    public ResponseEntity<CustomizationDto> createCustomization(@RequestBody CustomizationDto customizationDto){
        return ResponseEntity.ok(customizationService.createCustomization(customizationDto));
    }

    @PutMapping("/{customizationId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_CUSTOMIZATION')")
    public ResponseEntity<CustomizationDto> updateCustomization(@PathVariable Long customizationId, @RequestBody CustomizationDto customizationDto){
        return ResponseEntity.ok(customizationService.updateCustomization(customizationId, customizationDto));
    }

}
