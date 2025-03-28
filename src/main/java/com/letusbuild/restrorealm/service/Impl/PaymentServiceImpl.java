package com.letusbuild.restrorealm.service.Impl;
import com.letusbuild.restrorealm.dto.OrderResponseDto;
import com.letusbuild.restrorealm.dto.PaymentRequestDto;
import com.letusbuild.restrorealm.dto.PaymentResponseDto;
import com.letusbuild.restrorealm.dto.RefundRequestDto;
import com.letusbuild.restrorealm.entity.Order;
import com.letusbuild.restrorealm.entity.PaymentEntity;
import com.letusbuild.restrorealm.repository.OrderRepository;
import com.letusbuild.restrorealm.repository.PaymentRepository;
import com.letusbuild.restrorealm.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentConfirmParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final ModelMapper modelMapper;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Override
    public PaymentResponseDto processPayment(PaymentRequestDto requestDto) {
        Stripe.apiKey = stripeSecretKey;
        Order order = orderRepository.findById(requestDto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        try {
            if (requestDto.getPaymentMethodId().startsWith("cash-")) {
                PaymentEntity payment = new PaymentEntity();
                payment.setOrder(order);
                payment.setAmount(requestDto.getAmount());
                payment.setStatus("CASHIER_PENDING");
                payment.setPaymentMethod(requestDto.getPaymentMethodId());
                payment.setCreatedAt(LocalDateTime.now());
                PaymentEntity savedPayment = paymentRepository.save(payment);
                PaymentResponseDto responseDto = new PaymentResponseDto();
                responseDto.setPaymentId(savedPayment.getPaymentId());
                responseDto.setStatus(savedPayment.getStatus());
                responseDto.setAmount(requestDto.getAmount());
                responseDto.setOrder(modelMapper.map(order, OrderResponseDto.class));
                return responseDto;
            } else {
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount((long) (requestDto.getAmount() * 100))
                        .setCurrency(requestDto.getCurrency())
                        .addPaymentMethodType("card")
                        .setPaymentMethod(requestDto.getPaymentMethodId())
                        .setConfirm(true)
                        .build();
                PaymentIntent paymentIntent = PaymentIntent.create(params);
                PaymentEntity payment = PaymentEntity.builder()
                        .order(order)
                        .paymentId(paymentIntent.getId())
                        .status(paymentIntent.getStatus())
                        .amount(requestDto.getAmount())
                        .paymentMethod(requestDto.getPaymentMethodId())
                        .createdAt(LocalDateTime.now())
                        .build();
            paymentRepository.save(payment);
            PaymentResponseDto responseDto = new PaymentResponseDto();
            responseDto.setPaymentId(paymentIntent.getId());
            responseDto.setStatus(paymentIntent.getStatus());
            responseDto.setAmount(requestDto.getAmount());
            responseDto.setOrder(modelMapper.map(order, OrderResponseDto.class));
            return responseDto;
            }
        } catch (StripeException e) {
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponseDto processRefund(RefundRequestDto refundRequest) {
        Stripe.apiKey = stripeSecretKey;

        // Fetch Payment
        PaymentEntity payment = (PaymentEntity) paymentRepository.findByPaymentId(refundRequest.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // Validate that the payment is successful
        if (!"succeeded".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalStateException("Only successful payments can be refunded");
        }

        try {
            // Create Refund in Stripe
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getPaymentId())
                    .setAmount((long) (refundRequest.getRefundAmount() * 100)) // Convert to cents
                    .build();

            Refund refund = Refund.create(params);

            // Update Payment Entity
            payment.setIsRefunded(true);
            payment.setRefundId(refund.getId());
            payment.setRefundedAmount(refundRequest.getRefundAmount());
            payment.setStatus("refunded");
            payment.setRefundedAt(LocalDateTime.now());

            paymentRepository.save(payment);

            // Return Response
            PaymentResponseDto responseDto = new PaymentResponseDto();
            responseDto.setPaymentId(payment.getPaymentId());
            responseDto.setStatus("refunded");
            responseDto.setAmount(refundRequest.getRefundAmount());

            return responseDto;

        } catch (StripeException e) {
            throw new RuntimeException("Refund processing failed: " + e.getMessage());
        }
    }
}

