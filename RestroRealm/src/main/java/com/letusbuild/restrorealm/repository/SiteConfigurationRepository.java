package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.SiteConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteConfigurationRepository extends JpaRepository<SiteConfiguration, Long> {

}
