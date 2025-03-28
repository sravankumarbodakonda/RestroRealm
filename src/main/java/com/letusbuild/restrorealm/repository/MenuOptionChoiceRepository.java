package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.MenuOptionChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuOptionChoiceRepository extends JpaRepository<MenuOptionChoice, Long> {

    List<MenuOptionChoice> findByMenuOptionId(Long menuOptionId);

    void deleteByMenuOptionId(Long menuOptionId);
}
