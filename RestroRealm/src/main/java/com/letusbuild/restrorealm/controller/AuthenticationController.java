package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.AuthResponseDto;
import com.letusbuild.restrorealm.dto.LoginDto;
import com.letusbuild.restrorealm.dto.SignUpDto;
import com.letusbuild.restrorealm.dto.UserDto;
import com.letusbuild.restrorealm.service.AuthenticationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/signup")
    public ResponseEntity<UserDto> signUp(@RequestBody @Valid SignUpDto signUp){
        return ResponseEntity.ok(authenticationService.signUp(signUp));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody @Valid LoginDto login, HttpServletResponse response){
        AuthResponseDto authResponseDto = authenticationService.login(login);
        Cookie cookie = new Cookie("refreshToken", authResponseDto.getRefreshToken());
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
        return ResponseEntity.ok(authResponseDto);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(HttpServletRequest request){
        String refreshToken = Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals("refreshToken"))
                .findFirst()
                .map(cookie -> cookie.getValue())
                .orElseThrow(() -> new AuthenticationServiceException("Refresh token not found"));
        return ResponseEntity.ok(authenticationService.generateAccessToken(refreshToken));
    }

    @GetMapping("/validate/{accessToken}")
    public ResponseEntity<UserDto> validate(@PathVariable String accessToken){
        return ResponseEntity.ok(authenticationService.validateToken(accessToken));
    }

}
