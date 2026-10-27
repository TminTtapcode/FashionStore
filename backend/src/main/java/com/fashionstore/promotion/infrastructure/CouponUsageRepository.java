package com.fashionstore.promotion.infrastructure;

import com.fashionstore.promotion.domain.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponId(Long couponId);

    long countByCouponIdAndUserId(Long couponId, Long userId);

    long countByCouponIdAndStatus(Long couponId, String status);

    long countByCouponIdAndUserIdAndStatus(Long couponId, Long userId, String status);

    List<CouponUsage> findByOrderId(Long orderId);

    Optional<CouponUsage> findByOrderIdAndStatus(Long orderId, String status);
}
