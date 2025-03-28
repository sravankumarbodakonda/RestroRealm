package com.letusbuild.restrorealm.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderLineItemDto {
    private Long id;
    private String menuItem;
    private BigDecimal price;
    private Integer quantity;
    @JsonIgnore
    private OrderResponseDto order;
}
