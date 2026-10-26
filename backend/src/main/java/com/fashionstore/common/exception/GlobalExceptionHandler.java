package com.fashionstore.common.exception;

import com.fashionstore.common.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ApiResponse<Void> response = ApiResponse.failure(
                "VALIDATION_ERROR",
                "Dữ liệu gửi lên không hợp lệ",
                Map.of("fieldErrors", errors, "path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at URI: {}", request.getRequestURI(), ex);

        ApiResponse<Void> response = ApiResponse.failure(
                "INTERNAL_SERVER_ERROR",
                "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
                Map.of("path", request.getRequestURI())
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
