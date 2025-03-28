package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "menu_option_choices")
public class MenuOptionChoice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String choiceName;

    @Column(length = 200)
    private String description;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    @Column
    private Boolean isDefault = false;

    @Column(nullable = false)
    private Boolean active = true;

    @Column
    private String imagePath;

    @ManyToOne
    @JoinColumn(name = "menu_option_id")
    @JsonBackReference
    private MenuOption menuOption;
}
