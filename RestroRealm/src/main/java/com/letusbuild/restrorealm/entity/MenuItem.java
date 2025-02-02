package com.letusbuild.restrorealm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "menu_item")
public class MenuItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private Double basePrice;

    @Column
    private String imagePath;

    @Column(nullable = false)
    private boolean isRestricted;

    @Column(nullable = false)
    private boolean isAvailable;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories;

    @ManyToOne
    private Category category;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL)
    private List<Customization> customizations;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL)
    private List<MenuAddOn> addOns;
}
