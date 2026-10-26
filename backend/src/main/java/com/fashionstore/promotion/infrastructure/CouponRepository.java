package com.fashionstore.promotion.infrastructure;

import com.fashionstore.promotion.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndStatus(String code, String status);
    Optional<Coupon> findByCodeIgnoreCase(String code);
}
