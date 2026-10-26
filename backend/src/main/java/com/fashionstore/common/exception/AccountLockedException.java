package com.fashionstore.common.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends ApiException {

    public AccountLockedException() {
        super(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    public AccountLockedException(String message) {
        super(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", message);
    }
}
