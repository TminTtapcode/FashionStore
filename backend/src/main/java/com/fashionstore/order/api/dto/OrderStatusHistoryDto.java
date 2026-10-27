package com.fashionstore.order.api.dto;

import com.fashionstore.order.domain.OrderStatus;

import java.time.Instant;

public class OrderStatusHistoryDto {

    private Long id;
    private OrderStatus fromStatus;
    private OrderStatus toStatus;
    private String note;
    private String changedBy;
    private Instant createdAt;

    public OrderStatusHistoryDto() {}

    public OrderStatusHistoryDto(Long id, OrderStatus fromStatus, OrderStatus toStatus, String note, String changedBy, Instant createdAt) {
        this.id = id;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.note = note;
        this.changedBy = changedBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(OrderStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public OrderStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(OrderStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
