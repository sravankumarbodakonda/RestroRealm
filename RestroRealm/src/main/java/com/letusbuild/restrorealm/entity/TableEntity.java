package com.letusbuild.restrorealm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "table_entity")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableEntity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int capacity;

    @Column
    private String tableNumber;

    @Column
    private boolean reservable;

    @Column
    private boolean deleted;

    @Column(columnDefinition = "TEXT")
    private String metadata;

//    @OneToMany(mappedBy = "table")
//    private List<ReservationEntity> reservations; // One table can have many reservations
}
