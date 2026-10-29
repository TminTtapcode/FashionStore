package com.fashionstore.catalog.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    Optional<ProductImage> findByIdAndProductId(Long id, Long productId);

    Optional<ProductImage> findFirstByProductIdAndIsPrimaryTrue(Long productId);

    Optional<ProductImage> findFirstByProductIdOrderBySortOrderAscIdAsc(Long productId);

    long countByProductId(Long productId);
}
