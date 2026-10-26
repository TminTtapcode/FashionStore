package com.fashionstore.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PhoneNumberValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PhoneNumber {

    String message() default "Số điện thoại không hợp lệ (yêu cầu định dạng 10 chữ số của nhà mạng Việt Nam)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
