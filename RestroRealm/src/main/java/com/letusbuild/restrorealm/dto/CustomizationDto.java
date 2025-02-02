package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.MenuItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class CustomizationDto {
    private Long id;
    @NotBlank(message = "Customization Type is required")
    @Size(min = 3, max = 50, message = "Customization Type must be between 3 and 50 characters")
    private String type;
//    @NotNull(message = "Mandatory Field is required")
    private boolean isRequired;
    private boolean deleted;
    private MenuItem menuItem;
}
