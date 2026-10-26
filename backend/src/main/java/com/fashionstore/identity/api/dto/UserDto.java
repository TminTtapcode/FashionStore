package com.fashionstore.identity.api.dto;

import java.util.Set;

public record UserDto(
        Long id,
        String email,
        String fullName,
        String phone,
        Set<String> roles,
        WelcomeCouponDto welcomeCoupon
) {}
