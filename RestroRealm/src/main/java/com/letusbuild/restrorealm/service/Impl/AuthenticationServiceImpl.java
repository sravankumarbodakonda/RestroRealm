package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.AuthResponseDto;
import com.letusbuild.restrorealm.dto.LoginDto;
import com.letusbuild.restrorealm.dto.SignUpDto;
import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.entity.Role;
import com.letusbuild.restrorealm.entity.User;
import com.letusbuild.restrorealm.repository.RoleRepository;
import com.letusbuild.restrorealm.service.AuthenticationService;
import com.letusbuild.restrorealm.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserService userService;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtServiceImpl jwtService;
    private final RoleRepository roleRepository;

    @Override
    public AuthResponseDto login(LoginDto login) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(login.getEmail(), login.getPassword()));
        User user = (User) authentication.getPrincipal();
        String accessToken = jwtService.generateJwtAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponseDto(
                user.getUserId(), accessToken, refreshToken
        );
    }

    @Override
    @Transactional
    public UserDto signUp(SignUpDto signup) {
        Role role = new Role();
        if(signup.getRoleId() == -1){
            role = roleRepository.findByName("User").orElseThrow(() -> new RuntimeException("No user role found"));
        } else {
            role = roleRepository.findById(signup.getRoleId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid role ID"));
        }
        Optional<User> user = userService.getUserByEmail(signup.getEmail());
        if(user.isPresent()){
            throw new BadCredentialsException("User already exists with email " + signup.getEmail());
        }

        User newUser = modelMapper.map(signup, User.class);
        newUser.setPassword(passwordEncoder.encode(signup.getPassword()));
        newUser.setRole(role);
        User savedUser = userService.createUser(newUser);
        return modelMapper.map(savedUser, UserDto.class);
    }

    @Override
    public AuthResponseDto generateAccessToken(String refreshToken) {
        Long userId = jwtService.getUserIdFromToken(refreshToken);
        User user = userService.getUserEntityById(userId);
        String accessToken = jwtService.generateJwtAccessToken(user);
        return new AuthResponseDto(userId, accessToken, refreshToken);
    }

    @Override
    public UserDto validateToken(String accessToken) {
        Long userId = jwtService.getUserIdFromToken(accessToken);
        return userService.getUserById(userId);
    }
}
