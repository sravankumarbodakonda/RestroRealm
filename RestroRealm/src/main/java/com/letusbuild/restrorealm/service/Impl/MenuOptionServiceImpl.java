package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.MenuOptionDto;
import com.letusbuild.restrorealm.entity.MenuOption;
import com.letusbuild.restrorealm.repository.MenuOptionRepository;
import com.letusbuild.restrorealm.service.MenuOptionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuOptionServiceImpl implements MenuOptionService {
    private final MenuOptionRepository menuOptionRepository;
    private final ModelMapper modelMapper;

    @Override
    public MenuOptionDto getMenuOptionById(Long menuOptionId) {
        MenuOption menuOption = menuOptionRepository.findById(menuOptionId)
                .orElseThrow(() -> new RuntimeException("Menu Option Id - " + menuOptionId+ " not found"));
        return modelMapper.map(menuOption, MenuOptionDto.class);
    }

    @Override
    public List<MenuOptionDto> getAllMenuOptions() {
        List<MenuOption> menuOptions = menuOptionRepository.findAll();
        return menuOptions.stream()
                .map(menuOption -> modelMapper.map(menuOption, MenuOptionDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public MenuOptionDto createMenuOption(MenuOptionDto menuOptionDto) {
        MenuOption menuOption = modelMapper.map(menuOptionDto, MenuOption.class);
        menuOption.setImagePath(menuOptionDto.getImagePath());
        MenuOption savedOption = menuOptionRepository.save(menuOption);
        return modelMapper.map(savedOption, MenuOptionDto.class);
    }

    @Override
    public MenuOptionDto updateMenuOption(Long menuOptionId, MenuOptionDto menuOptionDto) {
        MenuOption existingMenuOption = modelMapper.map(getMenuOptionById(menuOptionId), MenuOption.class);
        existingMenuOption.setName(menuOptionDto.getName());
        existingMenuOption.setPrice(menuOptionDto.getPrice());
        existingMenuOption.setCalories(menuOptionDto.getCalories());
        if (menuOptionDto.getImagePath() != null) {
            existingMenuOption.setImagePath(menuOptionDto.getImagePath());
        }
        MenuOption updatedMenuOption = menuOptionRepository.save(existingMenuOption);
        return modelMapper.map(updatedMenuOption, MenuOptionDto.class);
    }
}
