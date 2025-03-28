package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.SiteConfigurationDto;

import java.util.List;

public interface SiteConfigurationService {
    SiteConfigurationDto getConfigurationById(Long configId);
    List<SiteConfigurationDto> getAllConfigurations();
    SiteConfigurationDto createConfiguration(SiteConfigurationDto siteConfigurationDto);
    SiteConfigurationDto updateConfiguration(Long configId, SiteConfigurationDto siteConfigurationDto);
    String deleteConfiguration(Long configId);
}
