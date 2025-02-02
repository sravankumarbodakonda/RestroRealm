package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Customization;
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
public class MenuOptionDto {

    private Long id;

    @NotBlank(message = "Customization Type is required")
    @Size(min = 3, max = 50, message = "Customization Type must be between 3 and 50 characters")
    private String name;

    private String description;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal price;

    private String imagePath;

    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories;

    private Customization customization;

    private boolean deleted;
}
