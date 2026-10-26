package com.fashionstore.identity.application;

import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.identity.api.dto.AuthResult;
import com.fashionstore.identity.api.dto.LoginRequest;
import com.fashionstore.identity.api.dto.RegisterRequest;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.domain.UserStatus;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.domain.DiscountType;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private Role customerRole;
    private Coupon welcomeCoupon;

    @BeforeEach
    void setUp() {
        customerRole = new Role("CUSTOMER", "Customer Role");
        welcomeCoupon = new Coupon();
        welcomeCoupon.setCode("WELCOME10");
        welcomeCoupon.setDescription("Welcome voucher");
        welcomeCoupon.setDiscountType(DiscountType.PERCENTAGE);
        welcomeCoupon.setDiscountValue(BigDecimal.valueOf(10.0));
    }

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest("test@fashionstore.com", "password123", "Nguyen Van A", "0901234567");

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(roleRepository.findByCode("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(couponRepository.findByCodeIgnoreCaseAndStatus("WELCOME10", "ACTIVE")).thenReturn(Optional.of(welcomeCoupon));
        when(tokenProvider.generateToken(any())).thenReturn("mock.jwt.token");

        AuthResult result = authService.register(request);

        assertNotNull(result);
        assertEquals("test@fashionstore.com", result.user().email());
        assertEquals("Nguyen Van A", result.user().fullName());
        assertEquals("mock.jwt.token", result.token());
        assertNotNull(result.user().welcomeCoupon());
        assertEquals("WELCOME10", result.user().welcomeCoupon().code());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest("existing@fashionstore.com", "password123", "Nguyen Van A", null);

        when(userRepository.existsByEmailIgnoreCase("existing@fashionstore.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(request));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("DUPLICATE_RESOURCE", ex.getCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success() {
        LoginRequest request = new LoginRequest("test@fashionstore.com", "password123");
        User user = new User("test@fashionstore.com", "hashedPassword", "Nguyen Van A", null);
        user.addRole(customerRole);

        when(userRepository.findByEmailIgnoreCase("test@fashionstore.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCaseAndStatus("WELCOME10", "ACTIVE")).thenReturn(Optional.of(welcomeCoupon));
        when(tokenProvider.generateToken(any())).thenReturn("mock.jwt.token");

        AuthResult result = authService.login(request);

        assertNotNull(result);
        assertEquals("test@fashionstore.com", result.user().email());
        assertEquals("mock.jwt.token", result.token());
    }

    @Test
    void login_invalidPassword_throwsUnauthorized() {
        LoginRequest request = new LoginRequest("test@fashionstore.com", "wrongPassword");
        User user = new User("test@fashionstore.com", "hashedPassword", "Nguyen Van A", null);

        when(userRepository.findByEmailIgnoreCase("test@fashionstore.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("INVALID_CREDENTIALS", ex.getCode());
    }

    @Test
    void login_lockedAccount_throwsForbidden() {
        LoginRequest request = new LoginRequest("test@fashionstore.com", "password123");
        User user = new User("test@fashionstore.com", "hashedPassword", "Nguyen Van A", null);
        user.setStatus(UserStatus.LOCKED);

        when(userRepository.findByEmailIgnoreCase("test@fashionstore.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> authService.login(request));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("ACCOUNT_LOCKED", ex.getCode());
    }
}
