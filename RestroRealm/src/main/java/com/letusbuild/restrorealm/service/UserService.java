package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.entity.User;

import java.util.Optional;

public interface UserService {
    User getUserEntityById(Long userId);

    User createUser(User newUser);

    Optional<User> getUserByEmail(String email);

    UserDto getUserById(Long userId);
}
