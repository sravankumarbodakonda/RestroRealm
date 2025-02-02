package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginDto {
    @NotBlank(message = "Password cannot be empty")
    private String password;

    @Email
    @NotBlank(message = "Email cannot be empty")
    private String email;
}
