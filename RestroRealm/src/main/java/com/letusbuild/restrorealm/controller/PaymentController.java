package com.letusbuild.restrorealm.controller;

import com.letusbuild.restrorealm.dto.PaymentRequestDto;
import com.letusbuild.restrorealm.dto.PaymentResponseDto;
import com.letusbuild.restrorealm.dto.RefundRequestDto;
import com.letusbuild.restrorealm.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController{

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process")
    public ResponseEntity<PaymentResponseDto> processPayment(@RequestBody PaymentRequestDto requestDto) {
        PaymentResponseDto response = paymentService.processPayment(requestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refund")
    public ResponseEntity<PaymentResponseDto> processRefund(@RequestBody RefundRequestDto refundRequest) {
        PaymentResponseDto response = paymentService.processRefund(refundRequest);
        return ResponseEntity.ok(response);
    }
}
