package com.letusbuild.restrorealm.service;

import com.letusbuild.restrorealm.dto.PaymentRequestDto;
import com.letusbuild.restrorealm.dto.PaymentResponseDto;
import com.letusbuild.restrorealm.dto.RefundRequestDto;

public interface PaymentService {
    PaymentResponseDto processPayment(PaymentRequestDto requestDto);
    PaymentResponseDto processRefund(RefundRequestDto refundRequest);
}
