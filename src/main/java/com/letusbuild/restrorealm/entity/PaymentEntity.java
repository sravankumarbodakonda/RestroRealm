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
    private Order order;
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

