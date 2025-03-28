package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TableRepository extends JpaRepository<TableEntity,Long> {
    @Query("SELECT t.id FROM TableEntity t WHERE t.capacity >= :numGuests AND t.reservable = true AND t.deleted = false AND t.id NOT IN (SELECT r.table.id FROM ReservationEntity r WHERE r.reservationDate = :date AND r.reservationTime = :time)")
    List<Long> findAvailableTables(LocalDate date, LocalTime time, int numGuests);
}
