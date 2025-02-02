package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.AddPermissionToRoleRequestDto;
import com.letusbuild.restrorealm.dto.RoleDto;
import com.letusbuild.restrorealm.entity.Permission;
import com.letusbuild.restrorealm.entity.Role;
import com.letusbuild.restrorealm.repository.RoleRepository;
import com.letusbuild.restrorealm.service.PermissionService;
import com.letusbuild.restrorealm.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {
    private final ModelMapper modelMapper;

    private final RoleRepository roleRepository;
    private final PermissionService permissionService;

    @Override
    public RoleDto getByRoleName(String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Role Name - "+name+" not found"));
        return modelMapper.map(role, RoleDto.class);
    }

    @Override
    public RoleDto createRole(RoleDto roleDto) {
        Role role = modelMapper.map(roleDto, Role.class);
        Role savedRole = roleRepository.save(role);
        return modelMapper.map(savedRole, RoleDto.class);
    }

    @Override
    public RoleDto updateRole(Long roleId, RoleDto roleDto) {
        Role existingRole = modelMapper.map(getRoleById(roleId), Role.class);
        existingRole.setDescription(roleDto.getDescription());
        existingRole.setName(roleDto.getName());
        Role savedRole = roleRepository.save(existingRole);
        return modelMapper.map(savedRole, RoleDto.class);
    }

    @Override
    public RoleDto getRoleById(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role Id "+roleId+" not found"));
        return modelMapper.map(role, RoleDto.class);
    }

    @Override
    public List<RoleDto> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream()
                .map(role -> modelMapper.map(role, RoleDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public RoleDto addPermissionToRole(AddPermissionToRoleRequestDto addPermissionToRoleRequestDto) {
        Role role = modelMapper.map(getRoleById(addPermissionToRoleRequestDto.getRoleId()), Role.class);
        Permission permission = modelMapper.map(permissionService
                .getPermissionById(addPermissionToRoleRequestDto.getPermissionId()), Permission.class);
        role.getPermissions().add(permission);
        Role updatedRole = roleRepository.save(role);
        return modelMapper.map(updatedRole, RoleDto.class);
    }

    @Override
    public RoleDto removePermissionToRole(AddPermissionToRoleRequestDto addPermissionToRoleRequestDto) {
        Role role = modelMapper.map(getRoleById(addPermissionToRoleRequestDto.getRoleId()), Role.class);
        Permission permission = modelMapper.map(permissionService
                .getPermissionById(addPermissionToRoleRequestDto.getPermissionId()), Permission.class);
        if (role.getPermissions().contains(permission)) {
            role.getPermissions().remove(permission);
        } else {
            throw new IllegalArgumentException("Permission does not exist in the role");
        }
        Role updatedRole = roleRepository.save(role);
        return modelMapper.map(updatedRole, RoleDto.class);
    }
}
