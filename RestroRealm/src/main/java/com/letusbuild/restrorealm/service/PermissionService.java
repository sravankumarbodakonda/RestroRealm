package com.letusbuild.restrorealm.service;


import com.letusbuild.restrorealm.dto.PermissionDto;

import java.util.List;


public interface PermissionService {
    PermissionDto getPermissionById(Long permissionId);
    PermissionDto createPermission(PermissionDto permission);
    PermissionDto updatePermission(Long permissionId, PermissionDto permissionDto);
    List<PermissionDto> getAllPermissions();
}
