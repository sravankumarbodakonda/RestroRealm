package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.AvailabilityResponseDto;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
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
        TableEntity table = tableRepository.findById(reservationRequestDTO.getTableId())
                .orElseThrow(() -> new RuntimeException("Table not found with ID: " + reservationRequestDTO.getTableId()));

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
        ReservationEntity reservation = new ReservationEntity();
        reservation.setTable(table);
        reservation.setCustomerName(reservationRequestDTO.getCustomerName());
        reservation.setCustomerContact(reservationRequestDTO.getCustomerContact());
        reservation.setEmail(reservationRequestDTO.getEmail());
        reservation.setNumGuests(reservationRequestDTO.getNumGuests());
        reservation.setReservationDate(reservationRequestDTO.getReservationDate());
        reservation.setReservationTime(reservationRequestDTO.getReservationTime());
        reservation.setDuration(reservationRequestDTO.getDuration());
        reservation.setStatus(ReservationStatus.ACTIVE);

        ReservationEntity savedReservation = reservationRepository.save(reservation);

        return modelMapper.map(savedReservation, ReservationResponseDto.class);
    }

    private boolean overlaps(ReservationEntity existingReservation, ReservationRequestDto request) {
        LocalTime existingStart = existingReservation.getReservationTime();
        LocalTime existingEnd = existingStart.plusHours(existingReservation.getDuration());

        LocalTime requestedStart = request.getReservationTime();
        LocalTime requestedEnd = requestedStart.plusHours(request.getDuration());
        return !(requestedEnd.isBefore(existingStart) || requestedStart.isAfter(existingEnd));
    }

    @Override
    public List<ReservationResponseDto> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReservationResponseDto> getMyReservations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return reservationRepository.findByEmail(email)
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReservationResponseDto> getReservationsByTable(Long tableId) {
        return reservationRepository.findByTableId(tableId)
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<ReservationResponseDto> getReservationsByDate(LocalDate date) {
        return reservationRepository.findByReservationDate(date)
                .stream()
                .map(reservation -> modelMapper.map(reservation, ReservationResponseDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReservationResponseDto updateReservation(Long reservationId, ReservationRequestDto reservationRequestDTO) {
        ReservationEntity existingReservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        List<ReservationEntity> existingReservations = reservationRepository.findByTableIdAndReservationDateAndStatus(
                existingReservation.getTable().getId(),
                reservationRequestDTO.getReservationDate(),
                ReservationStatus.ACTIVE
        );
        boolean hasOverlap = existingReservations.stream()
                .filter(reservation -> !reservation.getId().equals(existingReservation.getId()))
                .anyMatch(reservation -> overlaps(reservation, reservationRequestDTO));

        if (hasOverlap) {
            throw new RuntimeException("Table is already reserved for the requested time.");
        }
        existingReservation.setCustomerName(reservationRequestDTO.getCustomerName());
        existingReservation.setCustomerContact(reservationRequestDTO.getCustomerContact());
        existingReservation.setReservationDate(reservationRequestDTO.getReservationDate());
        existingReservation.setReservationTime(reservationRequestDTO.getReservationTime());
        existingReservation.setDuration(reservationRequestDTO.getDuration());
        ReservationEntity updatedReservation = reservationRepository.save(existingReservation);
        return modelMapper.map(updatedReservation, ReservationResponseDto.class);
    }


    @Override
    public void cancelReservation(Long reservationId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("ReservationEntity not found"));

        reservation.setStatus(ReservationStatus.CANCELED);
        reservationRepository.save(reservation);
    }

    public AvailabilityResponseDto getAvailableTimeSlots(LocalDate date, Long tableId, int numGuests) {
        List<LocalTime> allSlots = generateTimeSlots(LocalTime.of(10, 0), LocalTime.of(22, 0), 30);
        List<ReservationEntity> reservations = reservationRepository.findByReservationDateAndTableAndCapacity(date, tableId, numGuests);
        List<LocalTime> availableSlots = new ArrayList<>(allSlots);
        for (ReservationEntity reservation : reservations) {
            LocalTime startTime = reservation.getReservationTime();
            LocalTime endTime = startTime.plusHours(reservation.getDuration());
            availableSlots.removeIf(slot -> !slot.isBefore(startTime) && slot.isBefore(endTime));
        }

        return new AvailabilityResponseDto(availableSlots, "Available slots retrieved successfully.");
    }

    private List<LocalTime> generateTimeSlots(LocalTime start, LocalTime end, int intervalMinutes) {
        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = start;
        while (current.isBefore(end) || current.equals(end)) {
            slots.add(current);
            current = current.plusMinutes(intervalMinutes);
        }
        return slots;
    }

    public List<Long> getAvailableTables(LocalDate date, LocalTime time, int numGuests) {
        return tableRepository.findAvailableTables(date, time, numGuests);
    }
}

