package com.fashionstore.identity.api.dto;

public record AuthResult(
        UserDto user,
        String token
) {}
