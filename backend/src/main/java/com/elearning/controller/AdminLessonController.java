package com.elearning.controller;

import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.service.LessonService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for administrative global lesson oversight & supervisory arbitership (Module 8D.4 & TASK-7.2).
 * Base path: /api/v1/admin/lessons
 * Protected: Requires ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin/lessons")
@PreAuthorize("hasAnyRole('Admin', 'ADMIN')")
public class AdminLessonController {

    private final LessonService lessonService;

    public AdminLessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    /**
     * Retrieves paginated lessons across all lifecycle statuses with optional status filtering.
     *
     * @param status   optional status filter (Draft, Pending, Approved, Rejected)
     * @param pageable pagination parameters
     * @return ApiResponse wrapping PageResponse of LessonSummaryResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<LessonSummaryResponse>>> getAdminLessons(
            @RequestParam(name = "status", required = false) String status,
            Pageable pageable) {
        Page<LessonSummaryResponse> page = lessonService.getAdminLessons(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    /**
     * Retrieves full detail of a specific lesson by ID for administrative oversight (Module 8D.4).
     * Accessible across all lifecycle statuses (Draft, Pending, Approved, Rejected).
     *
     * @param id the lesson primary ID
     * @return ApiResponse wrapping LessonDetailResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> getAdminLessonById(@PathVariable("id") Long id) {
        LessonDetailResponse response = lessonService.getAdminLessonById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Emergency Lesson Revocation (Take-Down) (TASK-7.2).
     * Immediately takes down an 'Approved' lesson, setting status to 'Rejected' with reason.
     *
     * @param id      the lesson primary ID
     * @param request revocation request with reason
     * @return ApiResponse wrapping updated LessonDetailResponse
     */
    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> revokeLesson(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminRevokeLessonRequest request) {
        LessonDetailResponse response = lessonService.revokeLesson(id, request);
        return ResponseEntity.ok(ApiResponse.success("Thu hồi bài học thành công", response));
    }

    /**
     * Supervisory Arbiter Approval (Trọng Tài Tối Cao) (TASK-7.2).
     * Approves a 'Pending' or 'Rejected' lesson that was disputed or delayed.
     * Enforces Self-Review Prohibition (Creator cannot approve own lesson).
     *
     * @param id      the lesson primary ID
     * @param request optional approval notes
     * @return ApiResponse wrapping updated LessonDetailResponse
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> supervisoryApproveLesson(
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) ApproveLessonRequest request) {
        ApproveLessonRequest req = (request != null) ? request : new ApproveLessonRequest();
        LessonDetailResponse response = lessonService.supervisoryApproveLesson(id, req);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt trọng tài bài học thành công", response));
    }
}
