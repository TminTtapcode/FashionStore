package com.fashionstore.catalog.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlugAndStatus(String slug, CategoryStatus status);

    Optional<Category> findBySlug(String slug);

    List<Category> findByParentIsNullAndStatusOrderBySortOrderAscIdAsc(CategoryStatus status);

    List<Category> findByStatusOrderBySortOrderAscIdAsc(CategoryStatus status);

    @Query("SELECT c.id FROM Category c WHERE c.id = :id OR c.parent.id = :id")
    List<Long> findSelfAndChildIds(@Param("id") Long id);

    boolean existsBySlug(String slug);
}
