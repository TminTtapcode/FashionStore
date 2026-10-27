package com.fashionstore.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "order_items", indexes = {
    @Index(name = "idx_order_items_order", columnList = "order_id")
})
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "variant_id")
    private Long variantId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false, length = 60)
    private String sku;

    @Column(nullable = false, length = 20)
    private String size;

    @Column(name = "color_name", nullable = false, length = 50)
    private String colorName;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public OrderItem() {}

    public OrderItem(
            Order order,
            Long productId,
            Long variantId,
            String productName,
            String brand,
            String sku,
            String size,
            String colorName,
            String thumbnailUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal totalPrice) {
        this.order = order;
        this.productId = productId;
        this.variantId = variantId;
        this.productName = productName;
        this.brand = brand;
        this.sku = sku;
        this.size = size;
        this.colorName = colorName;
        this.thumbnailUrl = thumbnailUrl;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
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

    public Long getProductId() {
        return productId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public String getProductName() {
        return productName;
    }

    public String getBrand() {
        return brand;
    }

    public String getSku() {
        return sku;
    }

    public String getSize() {
        return size;
    }

    public String getColorName() {
        return colorName;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

