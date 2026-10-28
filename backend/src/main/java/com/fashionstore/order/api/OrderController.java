package com.fashionstore.order.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.order.api.dto.CancelOrderRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.application.OrderLifecycleService;
import com.fashionstore.order.domain.Order;
import com.fashionstore.order.domain.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderLifecycleService orderLifecycleService;

    public OrderController(OrderRepository orderRepository, OrderLifecycleService orderLifecycleService) {
        this.orderRepository = orderRepository;
        this.orderLifecycleService = orderLifecycleService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<OrderConfirmationDto>>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
        List<OrderConfirmationDto> dtos = orders.stream().map(orderLifecycleService::mapToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{orderNumber}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> getOrderByNumber(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .filter(o -> o.getUser().getId().equals(principal.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này"));

        return ResponseEntity.ok(ApiResponse.success(orderLifecycleService.mapToDto(order)));
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> cancelMyOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody(required = false) CancelOrderRequest request) {

        String reason = request != null ? request.getReason() : null;
        OrderConfirmationDto result = orderLifecycleService.cancelOrderByCustomer(orderNumber, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}

