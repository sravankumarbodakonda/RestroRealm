package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "customization_option")
public class CustomizationOption extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Option name is required")
    @Size(min = 1, max = 50, message = "Option name must be between 1 and 50 characters")
    @Column(nullable = false)
    private String name;

    @Column
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    @Column
    private boolean isDefault = false;

    @Column
    private Double calories = 0.0;

    @ManyToOne
    @JoinColumn(name = "customization_id")
    @JsonIgnore
    private Customization customization;
}
