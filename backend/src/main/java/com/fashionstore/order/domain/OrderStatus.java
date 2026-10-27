package com.fashionstore.order.domain;

import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    DELIVERY_FAILED,
    RETURNED,
    CANCELLED;

    /**
     * Validates whether this state can legally transition to the specified target state.
     */
    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (nextStatus == null || this == nextStatus) {
            return false;
        }

        return switch (this) {
            case PENDING -> nextStatus == CONFIRMED || nextStatus == CANCELLED;
            case CONFIRMED -> nextStatus == PROCESSING || nextStatus == CANCELLED;
            case PROCESSING -> nextStatus == SHIPPING || nextStatus == CANCELLED;
            case SHIPPING -> nextStatus == COMPLETED || nextStatus == DELIVERY_FAILED;
            case DELIVERY_FAILED -> nextStatus == RETURNED;
            case COMPLETED, CANCELLED, RETURNED -> false;
        };
    }

    /**
     * Terminal states cannot be transitioned further.
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == RETURNED;
    }

    /**
     * Customer can only cancel directly while the order is pending confirmation.
     */
    public boolean allowsCustomerCancellation() {
        return this == PENDING;
    }

    /**
     * Only orders cancelled before physical carrier handover qualify for immediate stock restoration.
     */
    public boolean allowsImmediateStockRestorationOnCancel() {
        return this == PENDING || this == CONFIRMED || this == PROCESSING;
    }
}
