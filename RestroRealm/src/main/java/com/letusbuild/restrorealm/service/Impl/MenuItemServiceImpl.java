package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.MenuItemDto;
import com.letusbuild.restrorealm.entity.Category;
import com.letusbuild.restrorealm.entity.MenuItem;
import com.letusbuild.restrorealm.repository.MenuItemRepository;
import com.letusbuild.restrorealm.service.CategoryService;
import com.letusbuild.restrorealm.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {
    private final MenuItemRepository menuItemRepository;
    private final CategoryService categoryService;
    private final ModelMapper modelMapper;

    @Override
    public MenuItemDto getMenuItemById(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu Item Id - " + menuItemId + " not found"));
        return modelMapper.map(menuItem, MenuItemDto.class);
    }

    @Override
    public List<MenuItemDto> getAllMenuItems() {
        List<MenuItem> menuItems = menuItemRepository.findAll();
        return menuItems.stream()
                .map(menuItem -> modelMapper.map(menuItem, MenuItemDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public MenuItemDto createMenuItem(MenuItemDto menuItemDto) {
        MenuItem menuItem = modelMapper.map(menuItemDto, MenuItem.class);
        System.out.println(menuItemDto);
        Category category = modelMapper.map(categoryService.getCategoryById(menuItemDto.getCategoryId()), Category.class);
        menuItem.setCategory(category);
        menuItem.setImagePath(menuItemDto.getImagePath());
        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return modelMapper.map(savedMenuItem, MenuItemDto.class);
    }

    @Override
    public MenuItemDto updateMenuItem(Long menuItemId, MenuItemDto menuItemDto) {
        MenuItem existingMenuItem = modelMapper.map(getMenuItemById(menuItemId), MenuItem.class);
        existingMenuItem.setName(menuItemDto.getName());
        existingMenuItem.setDescription(menuItemDto.getDescription());
        existingMenuItem.setBasePrice(menuItemDto.getBasePrice());
        existingMenuItem.setAvailable(menuItemDto.isAvailable());
        existingMenuItem.setRestricted(menuItemDto.isRestricted());
        existingMenuItem.setCalories(menuItemDto.getCalories());
        Category category = modelMapper.map(categoryService.getCategoryById(menuItemDto.getCategoryId()), Category.class);
        existingMenuItem.setCategory(category);
        if (menuItemDto.getImagePath() != null) {
            existingMenuItem.setImagePath(menuItemDto.getImagePath());
        }
        MenuItem updatedMenuItem = menuItemRepository.save(existingMenuItem);
        return modelMapper.map(updatedMenuItem, MenuItemDto.class);
    }
}
