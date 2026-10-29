package com.fashionstore.inventory.domain;

import com.fashionstore.catalog.domain.ProductVariant;
import com.fashionstore.identity.domain.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_movements", indexes = {
    @Index(name = "idx_inv_movement_variant_created", columnList = "variant_id, created_at"),
    @Index(name = "idx_inv_movement_type", columnList = "movement_type"),
    @Index(name = "idx_inv_movement_ref", columnList = "reference_type, reference_id")
})
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 40)
    private InventoryMovementType movementType;

    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Column(name = "stock_before", nullable = false)
    private int stockBefore;

    @Column(name = "stock_after", nullable = false)
    private int stockAfter;

    @Column(name = "reference_type", nullable = false, length = 50)
    private String referenceType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "movement_key", nullable = false, unique = true, length = 120)
    private String movementKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actor;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public InventoryMovement() {}

    public InventoryMovement(ProductVariant variant, InventoryMovementType movementType,
                             int quantityDelta, int stockBefore, int stockAfter,
                             String referenceType, String referenceId, String movementKey,
                             User actor, String reason) {
        this.variant = variant;
        this.movementType = movementType;
        this.quantityDelta = quantityDelta;
        this.stockBefore = stockBefore;
        this.stockAfter = stockAfter;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.movementKey = movementKey;
        this.actor = actor;
        this.reason = reason;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public ProductVariant getVariant() {
        return variant;
    }

    public InventoryMovementType getMovementType() {
        return movementType;
    }

    public int getQuantityDelta() {
        return quantityDelta;
    }

    public int getStockBefore() {
        return stockBefore;
    }

    public int getStockAfter() {
        return stockAfter;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public String getMovementKey() {
        return movementKey;
    }

    public User getActor() {
        return actor;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

