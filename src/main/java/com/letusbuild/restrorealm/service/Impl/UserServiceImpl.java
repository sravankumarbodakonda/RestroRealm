package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.PermissionDto;
import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.dto.UserResponseDto;
import com.letusbuild.restrorealm.dto.UserUpdateDto;
import com.letusbuild.restrorealm.entity.Role;
import com.letusbuild.restrorealm.entity.User;
import com.letusbuild.restrorealm.repository.UserRepository;
import com.letusbuild.restrorealm.service.RoleService;
import com.letusbuild.restrorealm.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;
    private final RoleService roleService;
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
        userDto.setRoleName(user.getRole().getName());
        userDto.setPermissionDtoSet(
                user.getRole().getPermissions().stream()
                        .map(permission -> modelMapper.map(permission, PermissionDto.class))
                        .collect(Collectors.toSet()));
        return userDto;
    }

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream().map(user -> modelMapper.map(user, UserResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDto getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return modelMapper.map(user, UserResponseDto.class);
    }

    @Override
    public UserResponseDto updateUser(Long id, UserUpdateDto userUpdateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(userUpdateDto.getName());
        user.setEmail(userUpdateDto.getEmail());
        user.setDateOfBirth(userUpdateDto.getDateOfBirth());
        Role role = modelMapper.map(roleService.getRoleById(userUpdateDto.getRoleId()), Role.class)  ;
        user.setRole(role);
        return modelMapper.map(userRepository.save(user), UserResponseDto.class);
    }

    @Override
    public UserResponseDto updateCurrentUser(UserUpdateDto userUpdateDto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(userUpdateDto.getName());
        user.setEmail(userUpdateDto.getEmail());
        return modelMapper.map(userRepository.save(user), UserResponseDto.class);
    }

    @Override
    public String uploadProfileImage(MultipartFile imageFile) {
        try {
            String uploadDir = "src/main/resources/static/images/profiles/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/images/profiles/" + fileName;
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setProfileImageUrl(imageUrl);
            userRepository.save(user);

            return imageUrl;
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeleted(true);
        userRepository.save(user);
    }
}

