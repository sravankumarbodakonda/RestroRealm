package com.letusbuild.restrorealm.service.Impl;

import com.letusbuild.restrorealm.dto.OrderItemResponseDto;
import com.letusbuild.restrorealm.dto.OrderRequestDto;
import com.letusbuild.restrorealm.dto.OrderResponseDto;
import com.letusbuild.restrorealm.entity.Enum.OrderStatus;
import com.letusbuild.restrorealm.entity.MenuItem;
import com.letusbuild.restrorealm.entity.Order;
import com.letusbuild.restrorealm.entity.OrderItem;
import com.letusbuild.restrorealm.entity.TableEntity;
import com.letusbuild.restrorealm.repository.MenuItemRepository;
import com.letusbuild.restrorealm.repository.OrderItemRepository;
import com.letusbuild.restrorealm.repository.OrderRepository;
import com.letusbuild.restrorealm.repository.TableRepository;
import com.letusbuild.restrorealm.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final ModelMapper modelMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public OrderResponseDto createOrder(OrderRequestDto orderRequestDto) {
        Order order = new Order();

        // Handle table assignment
        if(orderRequestDto.getTableId() != null) {
            TableEntity table = tableRepository.findById(orderRequestDto.getTableId())
                    .orElseThrow(() -> new IllegalArgumentException("Table not found"));
            order.setTable(table);
        } else {
            TableEntity table = tableRepository.findById(0L)
                    .orElseThrow(() -> new IllegalArgumentException("Table not found"));
            order.setTable(table);
        }

        order.setCustomerName(orderRequestDto.getCustomerName());
        order.setOrderNumber(orderRequestDto.getOrderNumber());
        order.setStatus(orderRequestDto.getStatus() != null ? orderRequestDto.getStatus() : OrderStatus.PENDING);
        order.setStreet1(orderRequestDto.getStreet1());
        order.setStreet2(orderRequestDto.getStreet2());
        order.setCity(orderRequestDto.getCity());
        order.setState(orderRequestDto.getState());
        order.setPostalCode(orderRequestDto.getPostalCode());

        // Save the order first to get an ID
        Order savedOrder = orderRepository.save(order);

        // Initialize the order items list
        List<OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0.0;

        // Create and save order items
        if (orderRequestDto.getOrderItems() != null && !orderRequestDto.getOrderItems().isEmpty()) {
            for (var orderItemDto : orderRequestDto.getOrderItems()) {
                MenuItem menuItem = menuItemRepository.findById(orderItemDto.getMenuItemId())
                        .orElseThrow(() -> new IllegalArgumentException("Menu Item not found"));

                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setMenuItem(menuItem);
                orderItem.setQuantity(orderItemDto.getQuantity());
                orderItem.setPrice(menuItem.getBasePrice());

                orderItems.add(orderItemRepository.save(orderItem));

                totalAmount += menuItem.getBasePrice() * orderItemDto.getQuantity();
            }
        }

        // Update order with items and total amount
        savedOrder.setOrderItems(orderItems);
        savedOrder.setTotalAmount(totalAmount);
        savedOrder = orderRepository.save(savedOrder);

        // Map to response DTO
        OrderResponseDto responseDto = convertToDto(savedOrder);

        // Send WebSocket notification
        messagingTemplate.convertAndSend("/topic/orders", responseDto);

        return responseDto;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return convertToDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponseDto updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            order.setStatus(orderStatus);
            Order updatedOrder = orderRepository.save(order);

            OrderResponseDto responseDto = convertToDto(updatedOrder);

            // Send WebSocket notifications
            messagingTemplate.convertAndSend("/topic/orders/" + orderId, responseDto);
            messagingTemplate.convertAndSend("/topic/orders", responseDto);

            return responseDto;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + status);
        }
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);

        OrderResponseDto responseDto = convertToDto(cancelledOrder);

        // Send WebSocket notifications
        messagingTemplate.convertAndSend("/topic/orders/" + orderId, responseDto);
        messagingTemplate.convertAndSend("/topic/orders", responseDto);
    }

    /**
     * Helper method to convert Order entity to OrderResponseDto
     */
    private OrderResponseDto convertToDto(Order order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerName(order.getCustomerName());
        dto.setTableName(order.getTable() != null ? order.getTable().getTableNumber() : null);
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setStreet1(order.getStreet1());
        dto.setStreet2(order.getStreet2());
        dto.setCity(order.getCity());
        dto.setState(order.getState());
        dto.setPostalCode(order.getPostalCode());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        // Handle order items manually to avoid lazy loading issues
        if (order.getOrderItems() != null) {
            List<OrderItemResponseDto> itemDtos = order.getOrderItems().stream()
                    .map(item -> {
                        String menuItemName = item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown Item";
                        return new OrderItemResponseDto(
                                menuItemName,
                                item.getQuantity(),
                                item.getPrice(),
                                item.getQuantity() * item.getPrice()
                        );
                    })
                    .collect(Collectors.toList());
            dto.setOrderItems(itemDtos);
        } else {
            dto.setOrderItems(new ArrayList<>());
        }

        return dto;
    }
}
