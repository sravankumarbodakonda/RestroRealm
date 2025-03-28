package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Enum.OrderStatus;
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
    private String orderNumber;
    private String customerName;
    private String tableName;
    private List<OrderItemResponseDto> orderItems;
    private String street1;
    private String street2;
    private String city;
    private String state;
    private String postalCode;
    private Double totalAmount;
    private OrderStatus status;
//    private PaymentResponseDto payment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
