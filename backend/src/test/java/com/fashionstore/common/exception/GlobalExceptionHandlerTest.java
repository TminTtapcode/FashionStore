package com.fashionstore.common.exception;

import com.fashionstore.common.api.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Bộ xử lý lỗi tập trung toàn hệ thống (GlobalExceptionHandler)")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/test");
    }

    @Test
    @DisplayName("Bắt lỗi @Valid Bean Validation: Trả về 400 kèm chi tiết lỗi từng ô nhập (fieldErrors)")
    void handleMethodArgumentNotValid_returnsFieldErrorsMap() throws Exception {
        Object target = new Object();
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(target, "registerRequest");
        bindingResult.addError(new FieldError("registerRequest", "email", "Định dạng email không hợp lệ"));
        bindingResult.addError(new FieldError("registerRequest", "password", "Mật khẩu quá ngắn"));

        Method dummyMethod = this.getClass().getDeclaredMethod("setUp");
        MethodParameter parameter = new MethodParameter(dummyMethod, -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleMethodArgumentNotValid(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_ERROR", response.getBody().getError().getCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> details = (Map<String, Object>) response.getBody().getError().getDetails();
        @SuppressWarnings("unchecked")
        Map<String, String> fieldErrors = (Map<String, String>) details.get("fieldErrors");

        assertEquals(2, fieldErrors.size());
        assertEquals("Định dạng email không hợp lệ", fieldErrors.get("email"));
        assertEquals("Mật khẩu quá ngắn", fieldErrors.get("password"));
    }

    @Test
    @DisplayName("Bắt lỗi JSON sai định dạng (HttpMessageNotReadableException): Trả về 400 MALFORMED_JSON_REQUEST")
    void handleHttpMessageNotReadable_returnsBadRequest() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("JSON parse error");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleHttpMessageNotReadable(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("MALFORMED_JSON_REQUEST", response.getBody().getError().getCode());
    }

    @Test
    @DisplayName("Bắt lỗi sai kiểu tham số (MethodArgumentTypeMismatchException): Trả về 400 INVALID_PARAMETER_TYPE")
    void handleTypeMismatch_returnsBadRequest() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Long.class, "id", null, null);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleTypeMismatch(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("INVALID_PARAMETER_TYPE", response.getBody().getError().getCode());
        assertTrue(response.getBody().getError().getMessage().contains("id"));
    }

    @Test
    @DisplayName("Bắt lỗi sai HTTP Method (HttpRequestMethodNotSupportedException): Trả về 405 METHOD_NOT_ALLOWED")
    void handleMethodNotSupported_returns405() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException(
                "GET", List.of("POST", "PUT"));

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleMethodNotSupported(ex, request);

        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
        assertEquals("METHOD_NOT_ALLOWED", response.getBody().getError().getCode());
        assertTrue(response.getBody().getError().getMessage().contains("GET"));
    }

    @Test
    @DisplayName("Bắt lỗi tài nguyên không tồn tại (ResourceNotFoundException): Trả về 404 NOT_FOUND")
    void handleApiException_resourceNotFound_returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Sản phẩm", "id", 999L);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleApiException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().getError().getCode());
        assertEquals("Không tìm thấy Sản phẩm với id = '999'", response.getBody().getError().getMessage());
    }

    @Test
    @DisplayName("Bắt lỗi trùng dữ liệu (DuplicateResourceException): Trả về 409 CONFLICT")
    void handleApiException_duplicateResource_returns409() {
        DuplicateResourceException ex = new DuplicateResourceException("Người dùng", "email", "test@domain.com");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleApiException(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("DUPLICATE_RESOURCE", response.getBody().getError().getCode());
        assertEquals("Người dùng với email = 'test@domain.com' đã tồn tại trong hệ thống", response.getBody().getError().getMessage());
    }

    @Test
    @DisplayName("Bắt lỗi không đủ quyền hạn (AccessDeniedException): Trả về 403 FORBIDDEN")
    void handleAccessDenied_returns403() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("ACCESS_DENIED", response.getBody().getError().getCode());
    }

    @Test
    @DisplayName("Bắt lỗi chưa đăng nhập (AuthenticationException): Trả về 401 UNAUTHORIZED")
    void handleAuthenticationException_returns401() {
        BadCredentialsException ex = new BadCredentialsException("Unauthenticated");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAuthenticationException(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("UNAUTHORIZED", response.getBody().getError().getCode());
    }

    @Test
    @DisplayName("Bắt lỗi hệ thống không xác định (Exception): Trả về 500 an toàn, không rò rỉ stack trace")
    void handleGeneralException_returns500WithoutLeakingDetails() {
        RuntimeException ex = new RuntimeException("Lỗi SQL nhạy cảm hoặc NPE nội bộ");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneralException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getError().getCode());
        assertFalse(response.getBody().getError().getMessage().contains("SQL"), "Không được để lộ chi tiết nội bộ cho client");
    }
}
