package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.letusbuild.restrorealm.entity.Enum.SpiceLevel;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "menu_add_on")
public class MenuAddOn extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String addOnName;

    @Column(length = 500)
    @Size(max = 500)
    private String description;

    @Column(nullable = false)
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal addOnPrice;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private boolean isSuggested;

    @ManyToOne
    @JsonBackReference
    private MenuItem menuItem;

    @Column
    private String imagePath;

    @Column
    @DecimalMin(value = "0.0", inclusive = true)
    private Double calories = 0.0;

    @Column(nullable = false)
    private boolean isVegetarian = false;

    @Column
    @Enumerated(EnumType.STRING)
    private SpiceLevel spiceLevel = SpiceLevel.NONE;

    @ElementCollection
    @CollectionTable(name = "menu_addon_allergens",
            joinColumns = @JoinColumn(name = "addon_id"))
    @Column(name = "allergen")
    private List<String> allergens = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "menu_addon_category",
            joinColumns = @JoinColumn(name = "addon_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories = new ArrayList<>();
}
