package com.fashionstore.order.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.api.PageResponse;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.order.api.dto.ConfirmReturnRequest;
import com.fashionstore.order.api.dto.OrderConfirmationDto;
import com.fashionstore.order.api.dto.UpdateOrderStatusRequest;
import com.fashionstore.order.application.OrderLifecycleService;
import com.fashionstore.order.domain.Order;
import com.fashionstore.order.domain.OrderRepository;
import com.fashionstore.order.domain.OrderStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/owner/orders")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class OwnerOrderController {

    private final OrderRepository orderRepository;
    private final OrderLifecycleService orderLifecycleService;

    public OwnerOrderController(OrderRepository orderRepository, OrderLifecycleService orderLifecycleService) {
        this.orderRepository = orderRepository;
        this.orderLifecycleService = orderLifecycleService;
    }

    /**
     * List, filter, search, and paginate orders for shop management.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderConfirmationDto>>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search) {

        int validPage = Math.max(0, page);
        int validSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), pattern),
                        cb.like(cb.lower(root.get("shippingPhone")), pattern),
                        cb.like(cb.lower(root.get("shippingName")), pattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        List<OrderConfirmationDto> items = orderPage.getContent().stream()
                .map(orderLifecycleService::mapToDto)
                .toList();

        PageResponse<OrderConfirmationDto> response = new PageResponse<>(
                items,
                orderPage.getNumber(),
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderPage.hasNext(),
                orderPage.hasPrevious()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieve full order details including timeline status history.
     */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> getOrderDetail(@PathVariable String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        return ResponseEntity.ok(ApiResponse.success(orderLifecycleService.mapToDto(order)));
    }

    /**
     * Update order status with lifecycle validations and atomic inventory / payment updates.
     */
    @PatchMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request) {

        String actorName = principal != null && principal.getFullName() != null && !principal.getFullName().isBlank()
                ? principal.getFullName()
                : "SHOP_OWNER";

        OrderConfirmationDto result = orderLifecycleService.updateOrderStatusByOwner(
                orderNumber,
                request.getStatus(),
                request.getNote(),
                actorName
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Confirm physical return of failed delivery package at warehouse and safely restore stock.
     */
    @PostMapping("/{orderNumber}/confirm-return")
    public ResponseEntity<ApiResponse<OrderConfirmationDto>> confirmReturn(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody(required = false) ConfirmReturnRequest request) {

        String actorName = principal != null && principal.getFullName() != null && !principal.getFullName().isBlank()
                ? principal.getFullName()
                : "SHOP_OWNER";

        String note = request != null ? request.getNote() : null;

        OrderConfirmationDto result = orderLifecycleService.confirmReturnByOwner(
                orderNumber,
                note,
                actorName
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
