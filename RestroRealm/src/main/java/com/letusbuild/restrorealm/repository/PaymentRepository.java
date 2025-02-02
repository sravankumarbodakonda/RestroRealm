package com.letusbuild.restrorealm.repository;

import com.letusbuild.restrorealm.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity,Long> {
    Optional<Object> findByPaymentId(String paymentId);
}
