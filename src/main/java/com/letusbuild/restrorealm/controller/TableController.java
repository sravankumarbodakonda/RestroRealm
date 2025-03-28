package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.TableRequestDto;
import com.letusbuild.restrorealm.dto.TableResponseDto;
import com.letusbuild.restrorealm.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping("/")
    @PreAuthorize("hasAuthority('READ_ALL_TABLES')")
    public List<TableResponseDto> getAllTables() {
        return tableService.getAllTables();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_SINGLE_TABLE')")
    public TableResponseDto getTableById(@PathVariable Long id) {
        return tableService.getTableById(id);
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('CREATE_TABLE')")
    public TableResponseDto createTable(@Valid @RequestBody TableRequestDto tableRequestDTO) {
        return tableService.createTable(tableRequestDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_SINGLE_TABLE')")
    public TableResponseDto updateTable(@PathVariable Long id, @Valid @RequestBody TableRequestDto tableRequestDTO) {
        return tableService.updateTable(id, tableRequestDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_SINGLE_TABLE')")
    public ResponseEntity<?> deleteTable(@PathVariable Long id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok().build();
    }
}
