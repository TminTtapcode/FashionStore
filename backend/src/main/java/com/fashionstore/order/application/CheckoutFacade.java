package com.fashionstore.order.application;

import com.fashionstore.common.exception.ApiException;
import com.fashionstore.order.api.dto.CheckoutRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.domain.Order;
import com.fashionstore.order.domain.OrderRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CheckoutFacade {

    private final CheckoutService checkoutService;
    private final OrderRepository orderRepository;

    public CheckoutFacade(CheckoutService checkoutService, OrderRepository orderRepository) {
        this.checkoutService = checkoutService;
        this.orderRepository = orderRepository;
    }

    /**
     * Entry point for COD Checkout.
     * Manages Idempotency checking outside the write transaction to cleanly recover
     * from concurrent duplicate key violations without session rollback-only pollution.
     */
    public OrderConfirmationDto checkoutCod(Long userId, String idempotencyKey, CheckoutRequest request) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MISSING_IDEMPOTENCY_KEY", "Yêu cầu đặt hàng phải có Idempotency-Key");
        }
        String cleanKey = idempotencyKey.trim();

        // 1. Initial fast check outside write transaction
        Optional<Order> existingOpt = orderRepository.findByUserIdAndIdempotencyKey(userId, cleanKey);
        if (existingOpt.isPresent()) {
            return verifyAndMapReplay(existingOpt.get(), request);
        }

        try {
            // 2. Execute transactional checkout
            return checkoutService.executeCheckoutOrder(userId, cleanKey, request);
        } catch (DataIntegrityViolationException ex) {
            // 3. Catch concurrent duplicate key exception specifically for uk_orders_user_idempotency
            if (isIdempotencyConstraintViolation(ex)) {
                Order concurrentOrder = orderRepository.findByUserIdAndIdempotencyKey(userId, cleanKey)
                        .orElseThrow(() -> ex);
                return verifyAndMapReplay(concurrentOrder, request);
            }
            // If it's another constraint violation, rethrow without suppressing
            throw ex;
        }
    }

    private OrderConfirmationDto verifyAndMapReplay(Order order, CheckoutRequest request) {
        String reqPhone = request.getShippingPhone() != null ? request.getShippingPhone().trim() : "";
        String reqAddress = request.getShippingAddress() != null ? request.getShippingAddress().trim() : "";

        if (!java.util.Objects.equals(order.getShippingPhone(), reqPhone) ||
            !java.util.Objects.equals(order.getShippingAddress(), reqAddress)) {
            throw new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "Khóa request đã được sử dụng cho một đơn hàng khác");
        }
        return checkoutService.mapToOrderConfirmationDto(order, true);
    }

    private boolean isIdempotencyConstraintViolation(DataIntegrityViolationException ex) {
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("uk_orders_user_idempotency") || msg.contains("Duplicate entry"))) {
            return true;
        }
        Throwable cause = ex.getCause();
        while (cause != null) {
            if (cause.getMessage() != null && (cause.getMessage().contains("uk_orders_user_idempotency") || cause.getMessage().contains("Duplicate entry"))) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}

