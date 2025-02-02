package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.entity.Customization;
import com.letusbuild.restrorealm.repository.CustomizationRepository;
import com.letusbuild.restrorealm.service.CustomizationService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomizationServiceImpl implements CustomizationService {
    private final CustomizationRepository customizationRepository;
    private final ModelMapper modelMapper;
    @Override
    public CustomizationDto getCustomizationById(Long customizationId) {
        Customization customization = customizationRepository.findById(customizationId)
                .orElseThrow(() -> new RuntimeException("Customization Id - " + customizationId + " not found"));
        return modelMapper.map(customization, CustomizationDto.class);
    }

    @Override
    public List<CustomizationDto> getAllCustomizations() {
        List<Customization> customizations = customizationRepository.findAll();
        return customizations.stream()
                .map(customization -> modelMapper.map(customization, CustomizationDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public CustomizationDto createCustomization(CustomizationDto customizationDto) {
        Customization customization = modelMapper.map(customizationDto, Customization.class);
        Customization savedCustomization = customizationRepository.save(customization);
        return modelMapper.map(savedCustomization, CustomizationDto.class);
    }

    @Override
    public CustomizationDto updateCustomization(Long customizationId, CustomizationDto customizationDto) {
        Customization existingCustomization = modelMapper
                .map(getCustomizationById(customizationId), Customization.class);
        existingCustomization.setType(customizationDto.getType());
        existingCustomization.setRequired(customizationDto.isRequired());
        Customization updatedCustomization = customizationRepository.save(existingCustomization);
        return modelMapper.map(updatedCustomization, CustomizationDto.class);
    }
}
