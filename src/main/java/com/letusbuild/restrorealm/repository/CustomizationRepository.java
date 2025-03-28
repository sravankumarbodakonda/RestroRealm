package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.Customization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomizationRepository extends JpaRepository<Customization, Long> {
    List<Customization> findByMenuItemId(Long menuItemId);
}