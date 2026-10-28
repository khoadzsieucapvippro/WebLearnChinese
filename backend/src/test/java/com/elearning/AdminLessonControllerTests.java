package com.elearning;

import com.elearning.controller.AdminLessonController;
import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.exception.BusinessException;
import com.elearning.common.ErrorCode;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.LessonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Task 8D.4 & TASK-7.2: AdminLessonController Unit Contract Tests")
class AdminLessonControllerTests {

    @Mock
    private LessonService lessonService;

    @InjectMocks
    private AdminLessonController adminLessonController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminLessonController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GIVEN lessons exist across statuses WHEN calling GET /api/v1/admin/lessons THEN returns 200 with PageResponse")
    void testGetAdminLessons_success() throws Exception {
        LessonSummaryResponse l1 = new LessonSummaryResponse(1L, "Lesson Draft", "Draft", 5, LocalDateTime.now(), LocalDateTime.now());
        LessonSummaryResponse l2 = new LessonSummaryResponse(2L, "Lesson Pending", "Pending", 8, LocalDateTime.now(), LocalDateTime.now());
        Page<LessonSummaryResponse> page = new PageImpl<>(List.of(l1, l2), PageRequest.of(0, 10), 2);

        when(lessonService.getAdminLessons(eq("Draft"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/lessons")
                        .param("status", "Draft")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.items[0].title").value("Lesson Draft"))
                .andExpect(jsonPath("$.data.items[0].status").value("Draft"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    @DisplayName("GIVEN existing lesson ID WHEN calling GET /api/v1/admin/lessons/{id} THEN returns 200 with LessonDetailResponse")
    void testGetAdminLessonById_success() throws Exception {
        LessonDetailResponse detail = new LessonDetailResponse(
                42L, "Draft Lesson Title", "Draft", 0, Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(lessonService.getAdminLessonById(42L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/admin/lessons/42")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.lessonId").value(42))
                .andExpect(jsonPath("$.data.title").value("Draft Lesson Title"))
                .andExpect(jsonPath("$.data.status").value("Draft"));
    }

    @Test
    @DisplayName("GIVEN nonexistent lesson ID WHEN calling GET /api/v1/admin/lessons/{id} THEN returns 404 NOT_FOUND")
    void testGetAdminLessonById_notFound() throws Exception {
        when(lessonService.getAdminLessonById(999L))
                .thenThrow(new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bài học với ID: 999"));

        mockMvc.perform(get("/api/v1/admin/lessons/999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("GIVEN valid revoke request WHEN calling POST /api/v1/admin/lessons/{id}/revoke THEN returns 200 with updated Rejected detail")
    void testRevokeLesson_success() throws Exception {
        LessonDetailResponse revoked = new LessonDetailResponse(
                10L, "Harmful Lesson", "Rejected", 0, Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(lessonService.revokeLesson(eq(10L), any(AdminRevokeLessonRequest.class))).thenReturn(revoked);

        mockMvc.perform(post("/api/v1/admin/lessons/10/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Vi phạm bản quyền giáo trình nghiêm trọng\"}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("Rejected"));
    }

    @Test
    @DisplayName("GIVEN blank reason WHEN calling POST /api/v1/admin/lessons/{id}/revoke THEN returns 400 BAD_REQUEST")
    void testRevokeLesson_blankReason() throws Exception {
        mockMvc.perform(post("/api/v1/admin/lessons/10/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"   \"}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GIVEN valid approve request WHEN calling POST /api/v1/admin/lessons/{id}/approve THEN returns 200 with updated Approved detail")
    void testSupervisoryApproveLesson_success() throws Exception {
        LessonDetailResponse approved = new LessonDetailResponse(
                12L, "Disputed Lesson", "Approved", 5, Collections.emptyList(),
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(lessonService.supervisoryApproveLesson(eq(12L), any(ApproveLessonRequest.class))).thenReturn(approved);

        mockMvc.perform(post("/api/v1/admin/lessons/12/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\": \"Trọng tài tối cao duyệt sau khi khiếu nại được làm rõ\"}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("Approved"));
    }

    @Test
    @DisplayName("GIVEN self-review attempt WHEN calling POST /api/v1/admin/lessons/{id}/approve THEN returns 403 FORBIDDEN")
    void testSupervisoryApproveLesson_selfReviewForbidden() throws Exception {
        when(lessonService.supervisoryApproveLesson(eq(15L), any(ApproveLessonRequest.class)))
                .thenThrow(new BusinessException(ErrorCode.FORBIDDEN, "Bạn không thể tự phê duyệt bài học do chính mình tạo ra"));

        mockMvc.perform(post("/api/v1/admin/lessons/15/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}
