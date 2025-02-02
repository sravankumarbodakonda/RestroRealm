package com.letusbuild.restrorealm.dto;

import lombok.Data;

@Data
public class RefundRequestDto {
    private String paymentId;
    private Double refundAmount;
}