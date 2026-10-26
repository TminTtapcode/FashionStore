package com.fashionstore.catalog.application;

import com.fashionstore.catalog.domain.Product;
import com.fashionstore.catalog.domain.ProductStatus;
import com.fashionstore.catalog.domain.ProductVariant;
import com.fashionstore.catalog.domain.ProductVariantStatus;
import com.fashionstore.catalog.dto.ProductFilterRequest;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> buildSpecification(ProductFilterRequest filter, List<Long> categoryIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Only ACTIVE products are visible on storefront
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            // 2. Category filter (including child categories)
            if (categoryIds != null && !categoryIds.isEmpty()) {
                predicates.add(root.get("category").get("id").in(categoryIds));
            }

            // 3. Search by keyword
            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate brandMatch = cb.like(cb.lower(root.get("brand")), searchPattern);
                Predicate materialMatch = cb.like(cb.lower(root.get("material")), searchPattern);
                predicates.add(cb.or(nameMatch, brandMatch, materialMatch));
            }

            // 4. Variant-based filters: size, color, price range, in-stock
            boolean hasVariantFilter = (filter.getSize() != null && !filter.getSize().trim().isEmpty())
                    || (filter.getColor() != null && !filter.getColor().trim().isEmpty())
                    || filter.getMinPrice() != null
                    || filter.getMaxPrice() != null
                    || filter.getInStockOnly();

            if (hasVariantFilter) {
                // Use a subquery to avoid cartesian duplicate products in the result set
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<ProductVariant> variantRoot = subquery.from(ProductVariant.class);
                subquery.select(variantRoot.get("product").get("id"));

                List<Predicate> variantPredicates = new ArrayList<>();
                variantPredicates.add(cb.equal(variantRoot.get("product").get("id"), root.get("id")));
                variantPredicates.add(cb.equal(variantRoot.get("status"), ProductVariantStatus.ACTIVE));

                if (filter.getSize() != null && !filter.getSize().trim().isEmpty()) {
                    variantPredicates.add(cb.equal(cb.upper(variantRoot.get("size")), filter.getSize().trim().toUpperCase()));
                }

                if (filter.getColor() != null && !filter.getColor().trim().isEmpty()) {
                    String color = filter.getColor().trim();
                    Predicate colorNameMatch = cb.equal(cb.lower(variantRoot.get("colorName")), color.toLowerCase());
                    Predicate colorHexMatch = cb.equal(cb.lower(variantRoot.get("colorHex")), color.toLowerCase());
                    variantPredicates.add(cb.or(colorNameMatch, colorHexMatch));
                }

                if (filter.getMinPrice() != null) {
                    variantPredicates.add(cb.greaterThanOrEqualTo(variantRoot.get("price"), filter.getMinPrice()));
                }

                if (filter.getMaxPrice() != null) {
                    variantPredicates.add(cb.lessThanOrEqualTo(variantRoot.get("price"), filter.getMaxPrice()));
                }

                if (filter.getInStockOnly()) {
                    variantPredicates.add(cb.greaterThan(variantRoot.get("stockQuantity"), 0));
                }

                subquery.where(variantPredicates.toArray(new Predicate[0]));
                predicates.add(cb.exists(subquery));
            }

            // 5. Whitelist sorting (only for content query, never for count query)
            if (Long.class != query.getResultType()) {
                String sort = filter.getSort() != null ? filter.getSort().toLowerCase() : "newest";
                switch (sort) {
                    case "price_asc": {
                        Subquery<BigDecimal> priceSubquery = query.subquery(BigDecimal.class);
                        Root<ProductVariant> pv = priceSubquery.from(ProductVariant.class);
                        priceSubquery.select(cb.least(pv.<BigDecimal>get("price")));
                        priceSubquery.where(cb.equal(pv.get("product"), root), cb.equal(pv.get("status"), ProductVariantStatus.ACTIVE));
                        query.orderBy(cb.asc(priceSubquery), cb.asc(root.get("id")));
                        break;
                    }
                    case "price_desc": {
                        Subquery<BigDecimal> priceSubquery = query.subquery(BigDecimal.class);
                        Root<ProductVariant> pv = priceSubquery.from(ProductVariant.class);
                        priceSubquery.select(cb.greatest(pv.<BigDecimal>get("price")));
                        priceSubquery.where(cb.equal(pv.get("product"), root), cb.equal(pv.get("status"), ProductVariantStatus.ACTIVE));
                        query.orderBy(cb.desc(priceSubquery), cb.desc(root.get("id")));
                        break;
                    }
                    case "name_asc": {
                        query.orderBy(cb.asc(root.get("name")), cb.asc(root.get("id")));
                        break;
                    }
                    default: {
                        // "newest"
                        query.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
                        break;
                    }
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
