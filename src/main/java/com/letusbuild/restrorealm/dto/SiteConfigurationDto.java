package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteConfigurationDto {

    private Long id;

    @NotBlank(message = "Configuration name is mandatory")
    @Size(max = 100, message = "Configuration name must not exceed 100 characters")
    private String configName;

    @NotBlank(message = "Configuration value is mandatory")
    @Size(max = 255, message = "Configuration value must not exceed 255 characters")
    private String configValue;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private boolean deleted = false;
}
