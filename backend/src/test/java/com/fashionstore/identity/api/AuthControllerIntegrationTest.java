package com.fashionstore.identity.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fashionstore.identity.api.dto.LoginRequest;
import com.fashionstore.identity.api.dto.RegisterRequest;
import jakarta.servlet.http.Cookie;
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
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerAndLoginFlow_setsHttpOnlyCookie_andAccessesMeEndpoint() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "customer1@fashionstore.com",
                "password123",
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
                .andExpect(jsonPath("$.data.email", is("customer1@fashionstore.com")))
                .andExpect(jsonPath("$.data.roles", hasItem("CUSTOMER")))
                .andReturn();

        // 2. Extract cookie from register response
        Cookie authCookie = registerResult.getResponse().getCookie("fs_session");

        // 3. Access /api/v1/auth/me using the HttpOnly cookie
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email", is("customer1@fashionstore.com")))
                .andExpect(jsonPath("$.data.fullName", is("Nguyen Thu Ha")));

        // 4. Access /api/v1/auth/me without cookie should fail with 401
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        // 5. Login with registered credentials
        LoginRequest loginReq = new LoginRequest("customer1@fashionstore.com", "password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("fs_session=")))
                .andExpect(jsonPath("$.data.email", is("customer1@fashionstore.com")));

        // 6. Logout should clean the cookie
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void register_invalidPayload_returnsValidationError() throws Exception {
        RegisterRequest invalidReq = new RegisterRequest("", "123", "", null);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.details.fieldErrors.email").exists())
                .andExpect(jsonPath("$.error.details.fieldErrors.password").exists());
    }
}
