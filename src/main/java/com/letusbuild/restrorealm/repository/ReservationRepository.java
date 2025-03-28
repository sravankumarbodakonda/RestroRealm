package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.Enum.ReservationStatus;
import com.letusbuild.restrorealm.entity.ReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {

    @Query("SELECT DISTINCT r.reservationTime FROM ReservationEntity r WHERE r.reservationDate = :date AND r.table.capacity >= :numGuests")
    List<LocalTime> findAvailableTimeSlots(LocalDate date, int numGuests);

    @Query("SELECT r FROM ReservationEntity r WHERE r.reservationDate = :date AND r.table.id = :tableId AND r.table.capacity >= :numGuests")
    List<ReservationEntity> findByReservationDateAndTableAndCapacity(LocalDate date, Long tableId, int numGuests);
    List<ReservationEntity> findByTableId(Long tableId);
    List<ReservationEntity> findByReservationDate(LocalDate reservationDate);
    List<ReservationEntity> findByTableIdAndReservationDate(Long tableId, LocalDate reservationDate);
    List<ReservationEntity> findByTableIdAndReservationDateAndStatus(Long tableId, LocalDate reservationDate, ReservationStatus status);
    List<ReservationEntity> findByEmail(String email);
}

