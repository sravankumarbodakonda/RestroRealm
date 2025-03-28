package com.letusbuild.restrorealm.dto;

import com.letusbuild.restrorealm.entity.Enum.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequestDto {
    private Long tableId;
    private String orderNumber;
    private String customerName;
    private String street1;
    private String street2;
    private String city;
    private String state;
    private String postalCode;
    private List<OrderItemRequestDto> orderItems;
    private OrderStatus status;
}

