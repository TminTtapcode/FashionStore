package com.fashionstore.common.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Quy tắc kiểm tra độ mạnh mật khẩu (@StrongPassword)")
class StrongPasswordValidatorTest {

    private StrongPasswordValidator validator;

    @BeforeEach
    void setUp() {
        validator = new StrongPasswordValidator();
    }

    @ParameterizedTest(name = "Mật khẩu an toàn hợp lệ: {0}")
    @ValueSource(strings = {
            "password123",        // 11 ký tự, có chữ và số
            "FashionStore2026",   // Chữ hoa, chữ thường và số
            "abcxyz12",           // Đúng 8 ký tự, có chữ và số
            "Admin#2026Secret!"   // Có ký tự đặc biệt, chữ và số
    })
    void isValid_strongPasswords_returnsTrue(String password) {
        assertTrue(validator.isValid(password, null), "Mật khẩu từ 8 ký tự trở lên có cả chữ và số phải hợp lệ");
    }

    @ParameterizedTest(name = "Mật khẩu yếu không hợp lệ: {0}")
    @ValueSource(strings = {
            "pass1",              // Quá ngắn (< 8 ký tự)
            "12345678",           // Chỉ có số, không có chữ cái
            "onlylettersnodigit", // Chỉ có chữ, không có chữ số
            "       1a",          // Khoảng trắng đầu
            "a1"                  // Quá ngắn
    })
    void isValid_weakPasswords_returnsFalse(String password) {
        assertFalse(validator.isValid(password, null), "Mật khẩu không thỏa mãn điều kiện độ dài/ký tự phải bị từ chối");
    }

    @Test
    @DisplayName("Từ chối mật khẩu null")
    void isValid_nullPassword_returnsFalse() {
        assertFalse(validator.isValid(null, null), "Mật khẩu null bắt buộc không hợp lệ");
    }
}
