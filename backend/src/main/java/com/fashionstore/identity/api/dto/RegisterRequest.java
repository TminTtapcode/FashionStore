package com.fashionstore.identity.api.dto;

import com.fashionstore.common.validation.PhoneNumber;
import com.fashionstore.common.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Định dạng email không hợp lệ (ví dụ: customer@domain.com)")
        @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @StrongPassword(message = "Mật khẩu phải chứa từ 8 đến 50 ký tự, bao gồm ít nhất một chữ cái và một chữ số")
        String password,

        @NotBlank(message = "Họ và tên không được để trống")
        @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
        String fullName,

        @PhoneNumber(message = "Số điện thoại không hợp lệ (yêu cầu định dạng 10 chữ số của nhà mạng Việt Nam, ví dụ: 0901234567)")
        String phone
) {}
