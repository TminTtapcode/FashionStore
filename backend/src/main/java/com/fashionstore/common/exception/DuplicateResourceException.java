package com.fashionstore.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends ApiException {

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(
                HttpStatus.CONFLICT,
                "DUPLICATE_RESOURCE",
                String.format("%s với %s = '%s' đã tồn tại trong hệ thống", resourceName, fieldName, fieldValue)
        );
    }

    public DuplicateResourceException(String message) {
        super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message);
    }
}
