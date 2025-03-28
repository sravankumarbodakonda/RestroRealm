package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PermissionDto {
    private Long id;

    @NotBlank(message = "Permission Code is required")
    @Size(min = 3, max = 50, message = "Permission Code name must be between 3 and 50 characters")
    private String permissionCode;

    @NotBlank(message = "Permission name is required")
    @Size(min = 3, max = 50, message = "Permission name must be between 3 and 50 characters")
    private String name;

    private String description;

    private boolean deleted = false;
}
