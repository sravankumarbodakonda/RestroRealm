package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.AvailabilityResponseDto;
import com.letusbuild.restrorealm.dto.ReservationRequestDto;
import com.letusbuild.restrorealm.dto.ReservationResponseDto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationService {
    AvailabilityResponseDto getAvailableTimeSlots(LocalDate date, Long tableId, int numGuests);
    List<Long> getAvailableTables(LocalDate date, LocalTime time, int numGuests);
    ReservationResponseDto createReservation(ReservationRequestDto reservationRequestDTO);
    List<ReservationResponseDto> getAllReservations();
    List<ReservationResponseDto> getMyReservations();
    List<ReservationResponseDto> getReservationsByTable(Long tableId);
    List<ReservationResponseDto> getReservationsByDate(LocalDate date);
    ReservationResponseDto updateReservation(Long reservationId, ReservationRequestDto reservationRequestDTO);
    void cancelReservation(Long reservationId);
}

