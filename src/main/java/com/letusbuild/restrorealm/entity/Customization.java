package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "customization")
public class Customization extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Customization name is required")
    @Size(min = 3, max = 50, message = "Customization name must be between 3 and 50 characters")
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean isRequired = false;

    @Column(nullable = false)
    private boolean isMultipleSelectionsAllowed = false;

    @OneToMany(mappedBy = "customization", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomizationOption> options = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    @JsonBackReference
    private MenuItem menuItem;
}
