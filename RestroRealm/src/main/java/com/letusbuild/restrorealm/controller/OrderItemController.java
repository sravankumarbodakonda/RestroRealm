package com.letusbuild.restrorealm.controller;


import com.letusbuild.restrorealm.dto.OrderItemRequestDto;
import com.letusbuild.restrorealm.dto.OrderItemResponseDto;
import com.letusbuild.restrorealm.service.OrderItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/order-items")
public class OrderItemController {

    private final OrderItemService orderItemService;

    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
    }

    @PostMapping("/{orderId}")
    public ResponseEntity<OrderItemResponseDto> addOrderItem(@PathVariable Long orderId,
                                                             @RequestBody OrderItemRequestDto orderItemRequestDto) {
        OrderItemResponseDto addedItem = orderItemService.addOrderItem(orderId, orderItemRequestDto);
        return ResponseEntity.ok(addedItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeOrderItem(@PathVariable Long id) {
        orderItemService.removeOrderItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<List<OrderItemResponseDto>> getItemsByOrder(@PathVariable Long orderId) {
        List<OrderItemResponseDto> items = orderItemService.getItemsByOrderId(orderId);
        return ResponseEntity.ok(items);
    }
}

