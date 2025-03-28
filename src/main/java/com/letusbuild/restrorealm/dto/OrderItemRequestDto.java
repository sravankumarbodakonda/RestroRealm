package com.letusbuild.restrorealm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemRequestDto {

    private Long menuItemId; // ID of the menu item

    private Integer quantity; // Quantity of the item
}
