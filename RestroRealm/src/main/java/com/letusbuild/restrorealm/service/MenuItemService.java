package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.MenuItemDto;

import java.util.List;

public interface MenuItemService {
    MenuItemDto getMenuItemById(Long menuItemId);
    List<MenuItemDto> getAllMenuItems();
    MenuItemDto createMenuItem(MenuItemDto menuItemDto);
    MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto);
}
