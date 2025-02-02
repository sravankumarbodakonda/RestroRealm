package com.letusbuild.restrorealm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "menu_add_on")
public class MenuAddOn extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String addOnName;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal addOnPrice;

    @Column(nullable = false)
    private boolean isSuggested;

    @ManyToOne
    private MenuItem menuItem;

    @Column
    private String imagePath;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories;
}
