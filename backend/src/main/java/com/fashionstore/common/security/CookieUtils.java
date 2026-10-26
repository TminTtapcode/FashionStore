package com.fashionstore.common.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtils {

    private final String cookieName;
    private final boolean secure;
    private final String sameSite;
    private final long maxAgeSeconds;

    public CookieUtils(
            @Value("${app.auth.cookie-name:fs_session}") String cookieName,
            @Value("${app.auth.cookie-secure:false}") boolean secure,
            @Value("${app.auth.cookie-same-site:Lax}") String sameSite,
            @Value("${app.jwt.expiration-seconds:86400}") long maxAgeSeconds) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.sameSite = sameSite;
        this.maxAgeSeconds = maxAgeSeconds;
    }

    public ResponseCookie createAuthCookie(String token) {
        return ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .sameSite(sameSite)
                .build();
    }

    public ResponseCookie createCleanAuthCookie() {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();
    }

    public Optional<String> extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(val -> !val.isBlank())
                .findFirst();
    }

    public String getCookieName() {
        return cookieName;
    }
}
