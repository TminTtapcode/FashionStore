package com.fashionstore.catalog.domain;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository
        extends JpaRepository<ProductVariant, Long>, JpaSpecificationExecutor<ProductVariant> {

    Optional<ProductVariant> findBySku(String sku);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM ProductVariant v WHERE v.id = :id")
    Optional<ProductVariant> findByIdForUpdate(@Param("id") Long id);

    List<ProductVariant> findByProductIdAndStatus(Long productId, ProductVariantStatus status);

    List<ProductVariant> findByProductId(Long productId);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    boolean existsByProductIdAndSizeIgnoreCaseAndColorNameIgnoreCase(Long productId, String size, String colorName);

    boolean existsByProductIdAndSizeIgnoreCaseAndColorNameIgnoreCaseAndIdNot(Long productId, String size,
            String colorName, Long id);

    /**
     * Conditional atomic stock deduction:
     * Only updates if variant is ACTIVE and remaining stock >= requested quantity.
     * Returns 1 if deduction succeeded, 0 if out of stock or inactive.
     */
    @Modifying
    @Query("UPDATE ProductVariant v SET v.stockQuantity = v.stockQuantity - :quantity WHERE v.id = :id AND v.status = com.fashionstore.catalog.domain.ProductVariantStatus.ACTIVE AND v.stockQuantity >= :quantity")
    int deductStock(@Param("id") Long id, @Param("quantity") int quantity);

    /**
     * Restores stock quantity when an order is cancelled or rolled back.
     */
    @Modifying
    @Query("UPDATE ProductVariant v SET v.stockQuantity = v.stockQuantity + :quantity WHERE v.id = :id")
    int restoreStock(@Param("id") Long id, @Param("quantity") int quantity);

    @Query("SELECT COUNT(v) FROM ProductVariant v WHERE v.stockQuantity > 5")
    long countHealthyStock();

    @Query("SELECT COUNT(v) FROM ProductVariant v WHERE v.stockQuantity >= 1 AND v.stockQuantity <= 5")
    long countLowStock();

    @Query("SELECT COUNT(v) FROM ProductVariant v WHERE v.stockQuantity = 0")
    long countOutOfStock();

    @Query("SELECT COALESCE(SUM(v.stockQuantity), 0) FROM ProductVariant v")
    long sumTotalStockUnits();
}
