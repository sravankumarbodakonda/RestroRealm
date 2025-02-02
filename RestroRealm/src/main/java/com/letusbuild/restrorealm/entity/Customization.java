package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "customization")
public class Customization extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String type;

    @Column(nullable = false)
    private boolean isRequired;

    @ManyToOne
    private MenuItem menuItem;

    @OneToMany(mappedBy = "customization", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<MenuOption> menuOptions;
}
