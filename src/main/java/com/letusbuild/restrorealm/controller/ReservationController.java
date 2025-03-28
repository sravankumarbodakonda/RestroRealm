package com.letusbuild.restrorealm.controller;
import com.letusbuild.restrorealm.dto.AvailabilityResponseDto;
import com.letusbuild.restrorealm.dto.ReservationRequestDto;
import com.letusbuild.restrorealm.dto.ReservationResponseDto;
import com.letusbuild.restrorealm.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;


    @PostMapping
    public ResponseEntity<ReservationResponseDto> createReservation(
            @Valid @RequestBody ReservationRequestDto reservationRequestDTO) {
        ReservationResponseDto createdReservation = reservationService.createReservation(reservationRequestDTO);
        return ResponseEntity.ok(createdReservation);
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponseDto>> getAllReservations() {
        List<ReservationResponseDto> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ReservationResponseDto>> getMyReservations() {
        List<ReservationResponseDto> reservations = reservationService.getMyReservations();
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByTable(@PathVariable Long tableId) {
        List<ReservationResponseDto> reservations = reservationService.getReservationsByTable(tableId);
        return ResponseEntity.ok(reservations);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByDate(@PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date); // Parse the date string
        List<ReservationResponseDto> reservations = reservationService.getReservationsByDate(localDate);
        return ResponseEntity.ok(reservations);
    }

    @PutMapping("/{reservationId}")
    public ResponseEntity<ReservationResponseDto> updateReservation(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationRequestDto reservationRequestDTO) {
        ReservationResponseDto updatedReservation = reservationService.updateReservation(reservationId, reservationRequestDTO);
        return ResponseEntity.ok(updatedReservation);
    }

    @DeleteMapping("/{reservationId}")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long reservationId) {
        reservationService.cancelReservation(reservationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponseDto> checkAvailableTimeSlots(
            @RequestParam String date,
            @RequestParam Long tableId,
            @RequestParam int numGuests) {
        LocalDate reservationDate = LocalDate.parse(date);
        AvailabilityResponseDto availability = reservationService.getAvailableTimeSlots(reservationDate, tableId, numGuests);
        return ResponseEntity.ok(availability);
    }

    // 2. Check table availability for a specific time slot
    @GetMapping("/tables-availability")
    public ResponseEntity<List<Long>> getAvailableTables(
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam int numGuests) {
        LocalDate reservationDate = LocalDate.parse(date);
        LocalTime reservationTime = LocalTime.parse(time);
        List<Long> availableTables = reservationService.getAvailableTables(reservationDate, reservationTime, numGuests);
        return ResponseEntity.ok(availableTables);
    }
}

