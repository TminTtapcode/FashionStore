package com.fashionstore.order.api.dto;

import com.fashionstore.order.domain.OrderStatus;
import com.fashionstore.order.domain.PaymentMethod;
import com.fashionstore.order.domain.PaymentStatus;

import java.time.Instant;
import java.util.List;

public class OrderConfirmationDto {

    private Long orderId;
    private String orderNumber;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private RecipientDto recipient;
    private FinancialsDto financials;
    private List<OrderItemDto> items;
    private Instant createdAt;
    private boolean idempotentReplay;

    public OrderConfirmationDto() {}

    public OrderConfirmationDto(
            Long orderId,
            String orderNumber,
            OrderStatus status,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            RecipientDto recipient,
            FinancialsDto financials,
            List<OrderItemDto> items,
            Instant createdAt,
            boolean idempotentReplay) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.recipient = recipient;
        this.financials = financials;
        this.items = items;
        this.createdAt = createdAt;
        this.idempotentReplay = idempotentReplay;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public RecipientDto getRecipient() {
        return recipient;
    }

    public FinancialsDto getFinancials() {
        return financials;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isIdempotentReplay() {
        return idempotentReplay;
    }
}
