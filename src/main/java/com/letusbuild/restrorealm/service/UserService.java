package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.dto.UserResponseDto;
import com.letusbuild.restrorealm.dto.UserUpdateDto;
import com.letusbuild.restrorealm.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User getUserEntityById(Long userId);

    User createUser(User newUser);

    Optional<User> getUserByEmail(String email);

    UserDto getUserById(Long userId);

    List<UserResponseDto> getAllUsers();

    UserResponseDto updateUser(Long id, UserUpdateDto userUpdateDto);

    UserResponseDto getCurrentUser();

    UserResponseDto updateCurrentUser(UserUpdateDto userUpdateDto);

    String uploadProfileImage(MultipartFile imageFile);

    void deleteUser(Long id);

}
