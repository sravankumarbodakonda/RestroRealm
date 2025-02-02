package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.SiteConfigurationDto;
import com.letusbuild.restrorealm.service.SiteConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/configs")
public class SiteConfigurationController {
    private final SiteConfigurationService siteConfigurationService;

    @GetMapping("/{configId}")
    public ResponseEntity<SiteConfigurationDto> getConfigurationById(@PathVariable Long configId){
        return ResponseEntity.ok(siteConfigurationService.getConfigurationById(configId));
    }

    @GetMapping("/")
    public ResponseEntity<List<SiteConfigurationDto>> getAllSiteConfigurations(){
        return ResponseEntity.ok(siteConfigurationService.getAllConfigurations());
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_SITE_CONFIGURATION')")
    public ResponseEntity<SiteConfigurationDto> createSiteConfiguration(@RequestBody @Valid SiteConfigurationDto
                                                                                    siteConfigurationDto){
        return ResponseEntity.ok(siteConfigurationService.createConfiguration(siteConfigurationDto));
    }

    @PutMapping("/{configId}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_SITE_CONFIGURATION')")
    public ResponseEntity<SiteConfigurationDto> updateSiteConfiguration(@PathVariable Long configId
            , @RequestBody @Valid SiteConfigurationDto siteConfigurationDto){
        return ResponseEntity.ok(siteConfigurationService.updateConfiguration(configId,siteConfigurationDto));
    }

    @DeleteMapping("/{configId}")
    public ResponseEntity<String> deleteSiteConfiguration(@PathVariable Long configId){
        return ResponseEntity.ok(siteConfigurationService.deleteConfiguration(configId));
    }
}
