package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.TableRequestDto;
import com.letusbuild.restrorealm.dto.TableResponseDto;
import com.letusbuild.restrorealm.entity.TableEntity;
import com.letusbuild.restrorealm.repository.TableRepository;
import com.letusbuild.restrorealm.service.TableService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepository;
    private final ModelMapper modelMapper;

    public List<TableResponseDto> getAllTables() {
        return tableRepository.findAll().stream()
                .map(table -> modelMapper.map(table, TableResponseDto.class))
                .collect(Collectors.toList());
    }

    public TableResponseDto getTableById(Long id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Table not found with id: " + id));
        return modelMapper.map(table, TableResponseDto.class);
    }

    public TableResponseDto createTable(TableRequestDto tableRequestDTO) {
        TableEntity table = modelMapper.map(tableRequestDTO, TableEntity.class);
        TableEntity savedTable = tableRepository.save(table);
        return modelMapper.map(savedTable, TableResponseDto.class);
    }

    public TableResponseDto updateTable(Long id, TableRequestDto tableRequestDTO) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Table not found with id: " + id));

        modelMapper.map(tableRequestDTO, table);
        TableEntity updatedTable = tableRepository.save(table);
        return modelMapper.map(updatedTable, TableResponseDto.class);
    }

    public void deleteTable(Long id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Table not found with id: " + id));

        table.setDeleted(true);
        tableRepository.save(table);
    }
}
