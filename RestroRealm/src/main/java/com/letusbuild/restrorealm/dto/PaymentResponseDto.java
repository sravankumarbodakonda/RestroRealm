package com.letusbuild.restrorealm.dto;

import lombok.Data;

@Data
public class PaymentResponseDto {
    private String paymentId;
    private String status;
    private Double amount;
}