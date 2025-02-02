package com.letusbuild.restrorealm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "site_configuration")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteConfiguration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configName;

    @Column(nullable = false)
    private String configValue;

    @Column
    private String description;
}
