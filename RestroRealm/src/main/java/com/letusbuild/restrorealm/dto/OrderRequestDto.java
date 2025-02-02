package com.letusbuild.restrorealm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequestDto {

    private Long tableId; // ID of the table placing the order

    private String customerName;

    private List<OrderItemRequestDto> orderItems; // List of items to be ordered
}

