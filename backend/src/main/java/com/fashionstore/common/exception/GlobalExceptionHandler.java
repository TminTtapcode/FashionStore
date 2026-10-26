package com.fashionstore.common.exception;

import com.fashionstore.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles @Valid request body validation errors.
     * Returns individual field error messages mapped to field names.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        ApiResponse<Void> response = ApiResponse.failure(
                "VALIDATION_ERROR",
                "Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại các trường bên dưới",
                Map.of("fieldErrors", fieldErrors, "path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handles constraint violations from query params or path variables (e.g. @Min, @NotBlank).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> violations = new LinkedHashMap<>();

        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String propertyPath = violation.getPropertyPath().toString();
            violations.put(propertyPath, violation.getMessage());
        }

        ApiResponse<Void> response = ApiResponse.failure(
                "CONSTRAINT_VIOLATION",
                "Tham số yêu cầu không hợp lệ",
                Map.of("violations", violations, "path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handles malformed JSON payloads or type mismatch in request body.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request at URI: {}: {}", request.getRequestURI(), ex.getMessage());

        ApiResponse<Void> response = ApiResponse.failure(
                "MALFORMED_JSON_REQUEST",
                "Nội dung yêu cầu (JSON) không hợp lệ hoặc sai định dạng kiểu dữ liệu",
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handles method argument type mismatch in path/query parameters (e.g. passing a string for Long).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = String.format("Tham số '%s' nhận giá trị '%s' không đúng kiểu dữ liệu yêu cầu",
                ex.getName(), ex.getValue());

        ApiResponse<Void> response = ApiResponse.failure(
                "INVALID_PARAMETER_TYPE",
                message,
                Map.of("parameter", ex.getName(), "path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handles unsupported HTTP methods (e.g. GET instead of POST).
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String message = String.format("Phương thức HTTP '%s' không được hỗ trợ cho endpoint này", ex.getMethod());
        java.util.List<String> supportedMethods = ex.getSupportedHttpMethods() != null
                ? ex.getSupportedHttpMethods().stream().map(org.springframework.http.HttpMethod::name).toList()
                : java.util.List.of();

        ApiResponse<Void> response = ApiResponse.failure(
                "METHOD_NOT_ALLOWED",
                message,
                Map.of("supportedMethods", supportedMethods, "path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * Handles custom business API exceptions.
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(
            ApiException ex, HttpServletRequest request) {
        ApiResponse<Void> response = ApiResponse.failure(
                ex.getCode(),
                ex.getMessage(),
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    /**
     * Handles Spring Security access denied errors (403 Forbidden).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        ApiResponse<Void> response = ApiResponse.failure(
                "ACCESS_DENIED",
                "Bạn không có quyền thực hiện thao tác này",
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handles Spring Security unauthenticated errors (401 Unauthorized).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        ApiResponse<Void> response = ApiResponse.failure(
                "UNAUTHORIZED",
                "Vui lòng đăng nhập để tiếp tục",
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Catch-all handler for unexpected internal server errors (500).
     * Never exposes raw SQL or exception stack traces to clients.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled internal server error at URI: {}", request.getRequestURI(), ex);

        ApiResponse<Void> response = ApiResponse.failure(
                "INTERNAL_SERVER_ERROR",
                "Đã xảy ra lỗi hệ thống nội bộ. Vui lòng thử lại sau.",
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
