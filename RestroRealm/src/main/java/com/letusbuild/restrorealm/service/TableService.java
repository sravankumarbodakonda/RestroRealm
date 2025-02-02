package com.letusbuild.restrorealm.service;


import com.letusbuild.restrorealm.dto.TableRequestDto;
import com.letusbuild.restrorealm.dto.TableResponseDto;

import java.util.List;

public interface TableService {
    List<TableResponseDto> getAllTables();

    TableResponseDto getTableById(Long id);

    TableResponseDto createTable(TableRequestDto tableRequestDTO);

    TableResponseDto updateTable(Long id, TableRequestDto tableRequestDTO);

    void deleteTable(Long id);
}
