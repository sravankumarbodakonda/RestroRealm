package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.entity.Customization;
import com.letusbuild.restrorealm.entity.MenuAddOn;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class MenuItemDto {
    private Long id;
    @NotBlank(message = "Menu Item name is required")
    @Size(min = 3, max = 50, message = "Menu Item must be between 3 and 50 characters")
    private String name;
    private String description;
    @DecimalMin(value = "0.0", inclusive = true)
    private Double basePrice;
    private boolean isRestricted;
    private boolean isAvailable;
    private String imagePath;
    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories;
    private Long categoryId;
    private Category category;
    private List<Customization> customizations;
    private List<MenuAddOn> addOns;
}
