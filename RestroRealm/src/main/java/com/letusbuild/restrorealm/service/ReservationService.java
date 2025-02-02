package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.ReservationRequestDto;
import com.letusbuild.restrorealm.dto.ReservationResponseDto;

import java.time.LocalDate;
import java.util.List;

public interface ReservationService {

    // Create a new reservation
    ReservationResponseDto createReservation(ReservationRequestDto reservationRequestDTO);

    // Get all reservations
    List<ReservationResponseDto> getAllReservations();

    // Get reservations by table ID
    List<ReservationResponseDto> getReservationsByTable(Long tableId);

    // Get reservations by date
    List<ReservationResponseDto> getReservationsByDate(LocalDate date);

    // Update an existing reservation
    ReservationResponseDto updateReservation(Long reservationId, ReservationRequestDto reservationRequestDTO);

    // Cancel a reservation
    void cancelReservation(Long reservationId);
}

