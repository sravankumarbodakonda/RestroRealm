package com.letusbuild.restrorealm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
public class AvailabilityResponseDto {
    private List<LocalTime> availableSlots;
    private String message;
}
