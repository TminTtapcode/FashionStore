package com.fashionstore.cart.domain;

import com.fashionstore.catalog.domain.ProductVariant;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "cart_items", indexes = {
    @Index(name = "idx_cart_items_cart", columnList = "cart_id"),
    @Index(name = "idx_cart_items_variant", columnList = "variant_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_cart_variant", columnNames = {"cart_id", "variant_id"})
})
public class CartItem {

    public static final int MIN_QUANTITY = 1;
    public static final int MAX_QUANTITY = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public CartItem() {}

    public CartItem(Cart cart, ProductVariant variant, int quantity) {
        this.cart = cart;
        this.variant = variant;
        this.quantity = quantity;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void increaseQuantity(int delta) {
        this.quantity += delta;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cart getCart() {
        return cart;
    }

    public void setCart(Cart cart) {
        this.cart = cart;
    }

    public ProductVariant getVariant() {
        return variant;
    }

    public void setVariant(ProductVariant variant) {
        this.variant = variant;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
