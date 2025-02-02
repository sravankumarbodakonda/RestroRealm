package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.ReservationRequestDto;
import com.letusbuild.restrorealm.dto.ReservationResponseDto;
import com.letusbuild.restrorealm.entity.Enum.ReservationStatus;
import com.letusbuild.restrorealm.entity.ReservationEntity;
import com.letusbuild.restrorealm.entity.TableEntity;
import com.letusbuild.restrorealm.repository.ReservationRepository;
import com.letusbuild.restrorealm.repository.TableRepository;
import com.letusbuild.restrorealm.service.ReservationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final ModelMapper modelMapper;
    private final TableRepository tableRepository;

    @Override
    @Transactional
    public ReservationResponseDto createReservation(ReservationRequestDto reservationRequestDTO) {
        // Fetch the table entity to ensure it's managed
        TableEntity table = tableRepository.findById(reservationRequestDTO.getTableId())
                .orElseThrow(() -> new RuntimeException("Table not found with ID: " + reservationRequestDTO.getTableId()));

        // Check for overlapping reservations
        List<ReservationEntity> existingReservations = reservationRepository.findByTableIdAndReservationDateAndStatus(
                reservationRequestDTO.getTableId(),
                reservationRequestDTO.getReservationDate(),
                ReservationStatus.ACTIVE
        );

        boolean hasOverlap = existingReservations.stream()
                .anyMatch(existingReservation -> overlaps(existingReservation, reservationRequestDTO));

        if (hasOverlap) {
            throw new RuntimeException("Table is already reserved for the requested time.");
        }

        // Map DTO to Entity
        ReservationEntity reservation = new ReservationEntity();
        reservation.setTable(table); // Associate with the fetched table
        reservation.setCustomerName(reservationRequestDTO.getCustomerName());
        reservation.setCustomerContact(reservationRequestDTO.getCustomerContact());
        reservation.setReservationDate(reservationRequestDTO.getReservationDate());
        reservation.setReservationTime(reservationRequestDTO.getReservationTime());
        reservation.setDuration(reservationRequestDTO.getDuration());
        reservation.setStatus(ReservationStatus.ACTIVE);

        // Save the reservation explicitly
        ReservationEntity savedReservation = reservationRepository.save(reservation);

        // Map Entity to DTO
        return modelMapper.map(savedReservation, ReservationResponseDto.class);
    }





    private boolean overlaps(ReservationEntity existingReservation, ReservationRequestDto request) {
        LocalTime existingStart = existingReservation.getReservationTime();
        LocalTime existingEnd = existingStart.plusHours(existingReservation.getDuration());

        LocalTime requestedStart = request.getReservationTime();
        LocalTime requestedEnd = requestedStart.plusHours(request.getDuration());

        // Check for non-overlapping conditions:
        // 1. The requested reservation ends before the existing reservation starts.
        // 2. The requested reservation starts after the existing reservation ends.
        return !(requestedEnd.isBefore(existingStart) || requestedStart.isAfter(existingEnd));
    }

    @Override
    public List<ReservationResponseDto> getAllReservations() {
        // Fetch all reservations and map to DTOs
        return reservationRepository.findAll()
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReservationResponseDto> getReservationsByTable(Long tableId) {
        // Fetch reservations for the table and map to DTOs
        return reservationRepository.findByTableId(tableId)
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReservationResponseDto> getReservationsByDate(LocalDate date) {
        // Fetch reservations for the date and map to DTOs
        return reservationRepository.findByReservationDate(date)
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReservationResponseDto updateReservation(Long reservationId, ReservationRequestDto reservationRequestDTO) {
        // Find the existing reservation
        ReservationEntity existingReservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        // Fetch existing reservations for the same table, date, and active status
        List<ReservationEntity> existingReservations = reservationRepository.findByTableIdAndReservationDateAndStatus(
                existingReservation.getTable().getId(),
                reservationRequestDTO.getReservationDate(),
                ReservationStatus.ACTIVE
        );

        // Exclude the current reservation from the overlap check
        boolean hasOverlap = existingReservations.stream()
                .filter(reservation -> !reservation.getId().equals(existingReservation.getId()))
                .anyMatch(reservation -> overlaps(reservation, reservationRequestDTO));

        if (hasOverlap) {
            throw new RuntimeException("Table is already reserved for the requested time.");
        }

        // Update the reservation fields
        existingReservation.setCustomerName(reservationRequestDTO.getCustomerName());
        existingReservation.setCustomerContact(reservationRequestDTO.getCustomerContact());
        existingReservation.setReservationDate(reservationRequestDTO.getReservationDate());
        existingReservation.setReservationTime(reservationRequestDTO.getReservationTime());
        existingReservation.setDuration(reservationRequestDTO.getDuration());

        // Save the updated reservation
        ReservationEntity updatedReservation = reservationRepository.save(existingReservation);

        // Map to DTO
        return modelMapper.map(updatedReservation, ReservationResponseDto.class);
    }


    @Override
    public void cancelReservation(Long reservationId) {
        // Find the reservation
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("ReservationEntity not found"));

        // Mark as canceled
        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.save(reservation);
    }
}

