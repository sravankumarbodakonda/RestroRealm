package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.dto.CustomizationOptionDto;
import com.letusbuild.restrorealm.entity.Customization;
import com.letusbuild.restrorealm.entity.CustomizationOption;
import com.letusbuild.restrorealm.entity.MenuItem;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.repository.CustomizationOptionRepository;
import com.letusbuild.restrorealm.repository.CustomizationRepository;
import com.letusbuild.restrorealm.repository.MenuItemRepository;
import com.letusbuild.restrorealm.service.CustomizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomizationServiceImpl implements CustomizationService {
    private final CustomizationRepository customizationRepository;
    private final CustomizationOptionRepository customizationOptionRepository;
    private final MenuItemRepository menuItemRepository;
    private final ModelMapper modelMapper;

    @Override
    public CustomizationDto getCustomizationById(Long customizationId) {
        Customization customization = customizationRepository.findById(customizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Customization with ID: " + customizationId + " not found"));
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
    @Transactional
    public CustomizationDto createCustomization(CustomizationDto customizationDto) {
        Customization customization = modelMapper.map(customizationDto, Customization.class);

        // Connect to menu item if ID is provided
        if (customizationDto.getMenuItemId() != null) {
            MenuItem menuItem = menuItemRepository.findById(customizationDto.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Item with ID: " + customizationDto.getMenuItemId() + " not found"));
            customization.setMenuItem(menuItem);
        }

        Customization savedCustomization = customizationRepository.save(customization);

        // Process options if any
        if (customizationDto.getOptions() != null && !customizationDto.getOptions().isEmpty()) {
            customizationDto.getOptions().forEach(option -> {
                option.setCustomization(savedCustomization);
                customizationOptionRepository.save(option);
            });
        }

        return modelMapper.map(savedCustomization, CustomizationDto.class);
    }

    @Override
    @Transactional
    public CustomizationDto updateCustomization(Long customizationId, CustomizationDto customizationDto) {
        Customization existingCustomization = customizationRepository.findById(customizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Customization with ID: " + customizationId + " not found"));

        // Update basic fields
        if (customizationDto.getName() != null) {
            existingCustomization.setName(customizationDto.getName());
        }

        existingCustomization.setRequired(customizationDto.isRequired());
        existingCustomization.setMultipleSelectionsAllowed(customizationDto.isMultipleSelectionsAllowed());

        // Update menu item if ID is provided
        if (customizationDto.getMenuItemId() != null) {
            MenuItem menuItem = menuItemRepository.findById(customizationDto.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu Item with ID: " + customizationDto.getMenuItemId() + " not found"));
            existingCustomization.setMenuItem(menuItem);
        }

        Customization updatedCustomization = customizationRepository.save(existingCustomization);

        // Update options if provided
        if (customizationDto.getOptions() != null) {
            // Get existing option IDs
            List<Long> existingOptionIds = existingCustomization.getOptions().stream()
                    .map(CustomizationOption::getId)
                    .collect(Collectors.toList());

            // Get new option IDs
            List<Long> newOptionIds = customizationDto.getOptions().stream()
                    .filter(o -> o.getId() != null)
                    .map(CustomizationOption::getId)
                    .collect(Collectors.toList());

            // Delete options that are not in the new list
            existingOptionIds.stream()
                    .filter(id -> !newOptionIds.contains(id))
                    .forEach(id -> customizationOptionRepository.deleteById(id));

            // Update or create options
            customizationDto.getOptions().forEach(option -> {
                if (option.getId() != null) {
                    // Update existing option
                    CustomizationOption existingOption = customizationOptionRepository.findById(option.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Customization Option with ID: " + option.getId() + " not found"));

                    existingOption.setName(option.getName());
                    existingOption.setAdditionalPrice(option.getAdditionalPrice());
                    existingOption.setDefault(option.isDefault());
                    existingOption.setCalories(option.getCalories());

                    customizationOptionRepository.save(existingOption);
                } else {
                    // Create new option
                    option.setCustomization(updatedCustomization);
                    customizationOptionRepository.save(option);
                }
            });
        }

        return modelMapper.map(updatedCustomization, CustomizationDto.class);
    }

    @Override
    @Transactional
    public void deleteCustomization(Long customizationId) {
        if (!customizationRepository.existsById(customizationId)) {
            throw new ResourceNotFoundException("Customization with ID: " + customizationId + " not found");
        }

        customizationRepository.deleteById(customizationId);
        log.info("Customization with ID: {} has been deleted successfully", customizationId);
    }

    @Override
    public List<CustomizationDto> getCustomizationsByMenuItem(Long menuItemId) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw new ResourceNotFoundException("Menu Item with ID: " + menuItemId + " not found");
        }

        List<Customization> customizations = customizationRepository.findByMenuItemId(menuItemId);
        return customizations.stream()
                .map(customization -> modelMapper.map(customization, CustomizationDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomizationOptionDto addOptionToCustomization(Long customizationId, CustomizationOptionDto optionDto) {
        Customization customization = customizationRepository.findById(customizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Customization with ID: " + customizationId + " not found"));

        CustomizationOption option = modelMapper.map(optionDto, CustomizationOption.class);
        option.setCustomization(customization);

        CustomizationOption savedOption = customizationOptionRepository.save(option);
        return modelMapper.map(savedOption, CustomizationOptionDto.class);
    }

    @Override
    @Transactional
    public void removeOptionFromCustomization(Long customizationId, Long optionId) {
        Customization customization = customizationRepository.findById(customizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Customization with ID: " + customizationId + " not found"));

        CustomizationOption option = customizationOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Customization Option with ID: " + optionId + " not found"));

        if (!option.getCustomization().getId().equals(customizationId)) {
            throw new IllegalArgumentException("Option with ID: " + optionId + " does not belong to Customization with ID: " + customizationId);
        }

        customizationOptionRepository.deleteById(optionId);
        log.info("Customization Option with ID: {} has been removed from Customization with ID: {}", optionId, customizationId);
    }
}
