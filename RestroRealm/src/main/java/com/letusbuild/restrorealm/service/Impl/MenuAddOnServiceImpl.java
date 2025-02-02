package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.MenuAddOnDto;
import com.letusbuild.restrorealm.entity.MenuAddOn;
import com.letusbuild.restrorealm.repository.MenuAddOnRepository;
import com.letusbuild.restrorealm.service.MenuAddOnService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuAddOnServiceImpl implements MenuAddOnService {
    private final MenuAddOnRepository menuAddOnRepository;
    private final ModelMapper modelMapper;

    @Override
    public MenuAddOnDto getMenuAddOnById(Long menuAddOnId) {
        MenuAddOn menuAddOn = menuAddOnRepository.findById(menuAddOnId)
                .orElseThrow(() -> new RuntimeException("Menu Add-on Id - " + menuAddOnId +" not found"));
        return modelMapper.map(menuAddOn, MenuAddOnDto.class);
    }

    @Override
    public List<MenuAddOnDto> getAllMenuAddOns() {
        List<MenuAddOn> menuAddOns = menuAddOnRepository.findAll();
        return menuAddOns.stream()
                .map(menuAddOn -> modelMapper.map(menuAddOn,MenuAddOnDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public MenuAddOnDto createMenuAddOn(MenuAddOnDto menuAddOnDto) {
        MenuAddOn menuAddOn = modelMapper.map(menuAddOnDto, MenuAddOn.class);
        menuAddOn.setImagePath(menuAddOnDto.getImagePath());
        MenuAddOn savedMenuAddOn = menuAddOnRepository.save(menuAddOn);
        return modelMapper.map(savedMenuAddOn, MenuAddOnDto.class);
    }

    @Override
    public MenuAddOnDto updateMenuAddOn(Long menuAddOnId, MenuAddOnDto menuAddOnDto) {
        MenuAddOn existingMenuAddOn = modelMapper.map(getMenuAddOnById(menuAddOnId), MenuAddOn.class);
        existingMenuAddOn.setAddOnName(menuAddOnDto.getAddOnName());
        existingMenuAddOn.setAddOnPrice(menuAddOnDto.getAddOnPrice());
        existingMenuAddOn.setSuggested(menuAddOnDto.isSuggested());
        existingMenuAddOn.setCalories(menuAddOnDto.getCalories());
        if (menuAddOnDto.getImagePath() != null) {
            existingMenuAddOn.setImagePath(menuAddOnDto.getImagePath());
        }
        MenuAddOn updatedMenuAddOn = menuAddOnRepository.save(existingMenuAddOn);
        return modelMapper.map(updatedMenuAddOn, MenuAddOnDto.class);
    }
}
