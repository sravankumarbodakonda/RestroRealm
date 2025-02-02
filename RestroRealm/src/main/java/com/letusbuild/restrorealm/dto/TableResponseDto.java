package com.letusbuild.restrorealm.dto;

import lombok.Data;

@Data
public class TableResponseDto {

    private Long id;
    private int capacity;
    private String tableNumber;
    private boolean reservable;
    private boolean deleted;
    private String metadata;
}
