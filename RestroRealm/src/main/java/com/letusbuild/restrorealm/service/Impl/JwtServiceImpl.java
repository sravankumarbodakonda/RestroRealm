package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.entity.Permission;
import com.letusbuild.restrorealm.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JwtServiceImpl {

    @Value("${jwt.secretKey}")
    private String jwtSecretKey;

    @Value("${jwt.accessExpirationTime}")
    private long accessExpirationTime;

    @Value("${jwt.refreshExpirationTime}")
    private long refreshExpirationTime;

    private SecretKey getSecretKey(){
        return Keys.hmacShaKeyFor(jwtSecretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateJwtAccessToken(User user){
        return Jwts.builder()
                .subject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().getName())
                .claim("permissions", getPermissionNames(user.getRole().getPermissions()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirationTime))
                .signWith(getSecretKey())
                .compact();
    }

    public String generateRefreshToken(User user){
        return Jwts.builder()
                .subject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().getName())
                .claim("permissions", getPermissionNames(user.getRole().getPermissions()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+ refreshExpirationTime))
                .signWith(getSecretKey())
                .compact();
    }

    public Long getUserIdFromToken(String token){
        Claims claim = Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.valueOf(claim.getSubject());
    }

    private List<String> getPermissionNames(Set<Permission> permissions){
        return permissions.stream().map(permission -> permission.getPermissionCode()).collect(Collectors.toList());
    }
}
