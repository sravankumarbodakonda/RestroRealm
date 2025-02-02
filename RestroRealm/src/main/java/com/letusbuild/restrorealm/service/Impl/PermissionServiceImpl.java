package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.PermissionDto;
import com.letusbuild.restrorealm.entity.Permission;
import com.letusbuild.restrorealm.repository.PermissionRepository;
import com.letusbuild.restrorealm.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {
    private final PermissionRepository permissionRepository;
    private final ModelMapper modelMapper;

    @Override
    public PermissionDto getPermissionById(Long permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission Id - "+permissionId+" not found"));
        return modelMapper.map(permission, PermissionDto.class);
    }

    @Override
    public PermissionDto createPermission(PermissionDto permissionDto) {
        Permission permission = modelMapper.map(permissionDto, Permission.class);
        Permission savedPermission = permissionRepository.save(permission);
        return modelMapper.map(savedPermission, PermissionDto.class);
    }

    @Override
    public PermissionDto updatePermission(Long permissionId, PermissionDto permissionDto) {
        Permission existingPermission = modelMapper.map(getPermissionById(permissionId), Permission.class);
        existingPermission.setPermissionCode(permissionDto.getPermissionCode());
        existingPermission.setName(permissionDto.getName());
        existingPermission.setDescription(permissionDto.getDescription());
        Permission savedPermission = permissionRepository.save(existingPermission);
        return modelMapper.map(savedPermission, PermissionDto.class);
    }

    @Override
    public List<PermissionDto> getAllPermissions() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(permission -> modelMapper.map(permission, PermissionDto.class))
                .collect(Collectors.toList());
    }
}
