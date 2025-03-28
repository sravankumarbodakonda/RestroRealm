package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.SignUpDto;
import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.dto.UserResponseDto;
import com.letusbuild.restrorealm.dto.UserUpdateDto;
import com.letusbuild.restrorealm.service.AuthenticationService;
import com.letusbuild.restrorealm.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Controller
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final ModelMapper modelMapper;

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long userId){
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @GetMapping
//    @PreAuthorize("hasAuthority('READ_ALL_USERS')")
    public ResponseEntity<List<UserResponseDto>> getAllUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasAuthority('UPDATE_USER')")
    public ResponseEntity<UserResponseDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDto userUpdateDto) {
        return ResponseEntity.ok(userService.updateUser(id, userUpdateDto));
    }

    @PostMapping("/")
//    @PreAuthorize("hasAuthority('CREATE_USER')")
    public ResponseEntity<UserDto> createUserByPermission(@Valid @RequestBody UserUpdateDto userUpdateDto) {
        SignUpDto userDto = modelMapper.map(userUpdateDto, SignUpDto.class);
        userDto.setPassword("NoPassword@0987");
        return ResponseEntity.ok(authenticationService.signUp(userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDto> updateCurrentUser(@Valid @RequestBody UserUpdateDto userUpdateDto) {
        return ResponseEntity.ok(userService.updateCurrentUser(userUpdateDto));
    }

    @PutMapping(value = "/me/profile-image", consumes = { "multipart/form-data" })
    public ResponseEntity<String> uploadProfileImage(@RequestPart("image") MultipartFile imageFile) {
        return ResponseEntity.ok(userService.uploadProfileImage(imageFile));
    }

    @DeleteMapping("/{id}")
//    @PreAuthorize("hasAuthority('DELETE_USER')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully.");
    }
}
