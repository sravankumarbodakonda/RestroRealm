package com.letusbuild.restrorealm.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    private long userId;
    private String accessToken;
    private String refreshToken;
}
