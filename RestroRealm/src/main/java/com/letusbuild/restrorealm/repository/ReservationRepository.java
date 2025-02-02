package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.Enum.ReservationStatus;
import com.letusbuild.restrorealm.entity.ReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {

    // Find all reservations for a specific table
    List<ReservationEntity> findByTableId(Long tableId);

    // Find all reservations on a specific date
    List<ReservationEntity> findByReservationDate(LocalDate reservationDate);

    // Find reservations for a specific table on a specific date
    List<ReservationEntity> findByTableIdAndReservationDate(Long tableId, LocalDate reservationDate);

    // Find active reservations for a specific table on a specific date
    List<ReservationEntity> findByTableIdAndReservationDateAndStatus(Long tableId, LocalDate reservationDate, ReservationStatus status);
}

