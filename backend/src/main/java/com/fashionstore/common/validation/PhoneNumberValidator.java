package com.fashionstore.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PhoneNumberValidator implements ConstraintValidator<PhoneNumber, String> {

    // Vietnam phone numbers: 10 digits starting with 03, 05, 07, 08, 09
    private static final Pattern VN_PHONE_PATTERN = Pattern.compile("^(0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Optional field: if null or empty, considered valid (use @NotBlank if mandatory)
        if (value == null || value.trim().isEmpty()) {
            return true;
        }

        return VN_PHONE_PATTERN.matcher(value.trim()).matches();
    }
}
