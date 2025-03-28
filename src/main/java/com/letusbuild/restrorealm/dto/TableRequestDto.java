package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class TableRequestDto {

    @Min(1)
    private int capacity;

    private String tableNumber;

    private boolean reservable;

    private String metadata;
}