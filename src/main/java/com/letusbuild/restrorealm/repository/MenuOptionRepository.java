package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.MenuOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuOptionRepository extends JpaRepository<MenuOption, Long> {

    @Query("SELECT o FROM MenuOption o WHERE o.active = true")
    List<MenuOption> findAllActive();

    List<MenuOption> findByActiveAndRequired(boolean active, boolean required);

    boolean existsByNameAndIdNot(String name, Long id);

    boolean existsByName(String name);
}
