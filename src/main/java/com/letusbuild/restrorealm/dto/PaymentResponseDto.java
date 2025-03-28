package com.letusbuild.restrorealm.dto;

import lombok.Data;
import org.springframework.data.domain.jaxb.SpringDataJaxb;

import java.time.LocalDateTime;

@Data
public class PaymentResponseDto {
    private OrderResponseDto order;
    private String paymentId;
    private String status;
    private Double amount;
    private String paymentMethod;
    private Boolean isRefunded = false;
    private String refundId;
    private Double refundedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime refundedAt;
}