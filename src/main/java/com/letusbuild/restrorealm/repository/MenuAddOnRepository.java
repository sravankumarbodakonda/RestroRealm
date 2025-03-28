package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.MenuAddOn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuAddOnRepository extends JpaRepository<MenuAddOn, Long> {
}
