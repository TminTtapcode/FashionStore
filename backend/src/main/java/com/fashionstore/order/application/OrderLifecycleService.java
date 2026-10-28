package com.fashionstore.order.application;

import com.fashionstore.catalog.domain.ProductVariantRepository;
import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.exception.ResourceNotFoundException;
import com.fashionstore.order.api.dto.*;
import com.fashionstore.order.domain.*;
import com.fashionstore.promotion.domain.CouponUsage;
import com.fashionstore.promotion.infrastructure.CouponUsageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class OrderLifecycleService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final CouponUsageRepository couponUsageRepository;

    public OrderLifecycleService(
            OrderRepository orderRepository,
            ProductVariantRepository variantRepository,
            CouponUsageRepository couponUsageRepository) {
        this.orderRepository = orderRepository;
        this.variantRepository = variantRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    /**
     * Customer cancels their own pending order.
     * Uses pessimistic write lock to eliminate double cancellation races.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderConfirmationDto cancelOrderByCustomer(String orderNumber, Long userId, String reason) {
        Order order = orderRepository.findByOrderNumberWithLock(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thao tác trên đơn hàng này");
        }

        if (!order.getStatus().allowsCustomerCancellation()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "ORDER_CANNOT_BE_CANCELLED",
                    "Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái Chờ xác nhận (PENDING). Trạng thái hiện tại: " + order.getStatus()
            );
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);

        // Immediate stock restoration for pre-carrier cancellation
        restoreOrderStock(order);

        // Voucher release audit: marks status as RELEASED, preserves audit trail
        releaseOrderCoupon(order);

        String actorName = order.getUser().getFullName() != null && !order.getUser().getFullName().isBlank()
                ? order.getUser().getFullName()
                : "CUSTOMER";

        OrderStatusHistory history = new OrderStatusHistory(
                order,
                previousStatus,
                OrderStatus.CANCELLED,
                reason != null && !reason.isBlank() ? reason.trim() : "Khách hàng yêu cầu hủy đơn",
                actorName
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        return mapToDto(saved);
    }

    /**
     * Shop Owner / Admin transitions order status with strict lifecycle validation.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderConfirmationDto updateOrderStatusByOwner(String orderNumber, OrderStatus toStatus, String note, String actorName) {
        Order order = orderRepository.findByOrderNumberWithLock(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        if (toStatus == OrderStatus.RETURNED) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "RETURN_CONFIRMATION_REQUIRED",
                    "Vui lòng dùng endpoint confirm-return để xác nhận hàng hoàn đã về kho"
            );
        }

        if (order.getStatus().isTerminal()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "TERMINAL_STATE",
                    "Đơn hàng đã kết thúc ở trạng thái " + order.getStatus() + ", không thể thay đổi"
            );
        }

        if (!order.getStatus().canTransitionTo(toStatus)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TRANSITION",
                    "Không thể chuyển trạng thái từ " + order.getStatus() + " sang " + toStatus
            );
        }

        OrderStatus previousStatus = order.getStatus();

        // 1. Cancellation by Owner before carrier handover
        if (toStatus == OrderStatus.CANCELLED) {
            if (previousStatus.allowsImmediateStockRestorationOnCancel()) {
                restoreOrderStock(order);
                releaseOrderCoupon(order);
            }
        }

        // 2. Completion marks COD order as PAID
        if (toStatus == OrderStatus.COMPLETED) {
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
        }

        // 3. Notice: When transitioning SHIPPING -> DELIVERY_FAILED,
        // stock is NOT restored and voucher is NOT released because package is still in courier custody.

        order.setStatus(toStatus);

        OrderStatusHistory history = new OrderStatusHistory(
                order,
                previousStatus,
                toStatus,
                note != null && !note.isBlank() ? note.trim() : "Cập nhật trạng thái bởi chủ cửa hàng",
                actorName != null && !actorName.isBlank() ? actorName.trim() : "SHOP_OWNER"
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        return mapToDto(saved);
    }

    /**
     * Shop Owner / Admin confirms physical warehouse receipt of returned package after failed delivery.
     * Restores stock and releases voucher safely.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public OrderConfirmationDto confirmReturnByOwner(String orderNumber, String note, String actorName) {
        Order order = orderRepository.findByOrderNumberWithLock(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderNumber));

        if (order.getStatus() != OrderStatus.DELIVERY_FAILED) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_TRANSITION",
                    "Chỉ có thể xác nhận trả hàng khi đơn giao hàng thất bại (DELIVERY_FAILED). Trạng thái hiện tại: " + order.getStatus()
            );
        }

        order.setStatus(OrderStatus.RETURNED);

        // Now package is physically received and inspected at warehouse: restore inventory
        restoreOrderStock(order);

        // Release voucher quota
        releaseOrderCoupon(order);

        OrderStatusHistory history = new OrderStatusHistory(
                order,
                OrderStatus.DELIVERY_FAILED,
                OrderStatus.RETURNED,
                note != null && !note.isBlank() ? note.trim() : "Xác nhận hàng hoàn về kho thành công",
                actorName != null && !actorName.isBlank() ? actorName.trim() : "SHOP_OWNER"
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        return mapToDto(saved);
    }

    private void restoreOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            if (item.getVariantId() != null && item.getQuantity() > 0) {
                variantRepository.restoreStock(item.getVariantId(), item.getQuantity());
            }
        }
    }

    private void releaseOrderCoupon(Order order) {
        Optional<CouponUsage> usageOpt = couponUsageRepository.findByOrderIdAndStatus(order.getId(), CouponUsage.STATUS_APPLIED);
        usageOpt.ifPresent(usage -> {
            usage.release();
            couponUsageRepository.save(usage);
        });
    }

    public OrderConfirmationDto mapToDto(Order order) {
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

        List<OrderStatusHistoryDto> historyDtos = order.getStatusHistory().stream()
                .sorted(Comparator.comparing(OrderStatusHistory::getCreatedAt))
                .map(h -> new OrderStatusHistoryDto(
                        h.getId(),
                        h.getFromStatus(),
                        h.getToStatus(),
                        h.getNote(),
                        h.getChangedBy(),
                        h.getCreatedAt()
                ))
                .toList();

        OrderConfirmationDto dto = new OrderConfirmationDto(
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
        dto.setStatusHistory(historyDtos);
        return dto;
    }
}
