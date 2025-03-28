package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.PermissionDto;
import com.letusbuild.restrorealm.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/permission")
public class PermissionController {
    private final PermissionService permissionService;

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_PERMISSION')")
    public ResponseEntity<PermissionDto> createPermission(@RequestBody @Valid PermissionDto permissionDto){
        return ResponseEntity.ok(permissionService.createPermission(permissionDto));
    }

    @PutMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_PERMISSION')")
    public ResponseEntity<PermissionDto> updatePermission(@PathVariable Long permissionId, @RequestBody @Valid PermissionDto permissionDto){
        return ResponseEntity.ok(permissionService.updatePermission(permissionId, permissionDto));
    }

    @GetMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('READ_SINGLE_PERMISSION')")
    public ResponseEntity<PermissionDto> getPermissionById(@PathVariable Long permissionId){
        return ResponseEntity.ok(permissionService.getPermissionById(permissionId));
    }

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_PERMISSIONS')")
    public ResponseEntity<List<PermissionDto>> getAllPermissions(){
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

}
