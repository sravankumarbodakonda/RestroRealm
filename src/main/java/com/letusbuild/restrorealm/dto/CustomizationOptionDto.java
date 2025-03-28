package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CustomizationOptionDto {
    private Long id;

    @NotBlank(message = "Option name is required")
    @Size(min = 1, max = 50, message = "Option name must be between 1 and 50 characters")
    private String name;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    private boolean isDefault = false;

    private Double calories = 0.0;

    private Long customizationId;
}
