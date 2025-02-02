package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.PermissionDto;
import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.entity.User;
import com.letusbuild.restrorealm.repository.UserRepository;
import com.letusbuild.restrorealm.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.isDeleted()) {
            throw new IllegalStateException("User account is deactivated");
        }

        return user;
    }

    @Override
    public User getUserEntityById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found " + userId));
    }

    @Override
    public User createUser(User newUser) {
        return userRepository.save(newUser);
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public UserDto getUserById(Long userId) {
        User user = getUserEntityById(userId);
        UserDto userDto = modelMapper.map(user, UserDto.class);
        userDto.setPermissionDtoSet(
                user.getRole().getPermissions().stream()
                        .map(permission -> modelMapper.map(permission, PermissionDto.class))
                        .collect(Collectors.toSet()));
        return userDto;
    }
}

