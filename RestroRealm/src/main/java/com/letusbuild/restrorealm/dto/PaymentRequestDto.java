package com.letusbuild.restrorealm.dto;

import lombok.Data;

@Data
public class PaymentRequestDto {
    private Long orderId;
    private Double amount;
    private String currency; // e.g., USD, INR
    private String paymentMethodId; // Card, UPI, etc.
}

