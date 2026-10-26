package com.fashionstore.common.api;

import java.time.Instant;
import java.util.Map;

public class ApiResponse<T> {

    private final T data;
    private final Map<String, Object> meta;
    private final ErrorDetails error;

    public ApiResponse(T data, Map<String, Object> meta, ErrorDetails error) {
        this.data = data;
        this.meta = meta;
        this.error = error;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, Map.of("timestamp", Instant.now().toString()), null);
    }

    public static <T> ApiResponse<T> success(T data, Map<String, Object> meta) {
        return new ApiResponse<>(data, meta, null);
    }

    public static <T> ApiResponse<T> failure(String code, String message, Object details) {
        return new ApiResponse<>(null, Map.of("timestamp", Instant.now().toString()), new ErrorDetails(code, message, details));
    }

    public T getData() {
        return data;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }

    public ErrorDetails getError() {
        return error;
    }

    public static class ErrorDetails {
        private final String code;
        private final String message;
        private final Object details;

        public ErrorDetails(String code, String message, Object details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public Object getDetails() {
            return details;
        }
    }
}
