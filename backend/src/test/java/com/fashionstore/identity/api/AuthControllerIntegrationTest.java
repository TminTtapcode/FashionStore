package com.fashionstore.identity.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fashionstore.identity.api.dto.LoginRequest;
import com.fashionstore.identity.api.dto.RegisterRequest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integration Test: Luồng Xác thực và Kiểm tra Tính hợp lệ (Validation & Security Flow)")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Luồng đầy đủ: Đăng ký thành công -> Cấp HttpOnly Cookie -> Đọc /me -> Đăng xuất")
    void registerAndLoginFlow_setsHttpOnlyCookie_andAccessesMeEndpoint() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "customer.valid@fashionstore.com",
                "Password123",
                "Nguyen Thu Ha",
                "0987654321"
        );

        // 1. Register new customer
        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("fs_session=")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.data.email", is("customer.valid@fashionstore.com")))
                .andExpect(jsonPath("$.data.roles", hasItem("CUSTOMER")))
                .andReturn();

        // 2. Extract cookie from register response
        Cookie authCookie = registerResult.getResponse().getCookie("fs_session");

        // 3. Access /api/v1/auth/me using the HttpOnly cookie
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is("customer.valid@fashionstore.com")))
                .andExpect(jsonPath("$.data.fullName", is("Nguyen Thu Ha")));

        // 4. Access /api/v1/auth/me without cookie should fail with 401
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        // 5. Login with registered credentials
        LoginRequest loginReq = new LoginRequest("customer.valid@fashionstore.com", "Password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("fs_session=")))
                .andExpect(jsonPath("$.data.email", is("customer.valid@fashionstore.com")));

        // 6. Logout should clean the cookie
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    @DisplayName("Validation Error: Gửi email rỗng, mật khẩu yếu và họ tên rỗng -> Trả về 400 kèm chi tiết lỗi từng ô nhập")
    void register_invalidPayload_returnsValidationError() throws Exception {
        RegisterRequest invalidReq = new RegisterRequest("", "123", "", null);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.details.fieldErrors.email").exists())
                .andExpect(jsonPath("$.error.details.fieldErrors.password", containsString("Mật khẩu")))
                .andExpect(jsonPath("$.error.details.fieldErrors.fullName").exists());
    }

    @Test
    @DisplayName("Validation Error: Số điện thoại không đúng chuẩn 10 chữ số của VN -> Trả về 400 kèm lỗi ô phone")
    void register_invalidPhoneNumber_returnsPhoneValidationError() throws Exception {
        RegisterRequest invalidPhoneReq = new RegisterRequest(
                "customer.phone@fashionstore.com",
                "Password123",
                "Tran Van B",
                "0123456789" // Đầu số 01 không hợp lệ
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPhoneReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.details.fieldErrors.phone", containsString("Số điện thoại không hợp lệ")));
    }

    @Test
    @DisplayName("Validation Error: Mật khẩu thiếu chữ số (chỉ có chữ) -> Trả về 400 kèm lỗi ô password")
    void register_weakPasswordWithoutDigits_returnsPasswordValidationError() throws Exception {
        RegisterRequest weakPasswordReq = new RegisterRequest(
                "customer.pwd@fashionstore.com",
                "onlyletterslongpassword", // Không có chữ số
                "Le Van C",
                "0912345678"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPasswordReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.details.fieldErrors.password", containsString("chữ số")));
    }

    @Test
    @DisplayName("Conflict Error: Đăng ký trùng email đã có -> Trả về 409 DUPLICATE_RESOURCE")
    void register_duplicateEmail_returns409Conflict() throws Exception {
        RegisterRequest firstReq = new RegisterRequest(
                "duplicate@fashionstore.com",
                "Password123",
                "Pham Thi D",
                "0933445566"
        );

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstReq)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code", is("DUPLICATE_RESOURCE")))
                .andExpect(jsonPath("$.error.message", containsString("đã tồn tại")));
    }

    @Test
    @DisplayName("Malformed JSON Error: Gửi body JSON sai cú pháp -> Trả về 400 MALFORMED_JSON_REQUEST")
    void register_malformedJson_returns400Malformed() throws Exception {
        String malformedJson = "{ email: 'not-quoted', password: ";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("MALFORMED_JSON_REQUEST")));
    }

    @Test
    @DisplayName("Method Not Allowed: Dùng phương thức GET trên endpoint POST -> Trả về 405 Method Not Allowed")
    void register_getInsteadOfPost_returns405MethodNotAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/auth/register"))
                .andExpect(status().isMethodNotAllowed());
    }
}
