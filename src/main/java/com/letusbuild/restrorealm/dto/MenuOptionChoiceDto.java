package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class MenuOptionChoiceDto {

    private Long id;

    @NotBlank(message = "Choice name is required")
    @Size(min = 2, max = 50, message = "Choice name must be between 2 and 50 characters")
    private String choiceName;

    private String description;

    @NotNull(message = "Additional price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Additional price cannot be negative")
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    private Boolean isDefault = false;

    @NotNull(message = "Active status must be specified")
    private Boolean active = true;

    private String imagePath;
}