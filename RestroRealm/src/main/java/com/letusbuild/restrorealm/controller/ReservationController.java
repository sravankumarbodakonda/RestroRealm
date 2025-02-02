package com.letusbuild.restrorealm.controller;
import com.letusbuild.restrorealm.dto.ReservationRequestDto;
import com.letusbuild.restrorealm.dto.ReservationResponseDto;
import com.letusbuild.restrorealm.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;


    // Create a new reservation
    @PostMapping
    public ResponseEntity<ReservationResponseDto> createReservation(
            @Valid @RequestBody ReservationRequestDto reservationRequestDTO) {
        ReservationResponseDto createdReservation = reservationService.createReservation(reservationRequestDTO);
        return ResponseEntity.ok(createdReservation);
    }

    // Get all reservations
    @GetMapping
    public ResponseEntity<List<ReservationResponseDto>> getAllReservations() {
        List<ReservationResponseDto> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(reservations);
    }

    // Get reservations by table ID
    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByTable(@PathVariable Long tableId) {
        List<ReservationResponseDto> reservations = reservationService.getReservationsByTable(tableId);
        return ResponseEntity.ok(reservations);
    }

    // Get reservations by date
    @GetMapping("/date/{date}")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsByDate(@PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date); // Parse the date string
        List<ReservationResponseDto> reservations = reservationService.getReservationsByDate(localDate);
        return ResponseEntity.ok(reservations);
    }

    // Update an existing reservation
    @PutMapping("/{reservationId}")
    public ResponseEntity<ReservationResponseDto> updateReservation(
            @PathVariable Long reservationId,
            @Valid @RequestBody ReservationRequestDto reservationRequestDTO) {
        ReservationResponseDto updatedReservation = reservationService.updateReservation(reservationId, reservationRequestDTO);
        return ResponseEntity.ok(updatedReservation);
    }

    // Cancel a reservation
    @DeleteMapping("/{reservationId}")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long reservationId) {
        reservationService.cancelReservation(reservationId);
        return ResponseEntity.noContent().build();
    }
}

