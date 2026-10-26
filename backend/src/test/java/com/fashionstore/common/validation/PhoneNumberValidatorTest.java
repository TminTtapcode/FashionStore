package com.fashionstore.common.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Quy tắc kiểm tra tính hợp lệ của Số điện thoại Việt Nam (@PhoneNumber)")
class PhoneNumberValidatorTest {

    private PhoneNumberValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PhoneNumberValidator();
    }

    @ParameterizedTest(name = "Số điện thoại hợp lệ: {0}")
    @ValueSource(strings = {
            "0901234567", // Viettel / Mobifone (090)
            "0387654321", // Viettel (038)
            "0701122334", // Mobifone (070)
            "0812345678", // Vinaphone (081)
            "0567890123"  // Vietnamobile (056)
    })
    void isValid_validVietnamesePhoneNumbers_returnsTrue(String phone) {
        assertTrue(validator.isValid(phone, null), "Số điện thoại chuẩn 10 chữ số của VN phải được chấp nhận");
    }

    @Test
    @DisplayName("Cho phép để trống số điện thoại khi là trường tùy chọn (null hoặc rỗng)")
    void isValid_nullOrEmptyPhone_returnsTrue() {
        assertTrue(validator.isValid(null, null), "Giá trị null phải hợp lệ vì số điện thoại là trường tùy chọn");
        assertTrue(validator.isValid("", null), "Chuỗi rỗng phải hợp lệ");
        assertTrue(validator.isValid("   ", null), "Chuỗi khoảng trắng phải hợp lệ");
    }

    @ParameterizedTest(name = "Số điện thoại không hợp lệ: {0}")
    @ValueSource(strings = {
            "1234567890", // Không bắt đầu bằng số 0
            "0123456789", // Đầu số 01 (đã bị khai tử từ đợt chuyển đổi 11 số sang 10 số)
            "090123456",  // Quá ngắn (9 số)
            "09012345678",// Quá dài (11 số)
            "09012abcde", // Chứa chữ cái
            "090 123 456" // Chứa khoảng trắng ở giữa
    })
    void isValid_invalidPhoneNumbers_returnsFalse(String phone) {
        assertFalse(validator.isValid(phone, null), "Số điện thoại sai quy cách bắt buộc phải bị từ chối");
    }
}
