package com.letusbuild.restrorealm.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "payments")
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order; // One-to-One Mapping with Order

    private String paymentId; // Payment Gateway transaction ID
    private String status; // Pending, Successful, Failed, Refunded
    private Double amount;
    private String paymentMethod; // Card, UPI, Wallet, etc.

    private Boolean isRefunded = false; // Flag to check if refunded
    private String refundId; // Refund transaction ID
    private Double refundedAmount; // Amount refunded

    private LocalDateTime createdAt;
    private LocalDateTime refundedAt;
}

