package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.MenuOptionDto;

import java.util.List;

public interface MenuOptionService {
    MenuOptionDto getMenuOptionById(Long menuOptionId);
    List<MenuOptionDto> getAllMenuOptions();
    MenuOptionDto createMenuOption(MenuOptionDto menuOptionDto);
    MenuOptionDto updateMenuOption(Long menuOptionId, MenuOptionDto menuOptionDto);
}
