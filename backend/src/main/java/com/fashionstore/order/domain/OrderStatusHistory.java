package com.fashionstore.order.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "order_status_history", indexes = {
    @Index(name = "idx_order_history_order", columnList = "order_id")
})
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private OrderStatus toStatus;

    @Column(length = 255)
    private String note;

    @Column(name = "changed_by", nullable = false, length = 100)
    private String changedBy = "SYSTEM";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public OrderStatusHistory() {}

    public OrderStatusHistory(Order order, OrderStatus fromStatus, OrderStatus toStatus, String note, String changedBy) {
        this.order = order;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.note = note;
        this.changedBy = changedBy;
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public OrderStatus getFromStatus() {
        return fromStatus;
    }

    public OrderStatus getToStatus() {
        return toStatus;
    }

    public String getNote() {
        return note;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

