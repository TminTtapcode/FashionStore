package com.fashionstore.identity.application;

import com.fashionstore.common.exception.ApiException;
import com.fashionstore.common.security.JwtTokenProvider;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.api.dto.*;
import com.fashionstore.identity.domain.Role;
import com.fashionstore.identity.domain.User;
import com.fashionstore.identity.domain.UserStatus;
import com.fashionstore.identity.infrastructure.RoleRepository;
import com.fashionstore.identity.infrastructure.UserRepository;
import com.fashionstore.promotion.domain.Coupon;
import com.fashionstore.promotion.infrastructure.CouponRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            CouponRepository couponRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.couponRepository = couponRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Email này đã được đăng ký trong hệ thống");
        }

        Role customerRole = roleRepository.findByCode("CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role("CUSTOMER", "Khách hàng mua sắm")));

        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                request.phone() != null ? request.phone().trim() : null
        );
        user.addRole(customerRole);
        User savedUser = userRepository.save(user);

        // Fetch welcome coupon incentive
        WelcomeCouponDto welcomeCoupon = findWelcomeCoupon();

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = tokenProvider.generateToken(principal);

        UserDto userDto = toUserDto(savedUser, welcomeCoupon);
        return new AuthResult(userDto, token);
    }

    @Transactional(readOnly = true)
    public AuthResult login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        WelcomeCouponDto welcomeCoupon = findWelcomeCoupon();
        UserPrincipal principal = UserPrincipal.create(user);
        String token = tokenProvider.generateToken(principal);

        UserDto userDto = toUserDto(user, welcomeCoupon);
        return new AuthResult(userDto, token);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Không tìm thấy thông tin tài khoản"));

        return toUserDto(user, findWelcomeCoupon());
    }

    private WelcomeCouponDto findWelcomeCoupon() {
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndStatus("WELCOME10", "ACTIVE");
        return couponOpt.map(c -> new WelcomeCouponDto(
                c.getCode(),
                c.getDescription(),
                c.getDiscountType().name(),
                c.getDiscountValue()
        )).orElse(null);
    }

    private UserDto toUserDto(User user, WelcomeCouponDto welcomeCoupon) {
        Set<String> roleCodes = user.getRoles().stream()
                .map(Role::getCode)
                .collect(Collectors.toSet());

        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                roleCodes,
                welcomeCoupon
        );
    }
}
