package com.letusbuild.restrorealm.service;
import com.letusbuild.restrorealm.dto.OrderRequestDto;
import com.letusbuild.restrorealm.dto.OrderResponseDto;


import java.util.List;

public interface OrderService {

    OrderResponseDto createOrder(OrderRequestDto orderRequestDto);

    OrderResponseDto getOrderById(Long orderId);

    List<OrderResponseDto> getAllOrders();

    OrderResponseDto updateOrderStatus(Long orderId, String status);

    void cancelOrder(Long orderId);
}
