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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderItemServiceImpl(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                                MenuItemRepository menuItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    @Transactional
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

        // Update the order's total amount
        double newTotal = order.getTotalAmount() + (menuItem.getBasePrice() * orderItemRequestDto.getQuantity());
        order.setTotalAmount(newTotal);
        orderRepository.save(order);

        return convertToDto(savedOrderItem);
    }

    @Override
    @Transactional
    public void removeOrderItem(Long orderItemId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Order Item not found"));

        // Update the order's total amount before removing
        Order order = orderItem.getOrder();
        if (order != null) {
            double itemTotal = orderItem.getPrice() * orderItem.getQuantity();
            order.setTotalAmount(order.getTotalAmount() - itemTotal);
            orderRepository.save(order);
        }

        orderItemRepository.deleteById(orderItemId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderItemResponseDto> getItemsByOrderId(Long orderId) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        return orderItems.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert OrderItem entity to OrderItemResponseDto
     */
    private OrderItemResponseDto convertToDto(OrderItem orderItem) {
        String menuItemName = "Unknown Item";
        if (orderItem.getMenuItem() != null) {
            menuItemName = orderItem.getMenuItem().getName();
        }

        Double price = orderItem.getPrice();
        Integer quantity = orderItem.getQuantity();

        return new OrderItemResponseDto(
                menuItemName,
                quantity,
                price,
                quantity * price
        );
    }
}
