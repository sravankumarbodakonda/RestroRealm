package com.letusbuild.restrorealm.service.Impl;
import com.letusbuild.restrorealm.dto.OrderItemRequestDto;
import com.letusbuild.restrorealm.dto.OrderItemResponseDto;
import com.letusbuild.restrorealm.entity.MenuItem;
import com.letusbuild.restrorealm.entity.Order;
import com.letusbuild.restrorealm.entity.OrderItem;
import com.letusbuild.restrorealm.repository.MenuItemRepository;
import com.letusbuild.restrorealm.repository.OrderItemRepository;
import com.letusbuild.restrorealm.repository.OrderRepository;
import com.letusbuild.restrorealm.service.OrderItemService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final ModelMapper modelMapper;

    public OrderItemServiceImpl(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                                MenuItemRepository menuItemRepository, ModelMapper modelMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public OrderItemResponseDto addOrderItem(Long orderId, OrderItemRequestDto orderItemRequestDto) {
        // Fetch the order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // Fetch the menu item
        MenuItem menuItem = menuItemRepository.findById(orderItemRequestDto.getMenuItemId())
                .orElseThrow(() -> new IllegalArgumentException("Menu Item not found"));

        // Create and save the order item
        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setMenuItem(menuItem);
        orderItem.setQuantity(orderItemRequestDto.getQuantity());
        orderItem.setPrice(menuItem.getBasePrice());

        OrderItem savedOrderItem = orderItemRepository.save(orderItem);

        return modelMapper.map(savedOrderItem, OrderItemResponseDto.class);
    }

    @Override
    public void removeOrderItem(Long orderItemId) {
        if (!orderItemRepository.existsById(orderItemId)) {
            throw new IllegalArgumentException("Order Item not found");
        }
        orderItemRepository.deleteById(orderItemId);
    }

    @Override
    public List<OrderItemResponseDto> getItemsByOrderId(Long orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        return orderItems.stream()
                .map(item -> modelMapper.map(item, OrderItemResponseDto.class))
                .collect(Collectors.toList());
    }
}

