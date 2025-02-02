package com.letusbuild.restrorealm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDto {

    private Long orderId;

    private String customerName;

    private String tableName; // Table name for easier identification

    private List<OrderItemResponseDto> orderItems; // List of ordered items

    private Double totalAmount;

    private String status; // Status of the order (e.g., Pending, Completed)

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
