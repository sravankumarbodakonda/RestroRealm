package com.letusbuild.restrorealm.service.Impl;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentServiceImpl(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public PaymentResponseDto processPayment(PaymentRequestDto requestDto) {
        Stripe.apiKey = stripeSecretKey;

        // Fetch Order
        Order order = orderRepository.findById(requestDto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        try {
            // Create a PaymentIntent
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount((long) (requestDto.getAmount() * 100)) // Convert to cents
                    .setCurrency(requestDto.getCurrency())
                    .addPaymentMethodType("card")
                    .setPaymentMethod(requestDto.getPaymentMethodId()) // ✅ Attach PaymentMethod
                    .setConfirm(true) // ✅ Confirm at the time of creation
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            // Save payment in DB
            PaymentEntity payment = PaymentEntity.builder()
                    .order(order) // Link order to payment
                    .paymentId(paymentIntent.getId())
                    .status(paymentIntent.getStatus())
                    .amount(requestDto.getAmount())
                    .paymentMethod(requestDto.getPaymentMethodId())
                    .createdAt(LocalDateTime.now())
                    .build();

//            PaymentIntentConfirmParams confirmParams = PaymentIntentConfirmParams.builder()
//                    .setPaymentMethod(requestDto.getPaymentMethodId()) // Attach the payment method
//                    .build();
//
//            PaymentIntent confirmedIntent = paymentIntent.confirm(confirmParams);

            paymentRepository.save(payment);

            // Return response
            PaymentResponseDto responseDto = new PaymentResponseDto();
            responseDto.setPaymentId(paymentIntent.getId());
            responseDto.setStatus(paymentIntent.getStatus());
            responseDto.setAmount(requestDto.getAmount());

            return responseDto;

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

