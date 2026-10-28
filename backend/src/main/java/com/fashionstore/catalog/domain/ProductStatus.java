package com.fashionstore.catalog.domain;

public enum ProductStatus {
    DRAFT,
    ACTIVE,
    HIDDEN,
    ARCHIVED;

    /**
     * Validates whether this product state can legally transition to the target state.
     */
    public boolean canTransitionTo(ProductStatus next) {
        if (next == null || this == next) {
            return false;
        }

        return switch (this) {
            case DRAFT -> next == ACTIVE || next == ARCHIVED;
            case ACTIVE -> next == HIDDEN || next == ARCHIVED;
            case HIDDEN -> next == ACTIVE || next == ARCHIVED;
            case ARCHIVED -> false; // Terminal state
        };
    }

    public boolean isTerminal() {
        return this == ARCHIVED;
    }
}
