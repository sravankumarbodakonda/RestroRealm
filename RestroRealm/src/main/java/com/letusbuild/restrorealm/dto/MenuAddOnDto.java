package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.MenuItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class MenuAddOnDto {
    private Long id;
    @NotBlank(message = "Add-On name is required")
    @Size(min = 3, max = 50, message = "Add-On must be between 3 and 50 characters")
    private String addOnName;
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal addOnPrice;
    private boolean deleted;
//    @NotBlank(message = "Suggestion is required")
    private boolean isSuggested;
    private String imagePath;
    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories;
    private MenuItem menuItem;
}
