package com.elearning;

import com.elearning.controller.AdminAuditLogController;
import com.elearning.dto.request.AuditLogSearchCriteria;
import com.elearning.dto.response.AuditLogDetailResponse;
import com.elearning.dto.response.AuditLogResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.exception.BusinessException;
import com.elearning.common.ErrorCode;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.ManagementAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminAuditLogController Unit Contract Tests")
class AdminAuditLogControllerTests {

    @Mock
    private ManagementAuditService managementAuditService;

    @InjectMocks
    private AdminAuditLogController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit-logs returns 200 OK with paginated audit logs")
    void testGetAuditLogs_success() throws Exception {
        AuditLogResponse item = new AuditLogResponse(
                101L,
                1L,
                "admin@elearning.com",
                "Admin",
                "USER_ROLE_UPDATE",
                "USER",
                "15",
                "SUCCESS",
                "Cập nhật quyền cho user 15",
                "127.0.0.1",
                LocalDateTime.of(2026, 10, 21, 14, 0)
        );
        PageResponse<AuditLogResponse> pageResponse = new PageResponse<>(
                0,
                20,
                1L,
                1,
                List.of(item)
        );

        when(managementAuditService.getAuditLogs(any(AuditLogSearchCriteria.class), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .param("page", "0")
                        .param("size", "20")
                        .param("actionType", "USER_ROLE_UPDATE")
                        .param("resourceType", "USER")
                        .param("status", "SUCCESS")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.items[0].logId").value(101))
                .andExpect(jsonPath("$.data.items[0].actorUsername").value("admin@elearning.com"))
                .andExpect(jsonPath("$.data.items[0].actionType").value("USER_ROLE_UPDATE"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit-logs returns 400 Bad Request when startDate > endDate")
    void testGetAuditLogs_invalidDateRange() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .param("startDate", "2026-10-25")
                        .param("endDate", "2026-10-20")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit-logs/{id} returns 200 OK with audit detail")
    void testGetAuditLogById_success() throws Exception {
        AuditLogDetailResponse detail = new AuditLogDetailResponse();
        detail.setLogId(202L);
        detail.setActorId(1L);
        detail.setActorUsername("admin@elearning.com");
        detail.setActionType("LESSON_APPROVE");
        detail.setResourceType("LESSON");
        detail.setResourceId("42");
        detail.setStatus("SUCCESS");
        detail.setDetails("Phê duyệt bài học #42");
        detail.setPayloadBefore("{\"status\": \"Pending\"}");
        detail.setPayloadAfter("{\"status\": \"Approved\"}");
        detail.setCreatedAt(LocalDateTime.of(2026, 10, 21, 14, 5));

        when(managementAuditService.getAuditLogById(202L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/admin/audit-logs/202")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.logId").value(202))
                .andExpect(jsonPath("$.data.actionType").value("LESSON_APPROVE"))
                .andExpect(jsonPath("$.data.payloadBefore").value("{\"status\": \"Pending\"}"))
                .andExpect(jsonPath("$.data.payloadAfter").value("{\"status\": \"Approved\"}"));
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit-logs/{id} returns 404 Not Found when record does not exist")
    void testGetAuditLogById_notFound() throws Exception {
        when(managementAuditService.getAuditLogById(999L))
                .thenThrow(new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bản ghi"));

        mockMvc.perform(get("/api/v1/admin/audit-logs/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}
