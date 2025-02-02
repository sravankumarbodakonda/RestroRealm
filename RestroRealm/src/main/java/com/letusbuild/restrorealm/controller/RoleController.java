package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.AddPermissionToRoleRequestDto;
import com.letusbuild.restrorealm.dto.RoleDto;
import com.letusbuild.restrorealm.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/role")
public class RoleController {
    private final RoleService roleService;

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_ROLE')")
    public ResponseEntity<RoleDto> createRole(@RequestBody @Valid RoleDto roleDto){
        return ResponseEntity.ok(roleService.createRole(roleDto));
    }

    @PutMapping("/{roleId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_ROLE')")
    public ResponseEntity<RoleDto> updateRole(@PathVariable Long roleId, @RequestBody @Valid RoleDto roleDto){
        return ResponseEntity.ok(roleService.updateRole(roleId, roleDto));
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_ROLE')")
    public ResponseEntity<RoleDto> getRoleById(@PathVariable Long roleId){
        return ResponseEntity.ok(roleService.getRoleById(roleId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_ROLES')")
    public ResponseEntity<List<RoleDto>> getAllRoles(){
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @PostMapping("/addPermission")
    @PreAuthorize("hasAuthority('ADD_PERMISSION_TO_ROLE')")
    public ResponseEntity<RoleDto> addPermissionToRole(@RequestBody @Valid AddPermissionToRoleRequestDto addPermissionToRoleRequestDto){
        return ResponseEntity.ok(roleService.addPermissionToRole(addPermissionToRoleRequestDto));
    }

    @PostMapping("/removePermission")
    @PreAuthorize("hasAuthority('REMOVE_PERMISSION_FROM_ROLE')")
    public ResponseEntity<RoleDto> removePermissionToRole(@RequestBody @Valid AddPermissionToRoleRequestDto addPermissionToRoleRequestDto){
        return ResponseEntity.ok(roleService.removePermissionToRole(addPermissionToRoleRequestDto));
    }
}
