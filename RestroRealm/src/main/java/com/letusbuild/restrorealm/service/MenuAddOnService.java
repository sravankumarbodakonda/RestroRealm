package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.MenuAddOnDto;

import java.util.List;

public interface MenuAddOnService {
    MenuAddOnDto getMenuAddOnById(Long menuAddOnId);
    List<MenuAddOnDto> getAllMenuAddOns();
    MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto);
    MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto);
}
