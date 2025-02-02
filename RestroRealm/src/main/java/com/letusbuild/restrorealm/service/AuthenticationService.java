package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.AuthResponseDto;
import com.letusbuild.restrorealm.dto.LoginDto;
import com.letusbuild.restrorealm.dto.SignUpDto;
import com.letusbuild.restrorealm.dto.UserDto;

public interface AuthenticationService {
    AuthResponseDto login(LoginDto login);
    UserDto signUp(SignUpDto signup);
    AuthResponseDto generateAccessToken(String refreshToken);

    UserDto validateToken(String accessToken);
}
