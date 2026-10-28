package com.fashionstore.catalog.application;

import com.fashionstore.catalog.domain.ProductRepository;
import com.fashionstore.catalog.domain.ProductVariantRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class SkuGeneratorService {

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern NON_ALPHANUMERIC_PATTERN = Pattern.compile("[^a-zA-Z0-9]+");
    private static final int MAX_SKU_LENGTH = 60;
    private static final int MAX_SLUG_LENGTH = 280;

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;

    public SkuGeneratorService(ProductVariantRepository variantRepository, ProductRepository productRepository) {
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
    }

    /**
     * Generates a unique, standardized SKU in the format: {PRODUCT_CODE}-{COLOR_CODE}-{SIZE}
     * Guarantees length <= 60 characters and uniqueness in the database.
     */
    public String generateUniqueSku(String productNameOrSlug, String colorName, String size) {
        String productCode = cleanSegment(productNameOrSlug, 25);
        if (productCode.isEmpty()) {
            productCode = "PROD";
        }

        String colorCode = cleanSegment(colorName, 15);
        if (colorCode.isEmpty()) {
            colorCode = "CLR";
        }

        String sizeCode = cleanSegment(size, 10);
        if (sizeCode.isEmpty()) {
            sizeCode = "STD";
        }

        String baseSku = String.format("%s-%s-%s", productCode, colorCode, sizeCode).toUpperCase(Locale.ROOT);
        if (baseSku.length() > 50) {
            baseSku = baseSku.substring(0, 50);
        }

        String candidate = baseSku;
        int counter = 2;
        while (variantRepository.existsBySku(candidate)) {
            String suffix = "-" + counter;
            int maxBaseLen = MAX_SKU_LENGTH - suffix.length();
            if (baseSku.length() > maxBaseLen) {
                candidate = baseSku.substring(0, maxBaseLen) + suffix;
            } else {
                candidate = baseSku + suffix;
            }
            counter++;
        }

        return candidate;
    }

    /**
     * Converts arbitrary Vietnamese or accented text into an SEO-friendly kebab-case slug.
     */
    public String toSlug(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "san-pham";
        }

        String normalized = removeVietnameseAccents(text.trim());
        String slug = NON_ALPHANUMERIC_PATTERN.matcher(normalized).replaceAll("-")
                .replaceAll("^-+|-+$", "")
                .toLowerCase(Locale.ROOT);

        if (slug.isEmpty()) {
            slug = "san-pham";
        }

        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-+$", "");
        }

        return slug;
    }

    /**
     * Generates a unique slug for a product, appending -2, -3 if already taken by another product.
     */
    public String generateUniqueSlug(String name, String preferredSlug, Long excludeProductId) {
        String baseSlug = (preferredSlug != null && !preferredSlug.trim().isEmpty())
                ? toSlug(preferredSlug)
                : toSlug(name);

        String candidate = baseSlug;
        int counter = 2;

        while (isSlugTaken(candidate, excludeProductId)) {
            String suffix = "-" + counter;
            int maxBase = MAX_SLUG_LENGTH - suffix.length();
            if (baseSlug.length() > maxBase) {
                candidate = baseSlug.substring(0, maxBase) + suffix;
            } else {
                candidate = baseSlug + suffix;
            }
            counter++;
        }

        return candidate;
    }

    private boolean isSlugTaken(String slug, Long excludeProductId) {
        if (excludeProductId == null) {
            return productRepository.existsBySlug(slug);
        }
        return productRepository.existsBySlugAndIdNot(slug, excludeProductId);
    }

    private String cleanSegment(String text, int maxLen) {
        if (text == null) return "";
        String unaccented = removeVietnameseAccents(text.trim());
        String cleaned = NON_ALPHANUMERIC_PATTERN.matcher(unaccented).replaceAll("-")
                .replaceAll("^-+|-+$", "");
        if (cleaned.length() > maxLen) {
            cleaned = cleaned.substring(0, maxLen).replaceAll("-+$", "");
        }
        return cleaned;
    }

    public static String removeVietnameseAccents(String str) {
        if (str == null) return "";
        // Pre-replace special Vietnamese letters Đ and đ
        String result = str.replace('Đ', 'D').replace('đ', 'd');
        String nfdNormalized = Normalizer.normalize(result, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(nfdNormalized).replaceAll("");
    }
}

