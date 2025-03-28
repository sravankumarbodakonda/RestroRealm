package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.dto.CustomizationOptionDto;

import java.util.List;

public interface CustomizationService {
    CustomizationDto getCustomizationById(Long customizationId);

    List<CustomizationDto> getAllCustomizations();

    CustomizationDto createCustomization(CustomizationDto customizationDto);

    CustomizationDto updateCustomization(Long customizationId, CustomizationDto customizationDto);

    void deleteCustomization(Long customizationId);

    List<CustomizationDto> getCustomizationsByMenuItem(Long menuItemId);

    CustomizationOptionDto addOptionToCustomization(Long customizationId, CustomizationOptionDto optionDto);

    void removeOptionFromCustomization(Long customizationId, Long optionId);
}