package com.letusbuild.restrorealm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponseDto {

    private Long id;

    private Long tableId;

    private String customerName;

    private String customerContact;

    private String email;

    private Integer numGuests;

    private LocalDate reservationDate;

    private LocalTime reservationTime;

    private Integer duration;

    private String status;
}

