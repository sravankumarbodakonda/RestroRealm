package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.MenuOptionDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MenuOptionService {

    MenuOptionDto getMenuOptionById(Long menuOptionId);

    List<MenuOptionDto> getAllMenuOptions();

    List<MenuOptionDto> getAllActiveMenuOptions();

    MenuOptionDto createMenuOption(MenuOptionDto menuOptionDto, MultipartFile image, String imageUrl);

    MenuOptionDto updateMenuOption(Long menuOptionId, MenuOptionDto menuOptionDto, MultipartFile image, String imageUrl);

    void deleteMenuOption(Long menuOptionId);
}
