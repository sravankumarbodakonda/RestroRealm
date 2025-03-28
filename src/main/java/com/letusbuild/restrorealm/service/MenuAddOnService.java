package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MenuAddOnService {
    MenuAddOnDto getMenuAddOnById(Long menuAddOnId);
    List<MenuAddOnDto> getAllMenuAddOns();
    MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto);
    MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto, MultipartFile imageFile);
    MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto);
    MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto, MultipartFile imageFile);
    void deleteMenuAddOn(Long menuAddOnId);
}