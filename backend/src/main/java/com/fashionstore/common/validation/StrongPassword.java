package com.fashionstore.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    String message() default "Mật khẩu phải chứa từ 8 đến 50 ký tự, bao gồm ít nhất một chữ cái và một chữ số";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
