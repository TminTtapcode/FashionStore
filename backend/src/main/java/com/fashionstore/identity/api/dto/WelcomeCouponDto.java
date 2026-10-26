package com.fashionstore.identity.api.dto;

import java.math.BigDecimal;

public record WelcomeCouponDto(
        String code,
        String description,
        String discountType,
        BigDecimal discountValue
) {}
