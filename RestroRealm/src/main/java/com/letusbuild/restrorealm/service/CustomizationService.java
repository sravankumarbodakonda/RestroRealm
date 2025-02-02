package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.CustomizationDto;

import java.util.List;

public interface CustomizationService {
    CustomizationDto getCustomizationById(Long customizationId);
    List<CustomizationDto> getAllCustomizations();
    CustomizationDto createCustomization(CustomizationDto customizationDto);
    CustomizationDto updateCustomization(Long customizationId, CustomizationDto customizationDto);
}
