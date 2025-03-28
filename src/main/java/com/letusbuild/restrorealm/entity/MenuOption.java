package com.letusbuild.restrorealm.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.letusbuild.restrorealm.entity.Enum.DisplayStyle;
import com.letusbuild.restrorealm.entity.Enum.SelectionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "menu_options")
public class MenuOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean required = false;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SelectionType selectionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisplayStyle displayStyle;

    @Column
    private Integer minSelect;

    @Column
    private Integer maxSelect;

    @Column
    private String imagePath;

    @Column
    private Integer position;

    @OneToMany(mappedBy = "menuOption", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<MenuOptionChoice> choices = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "menu_option_categories",
            joinColumns = @JoinColumn(name = "menu_option_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "customization_id")
    @JsonBackReference
    private Customization customization;

    public void addChoice(MenuOptionChoice choice) {
        choices.add(choice);
        choice.setMenuOption(this);
    }

    public void removeChoice(MenuOptionChoice choice) {
        choices.remove(choice);
        choice.setMenuOption(null);
    }
}
