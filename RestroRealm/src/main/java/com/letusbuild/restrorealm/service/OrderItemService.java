package com.letusbuild.restrorealm.service;


import com.letusbuild.restrorealm.dto.OrderItemRequestDto;
import com.letusbuild.restrorealm.dto.OrderItemResponseDto;

import java.util.List;

public interface OrderItemService {

    OrderItemResponseDto addOrderItem(Long orderId, OrderItemRequestDto orderItemRequestDto);

    void removeOrderItem(Long orderItemId);

    List<OrderItemResponseDto> getItemsByOrderId(Long orderId);
}
