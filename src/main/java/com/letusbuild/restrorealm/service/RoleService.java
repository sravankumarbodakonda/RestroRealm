package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.AddPermissionToRoleRequestDto;
import com.letusbuild.restrorealm.dto.RoleDto;
import com.letusbuild.restrorealm.entity.Role;

import java.util.List;

public interface RoleService {
    RoleDto getByRoleName(String name);

    RoleDto createRole(RoleDto roleDto);

    RoleDto updateRole(Long roleId, RoleDto roleDto);

    RoleDto getRoleById(Long roleId);

    List<RoleDto> getAllRoles();

    RoleDto addPermissionToRole(AddPermissionToRoleRequestDto addPermissionToRoleRequestDto);
    RoleDto removePermissionToRole(AddPermissionToRoleRequestDto addPermissionToRoleRequestDto);
}
