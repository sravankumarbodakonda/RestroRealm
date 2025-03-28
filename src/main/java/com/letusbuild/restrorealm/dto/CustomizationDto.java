package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.CustomizationOption;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CustomizationDto {
    private Long id;

    @NotBlank(message = "Customization name is required")
    @Size(min = 3, max = 50, message = "Customization name must be between 3 and 50 characters")
    private String name;

    private boolean isRequired = false;

    private boolean isMultipleSelectionsAllowed = false;

    private List<CustomizationOption> options = new ArrayList<>();

    private Long menuItemId;
}
