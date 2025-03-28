package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.MenuOptionChoiceDto;
import com.letusbuild.restrorealm.dto.MenuOptionDto;
import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.entity.Enum.DisplayStyle;
import com.letusbuild.restrorealm.entity.Enum.SelectionType;
import com.letusbuild.restrorealm.entity.MenuOption;
import com.letusbuild.restrorealm.entity.MenuOptionChoice;
import com.letusbuild.restrorealm.exception.ResourceNotFoundException;
import com.letusbuild.restrorealm.exception.ValidationException;
import com.letusbuild.restrorealm.repository.CategoryRepository;
import com.letusbuild.restrorealm.repository.CustomizationRepository;
import com.letusbuild.restrorealm.repository.MenuOptionChoiceRepository;
import com.letusbuild.restrorealm.repository.MenuOptionRepository;
import com.letusbuild.restrorealm.service.MenuOptionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuOptionServiceImpl implements MenuOptionService {

    private final MenuOptionRepository menuOptionRepository;
    private final MenuOptionChoiceRepository choiceRepository;
    private final CategoryRepository categoryRepository;
    private final CustomizationRepository customizationRepository;
    private final ModelMapper modelMapper;

    private static final String UPLOAD_DIR = "src/main/resources/static/images/menu/options";

    @Override
    public MenuOptionDto getMenuOptionById(Long menuOptionId) {
        MenuOption menuOption = menuOptionRepository.findById(menuOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Option not found with id: " + menuOptionId));
        return convertToDto(menuOption);
    }

    @Override
    public List<MenuOptionDto> getAllMenuOptions() {
        List<MenuOption> menuOptions = menuOptionRepository.findAll();
        return menuOptions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<MenuOptionDto> getAllActiveMenuOptions() {
        List<MenuOption> menuOptions = menuOptionRepository.findAllActive();
        return menuOptions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MenuOptionDto createMenuOption(MenuOptionDto menuOptionDto, MultipartFile image, String imageUrl) {
        validateMenuOption(menuOptionDto, null);

        // Handle image upload
        String imagePath = processImage(image, imageUrl, null);
        if (imagePath != null) {
            menuOptionDto.setImagePath(imagePath);
        }

        MenuOption menuOption = convertToEntity(menuOptionDto);

        // Process categories
        if (menuOptionDto.getCategories() != null && !menuOptionDto.getCategories().isEmpty()) {
            List<Category> categories = new ArrayList<>();
            menuOptionDto.getCategories().forEach(categoryDto -> {
                if (categoryDto.getId() != null) {
                    Category category = categoryRepository.findById(categoryDto.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryDto.getId()));
                    categories.add(category);
                }
            });
            menuOption.setCategories(categories);
        }

        // Set customization if provided
        if (menuOptionDto.getCustomizationId() != null) {
            menuOption.setCustomization(customizationRepository
                    .findById(menuOptionDto.getCustomizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customization not found with id: " + menuOptionDto.getCustomizationId())));
        }

        // Process choices
        menuOption.setChoices(new ArrayList<>());
        if (menuOptionDto.getChoices() != null && !menuOptionDto.getChoices().isEmpty()) {
            menuOptionDto.getChoices().forEach(choiceDto -> {
                MenuOptionChoice choice = modelMapper.map(choiceDto, MenuOptionChoice.class);
                menuOption.addChoice(choice);
            });
        }

        MenuOption savedOption = menuOptionRepository.save(menuOption);
        return convertToDto(savedOption);
    }

    @Override
    @Transactional
    public MenuOptionDto updateMenuOption(Long menuOptionId, MenuOptionDto menuOptionDto, MultipartFile image, String imageUrl) {
        validateMenuOption(menuOptionDto, menuOptionId);

        MenuOption existingOption = menuOptionRepository.findById(menuOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Option not found with id: " + menuOptionId));

        // Handle image upload
        String imagePath = processImage(image, imageUrl, existingOption.getImagePath());
        if (imagePath != null) {
            menuOptionDto.setImagePath(imagePath);
        } else {
            menuOptionDto.setImagePath(existingOption.getImagePath());
        }

        // Update basic properties
        existingOption.setName(menuOptionDto.getName());
        existingOption.setDescription(menuOptionDto.getDescription());
        existingOption.setRequired(menuOptionDto.getRequired());
        existingOption.setActive(menuOptionDto.getActive());
        existingOption.setSelectionType(SelectionType.valueOf(menuOptionDto.getSelectionType()));
        existingOption.setDisplayStyle(DisplayStyle.valueOf(menuOptionDto.getDisplayStyle()));
        existingOption.setMinSelect(menuOptionDto.getMinSelect());
        existingOption.setMaxSelect(menuOptionDto.getMaxSelect());
        existingOption.setImagePath(menuOptionDto.getImagePath());
        existingOption.setPosition(menuOptionDto.getPosition());

        // Set customization if provided
        if (menuOptionDto.getCustomizationId() != null) {
            existingOption.setCustomization(customizationRepository
                    .findById(menuOptionDto.getCustomizationId())
                    .orElse(null));
        }

        // Update categories
        if (menuOptionDto.getCategories() != null) {
            List<Category> categories = new ArrayList<>();
            menuOptionDto.getCategories().forEach(categoryDto -> {
                if (categoryDto.getId() != null) {
                    Category category = categoryRepository.findById(categoryDto.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryDto.getId()));
                    categories.add(category);
                }
            });
            existingOption.setCategories(categories);
        }

        // Update choices
        if (menuOptionDto.getChoices() != null) {
            // Remove old choices
            existingOption.getChoices().clear();

            // Add new choices
            menuOptionDto.getChoices().forEach(choiceDto -> {
                MenuOptionChoice choice;
                if (choiceDto.getId() != null) {
                    // Existing choice
                    choice = choiceRepository.findById(choiceDto.getId())
                            .orElse(new MenuOptionChoice());
                } else {
                    // New choice
                    choice = new MenuOptionChoice();
                }

                choice.setChoiceName(choiceDto.getChoiceName());
                choice.setDescription(choiceDto.getDescription());
                choice.setAdditionalPrice(choiceDto.getAdditionalPrice());
                choice.setIsDefault(choiceDto.getIsDefault());
                choice.setActive(choiceDto.getActive());
                choice.setImagePath(choiceDto.getImagePath());

                existingOption.addChoice(choice);
            });
        }

        MenuOption updatedOption = menuOptionRepository.save(existingOption);
        return convertToDto(updatedOption);
    }

    @Override
    @Transactional
    public void deleteMenuOption(Long menuOptionId) {
        MenuOption menuOption = menuOptionRepository.findById(menuOptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu Option not found with id: " + menuOptionId));

        // Delete the image if it exists
        if (menuOption.getImagePath() != null && !menuOption.getImagePath().isEmpty()) {
            deleteImage(menuOption.getImagePath());
        }

        menuOptionRepository.delete(menuOption);
    }

    private String processImage(MultipartFile image, String imageUrl, String existingImagePath) {
        // If no new image is provided, keep the existing one
        if ((image == null || image.isEmpty()) && (imageUrl == null || imageUrl.isEmpty())) {
            return null;
        }

        // Delete existing image if a new one is being uploaded
        if (existingImagePath != null && !existingImagePath.isEmpty()) {
            deleteImage(existingImagePath);
        }

        // Handle image file upload
        if (image != null && !image.isEmpty()) {
            return saveImage(image);
        }

        // Handle image URL
        if (imageUrl != null && !imageUrl.isEmpty()) {
            return imageUrl;
        }

        return null;
    }

    private String saveImage(MultipartFile file) {
        try {
            // Create directories if they don't exist
            Files.createDirectories(Paths.get(UPLOAD_DIR));

            // Generate a unique filename
            String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String fileName = System.currentTimeMillis() + "_" + originalFileName;

            // Save the file
            Path targetLocation = Paths.get(UPLOAD_DIR).resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/images/menu/options/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    private void deleteImage(String imagePath) {
        if (imagePath == null || imagePath.isEmpty() || imagePath.startsWith("http")) {
            return;
        }

        try {
            // Extract filename from path
            String fileName = imagePath.substring(imagePath.lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Log error but don't throw exception as this is not critical
            System.err.println("Error deleting image: " + ex.getMessage());
        }
    }

    private void validateMenuOption(MenuOptionDto menuOptionDto, Long optionId) {
        // Check for unique name
        if (optionId == null) {
            if (menuOptionRepository.existsByName(menuOptionDto.getName())) {
                throw new ValidationException("A menu option with this name already exists");
            }
        } else {
            if (menuOptionRepository.existsByNameAndIdNot(menuOptionDto.getName(), optionId)) {
                throw new ValidationException("A menu option with this name already exists");
            }
        }

        // Validate selection type and display style
        try {
            SelectionType selectionType = SelectionType.valueOf(menuOptionDto.getSelectionType());
            DisplayStyle displayStyle = DisplayStyle.valueOf(menuOptionDto.getDisplayStyle());

            // Check if display style is compatible with selection type
            if ((selectionType == SelectionType.SINGLE && displayStyle == DisplayStyle.CHECKBOX) ||
                    (selectionType == SelectionType.MULTIPLE && displayStyle == DisplayStyle.DROPDOWN) ||
                    (selectionType == SelectionType.RANGE && (displayStyle != DisplayStyle.SLIDER))) {
                throw new ValidationException("The selected display style is not compatible with the selection type");
            }

        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Invalid selection type or display style");
        }

        // Validate min/max selection for MULTIPLE type
        if (menuOptionDto.getSelectionType().equals(SelectionType.MULTIPLE.name())) {
            if (menuOptionDto.getMinSelect() == null || menuOptionDto.getMaxSelect() == null) {
                throw new ValidationException("Min and max selection must be specified for multiple selection type");
            }

            if (menuOptionDto.getMinSelect() > menuOptionDto.getMaxSelect()) {
                throw new ValidationException("Minimum selection cannot be greater than maximum selection");
            }

            if (menuOptionDto.getChoices() != null && !menuOptionDto.getChoices().isEmpty() &&
                    menuOptionDto.getMaxSelect() > menuOptionDto.getChoices().size()) {
                throw new ValidationException("Maximum selection cannot be greater than the number of choices");
            }
        }

        // Ensure SINGLE type has exactly one default choice (if choices are provided)
        if (menuOptionDto.getSelectionType().equals(SelectionType.SINGLE.name()) &&
                menuOptionDto.getChoices() != null && !menuOptionDto.getChoices().isEmpty()) {

            long defaultCount = menuOptionDto.getChoices().stream()
                    .filter(MenuOptionChoiceDto::getIsDefault)
                    .count();

            if (defaultCount > 1) {
                throw new ValidationException("Only one choice can be set as default for single selection type");
            }
        }
    }

    private MenuOptionDto convertToDto(MenuOption menuOption) {
        MenuOptionDto dto = modelMapper.map(menuOption, MenuOptionDto.class);
        dto.setSelectionType(menuOption.getSelectionType().name());
        dto.setDisplayStyle(menuOption.getDisplayStyle().name());
        return dto;
    }

    private MenuOption convertToEntity(MenuOptionDto dto) {
        MenuOption entity = modelMapper.map(dto, MenuOption.class);
        entity.setSelectionType(SelectionType.valueOf(dto.getSelectionType()));
        entity.setDisplayStyle(DisplayStyle.valueOf(dto.getDisplayStyle()));
        return entity;
    }
}
