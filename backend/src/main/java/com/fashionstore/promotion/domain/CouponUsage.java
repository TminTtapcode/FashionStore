package com.fashionstore.promotion.domain;

import com.fashionstore.identity.domain.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupon_usages", indexes = {
    @Index(name = "idx_coupon_usages_coupon_user", columnList = "coupon_id, user_id"),
    @Index(name = "idx_coupon_usages_coupon_status", columnList = "coupon_id, status"),
    @Index(name = "idx_coupon_usages_user_status", columnList = "user_id, status"),
    @Index(name = "idx_coupon_usages_order", columnList = "order_id")
})
public class CouponUsage {

    public static final String STATUS_APPLIED = "APPLIED";
    public static final String STATUS_RELEASED = "RELEASED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(nullable = false, length = 20)
    private String status = STATUS_APPLIED;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "used_at", updatable = false)
    private Instant usedAt = Instant.now();

    public CouponUsage() {}

    public CouponUsage(Coupon coupon, User user, Long orderId, BigDecimal discountAmount) {
        this.coupon = coupon;
        this.user = user;
        this.orderId = orderId;
        this.discountAmount = discountAmount;
        this.status = STATUS_APPLIED;
    }

    public void release() {
        this.status = STATUS_RELEASED;
        this.releasedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Coupon getCoupon() {
        return coupon;
    }

    public User getUser() {
        return user;
    }

    public Long getOrderId() {
        return orderId;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(Instant releasedAt) {
        this.releasedAt = releasedAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }
}
