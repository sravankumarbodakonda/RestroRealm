package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.CustomizationDto;
import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.dto.MenuItemDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MenuItemService {
    MenuItemDto getMenuItemById(Long menuItemId);

    List<MenuItemDto> getAllMenuItems();

    MenuItemDto createMenuItem(MenuItemDto menuItemDto);

    MenuItemDto createMenuItem(MenuItemDto menuItemDto, MultipartFile imageFile);

    MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto);

    MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto, MultipartFile imageFile);

    List<MenuItemDto> getMenuItemsByCategoryName(String categoryName);

    void deleteMenuItem(Long menuItemId);

    // New methods for enhanced functionality
    MenuItemDto addAddOnToMenuItem(Long menuItemId, Long addOnId);

    MenuItemDto removeAddOnFromMenuItem(Long menuItemId, Long addOnId);

    List<MenuItemDto> searchMenuItems(String keyword);

    List<MenuAddOnDto> getAddOnsByMenuItem(Long menuItemId);

    List<CustomizationDto> getCustomizationsByMenuItem(Long menuItemId);
}
