package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddPermissionToRoleRequestDto {
    @NotNull(message = "Role Id cannot be empty")
    private Long roleId;

    @NotNull(message = "Permission Id cannot be empty")
    private Long permissionId;
}
