package com.letusbuild.restrorealm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class MenuOptionDto {
    private Long id;

    @NotBlank(message = "Option name is required")
    @Size(min = 3, max = 50, message = "Option name must be between 3 and 50 characters")
    private String name;

    private String description;

    @NotNull(message = "Required status must be specified")
    private Boolean required = false;

    @NotNull(message = "Active status must be specified")
    private Boolean active = true;

    @NotNull(message = "Selection type must be specified")
    private String selectionType;

    @NotNull(message = "Display style must be specified")
    private String displayStyle;

    private Integer minSelect;

    private Integer maxSelect;

    @Valid
    private List<MenuOptionChoiceDto> choices = new ArrayList<>();

    private String imagePath;

    private Integer position;

    @JsonIgnoreProperties(value = {"menu_options"})
    private List<CategoryDto> categories = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long customizationId;
}
