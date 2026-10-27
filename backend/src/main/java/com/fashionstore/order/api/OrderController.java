package com.fashionstore.order.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.order.api.dto.FinancialsDto;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.api.dto.OrderItemDto;
import com.fashionstore.order.api.dto.RecipientDto;
import com.fashionstore.order.domain.Order;
import com.fashionstore.order.domain.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderConfirmationDto>>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
        List<OrderConfirmationDto> dtos = orders.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> getOrderByNumber(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .filter(o -> o.getUser().getId().equals(principal.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này"));

        return ResponseEntity.ok(ApiResponse.success(toDto(order)));
    }

    private OrderConfirmationDto toDto(Order order) {
        RecipientDto recipient = new RecipientDto(
                order.getShippingName(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getShippingCity(),
                order.getShippingDistrict(),
                order.getShippingWard(),
                order.getShippingNote()
        );

        FinancialsDto financials = new FinancialsDto(
                order.getSubtotalAmount(),
                order.getDiscountAmount(),
                order.getShippingFee(),
                order.getFinalAmount(),
                order.getCouponCode()
        );

        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> new OrderItemDto(
                item.getId(),
                item.getProductId(),
                item.getVariantId(),
                item.getProductName(),
                item.getBrand(),
                item.getSku(),
                item.getSize(),
                item.getColorName(),
                item.getThumbnailUrl(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getTotalPrice()
        )).toList();

        return new OrderConfirmationDto(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                recipient,
                financials,
                itemDtos,
                order.getCreatedAt(),
                false
        );
    }
}

