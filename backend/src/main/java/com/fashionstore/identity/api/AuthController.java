package com.fashionstore.identity.api;

import com.fashionstore.common.api.ApiResponse;
import com.fashionstore.common.security.CookieUtils;
import com.fashionstore.common.security.UserPrincipal;
import com.fashionstore.identity.api.dto.AuthResult;
import com.fashionstore.identity.api.dto.LoginRequest;
import com.fashionstore.identity.api.dto.RegisterRequest;
import com.fashionstore.identity.api.dto.UserDto;
import com.fashionstore.identity.application.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtils cookieUtils;

    public AuthController(AuthService authService, CookieUtils cookieUtils) {
        this.authService = authService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result = authService.register(request);
        ResponseCookie cookie = cookieUtils.createAuthCookie(result.token());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(result.user(), Map.of("message", "Đăng ký tài khoản thành công!")));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request);
        ResponseCookie cookie = cookieUtils.createAuthCookie(result.token());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(result.user(), Map.of("message", "Đăng nhập thành công!")));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Map<String, String>>> logout() {
        ResponseCookie cleanCookie = cookieUtils.createCleanAuthCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .body(ApiResponse.success(Map.of("message", "Đăng xuất thành công")));
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = authService.getCurrentUser(principal);
        return ApiResponse.success(user);
    }
}
