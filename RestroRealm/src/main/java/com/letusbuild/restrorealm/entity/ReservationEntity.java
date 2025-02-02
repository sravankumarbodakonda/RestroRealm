package com.letusbuild.restrorealm.entity;

import com.letusbuild.restrorealm.entity.Enum.ReservationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Many reservations can belong to one table
    @JoinColumn(name = "table_id", nullable = false) // Foreign key to TableEntity
    private TableEntity table;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerContact;

    @Column(nullable = false)
    private LocalDate reservationDate;

    @Column(nullable = false)
    private LocalTime reservationTime;

    @Column(nullable = false)
    private Integer duration; // Duration in hours

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationStatus status; // ACTIVE, CANCELED
}

