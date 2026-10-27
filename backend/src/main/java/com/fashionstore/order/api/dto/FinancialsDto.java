package com.fashionstore.order.api.dto;

import java.math.BigDecimal;

public class FinancialsDto {

    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private String couponCode;

    public FinancialsDto() {}

    public FinancialsDto(BigDecimal subtotalAmount, BigDecimal discountAmount, BigDecimal shippingFee, BigDecimal finalAmount, String couponCode) {
        this.subtotalAmount = subtotalAmount;
        this.discountAmount = discountAmount;
        this.shippingFee = shippingFee;
        this.finalAmount = finalAmount;
        this.couponCode = couponCode;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public String getCouponCode() {
        return couponCode;
    }
}
