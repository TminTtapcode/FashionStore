package com.fashionstore.order.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.order.api.dto.CheckoutRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.application.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> checkoutCod(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CheckoutRequest request) {

        OrderConfirmationDto result = checkoutService.checkoutCod(principal.getId(), idempotencyKey, request);
        HttpStatus status = result.isIdempotentReplay() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(ApiResponse.success(result));
    }
}
