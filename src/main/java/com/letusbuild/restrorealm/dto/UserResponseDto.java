package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Role;
import lombok.Data;

import java.util.Date;

@Data
public class UserResponseDto {
    private Long userId;
    private String name;
    private String email;
    private Date dateOfBirth;
    private Role role;
    private String profileImageUrl;
}
