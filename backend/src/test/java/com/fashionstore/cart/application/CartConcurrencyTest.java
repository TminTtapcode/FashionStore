package com.fashionstore.cart.application;

import com.fashionstore.cart.api.dto.AddCartItemRequest;
import com.fashionstore.cart.api.dto.CartDto;
import com.fashionstore.cart.domain.CartItemRepository;
import com.fashionstore.cart.domain.CartRepository;
import com.fashionstore.catalog.domain.*;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Concurrency Test: Kiểm thử cạnh tranh khi nhiều luồng cùng thêm một biến thể vào giỏ")
class CartConcurrencyTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    private User testUser;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(new User("concurrent.cart@fashionstore.com", "hash", "Concurrent User", "0933333333"));

        Category category = categoryRepository.save(new Category("Thời trang Nam", "nam-concurrent", "Mô tả", null, 1));

        Product product = new Product(1L, category, "Áo Sơ Mi Oxford", "ao-so-mi-oxford-concurrent", "Mô tả", "Atelier", "Cotton", "Slim", "Giặt máy", "{}", ProductStatus.ACTIVE);
        testVariant = new ProductVariant(product, "CONCURRENT-SKU-M", "M", "Xanh Biển", "#0000FF", new BigDecimal("450000.00"), new BigDecimal("550000.00"), 50, ProductVariantStatus.ACTIVE);
        product.addVariant(testVariant);

        productRepository.save(product);
    }

    @AfterEach
    void tearDown() {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("5 luồng đồng thời gọi addItem cho cùng một variant: Đảm bảo chỉ có 1 dòng CartItem và không lỗi crash")
    void concurrentAdd_doesNotCreateDuplicateItems() throws InterruptedException {
        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Chờ tất cả 5 luồng sẵn sàng rồi kích hoạt cùng tích tắc
                    cartService.addItem(testUser.getId(), new AddCartItemRequest(testVariant.getId(), 1));
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    errorCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Bắn pháo hiệu chạy đồng thời
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm tra trong database: Phải duy nhất 1 dòng CartItem cho variant này
        CartDto cart = cartService.getCart(testUser.getId());
        assertThat(cart.getItems()).hasSize(1);
        assertThat(cart.getItems().get(0).getVariantId()).isEqualTo(testVariant.getId());
        // Số lượng trong item phải bằng số request thành công
        assertThat(cart.getItems().get(0).getQuantity()).isEqualTo(successCount.get());
        assertThat(successCount.get()).isGreaterThanOrEqualTo(1);
    }
}
