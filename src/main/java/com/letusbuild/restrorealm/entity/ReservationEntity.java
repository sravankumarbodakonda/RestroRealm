package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.letusbuild.restrorealm.entity.Enum.ReservationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    @JsonManagedReference
    private TableEntity table;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerContact;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Integer numGuests;

    @Column(nullable = false)
    private LocalDate reservationDate;

    @Column(nullable = false)
    private LocalTime reservationTime;

    @Column(nullable = false)
    private Integer duration;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;
}

