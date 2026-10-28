package com.elearning;

import com.elearning.controller.AdminAccountController;
import com.elearning.dto.request.UpdateAccountStatusRequest;
import com.elearning.dto.response.AccountResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.AdminAccountService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Task 8D.1: AdminAccountController Unit Contract Tests")
class AdminAccountControllerTests {

    @Mock
    private AdminAccountService adminAccountService;

    @InjectMocks
    private AdminAccountController adminAccountController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminAccountController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("GIVEN status and search WHEN calling GET /api/v1/admin/accounts THEN returns 200 with PageResponse")
    void testGetAccounts_success() throws Exception {
        AccountResponse acc = new AccountResponse(1L, "user@example.com", "Test User", "Active", List.of("Learner"), LocalDateTime.now(), LocalDateTime.now());
        PageResponse<AccountResponse> pageResponse = new PageResponse<>(0, 10, 1L, 1, List.of(acc));

        when(adminAccountService.getAccounts(eq("Active"), eq("test"), any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/accounts")
                        .param("status", "Active")
                        .param("search", "test")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.items[0].accountId").value(1))
                .andExpect(jsonPath("$.data.items[0].emailOrPhone").value("user@example.com"))
                .andExpect(jsonPath("$.data.items[0].fullName").value("Test User"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(adminAccountService).getAccounts(eq("Active"), eq("test"), any(Pageable.class));
    }

    @Test
    @DisplayName("GIVEN invalid status value WHEN calling PUT /api/v1/admin/accounts/{id}/status THEN returns 400 with VALIDATION_ERROR")
    void testUpdateAccountStatus_invalidStatus_returns400() throws Exception {
        UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("");

        mockMvc.perform(put("/api/v1/admin/accounts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GIVEN valid status payload WHEN calling PUT /api/v1/admin/accounts/{id}/status THEN returns 200")
    void testUpdateAccountStatus_success() throws Exception {
        AccountResponse acc = new AccountResponse(1L, "user@example.com", "Test User", "Inactive", List.of("Learner"), LocalDateTime.now(), LocalDateTime.now());
        when(adminAccountService.updateAccountStatus(eq(1L), any(UpdateAccountStatusRequest.class), any())).thenReturn(acc);

        UpdateAccountStatusRequest request = new UpdateAccountStatusRequest("Inactive");

        mockMvc.perform(put("/api/v1/admin/accounts/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("Cập nhật trạng thái tài khoản thành công"))
                .andExpect(jsonPath("$.data.status").value("Inactive"));
    }
}
