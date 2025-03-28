package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.entity.Enum.SpiceLevel;
import com.letusbuild.restrorealm.entity.MenuItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class MenuAddOnDto {
    private Long id;

    @NotBlank(message = "Add-On name is required")
    @Size(min = 3, max = 50, message = "Add-On name must be between 3 and 50 characters")
    private String addOnName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal addOnPrice;

    private boolean isActive = true;

    private boolean isSuggested;

    private String imagePath;

    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories = 0.0;

    private boolean isVegetarian = false;

    private SpiceLevel spiceLevel = SpiceLevel.NONE;

    private List<String> allergens = new ArrayList<>();

    private MenuItem menuItem;

    private List<Category> categories = new ArrayList<>();

    // Compatibility methods to align with UI field names
    public String getName() {
        return addOnName;
    }

    public void setName(String name) {
        this.addOnName = name;
    }

    public BigDecimal getPrice() {
        return addOnPrice;
    }

    public void setPrice(BigDecimal price) {
        this.addOnPrice = price;
    }
}
