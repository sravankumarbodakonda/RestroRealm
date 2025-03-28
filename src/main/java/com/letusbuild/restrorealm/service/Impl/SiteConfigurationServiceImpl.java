package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.SiteConfigurationDto;
import com.letusbuild.restrorealm.entity.SiteConfiguration;
import com.letusbuild.restrorealm.repository.SiteConfigurationRepository;
import com.letusbuild.restrorealm.service.SiteConfigurationService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteConfigurationServiceImpl implements SiteConfigurationService {
    private final SiteConfigurationRepository siteConfigurationRepository;
    private final ModelMapper modelMapper;

    @Override
    public SiteConfigurationDto getConfigurationById(Long configId) {
        SiteConfiguration siteConfiguration = siteConfigurationRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Configuration Id - "+configId+" not found"));
        return modelMapper.map(siteConfiguration, SiteConfigurationDto.class);
    }

    @Override
    public List<SiteConfigurationDto> getAllConfigurations() {
        List<SiteConfiguration> siteConfigurations = siteConfigurationRepository.findAll();
        return siteConfigurations.stream()
                .map(siteConfiguration -> modelMapper.map(siteConfiguration, SiteConfigurationDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public SiteConfigurationDto createConfiguration(SiteConfigurationDto siteConfigurationDto) {
        SiteConfiguration siteConfiguration = modelMapper.map(siteConfigurationDto, SiteConfiguration.class);
        SiteConfiguration savedSiteConfiguration = siteConfigurationRepository.save(siteConfiguration);
        return modelMapper.map(savedSiteConfiguration, SiteConfigurationDto.class);
    }

    @Override
    public SiteConfigurationDto updateConfiguration(Long configId, SiteConfigurationDto siteConfigurationDto) {
        SiteConfiguration siteConfiguration = modelMapper.map(getConfigurationById(configId), SiteConfiguration.class);
        siteConfiguration.setConfigName(siteConfigurationDto.getConfigName());
        siteConfiguration.setConfigValue(siteConfigurationDto.getConfigValue());
        siteConfiguration.setDescription(siteConfigurationDto.getDescription());
        SiteConfiguration savedSiteConfiguration = siteConfigurationRepository.save(siteConfiguration);
        return modelMapper.map(savedSiteConfiguration, SiteConfigurationDto.class);
    }

    @Override
    public String deleteConfiguration(Long configId) {
        SiteConfiguration siteConfiguration = modelMapper.map(getConfigurationById(configId), SiteConfiguration.class);
        siteConfiguration.setDeleted(true);
        SiteConfiguration savedSiteConfiguration = siteConfigurationRepository.save(siteConfiguration);
        return "Deleted Successfully - " + modelMapper.map(savedSiteConfiguration, SiteConfigurationDto.class).toString();
    }
}
