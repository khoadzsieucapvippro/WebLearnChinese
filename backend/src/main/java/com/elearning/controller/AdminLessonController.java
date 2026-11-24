package com.elearning.controller;

import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.request.CreateLessonRequest;
import com.elearning.dto.request.ReorderVocabRequest;
import com.elearning.dto.request.UpdateLessonRequest;
import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.ImportValidationReport;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.dto.response.PageResponse;
import com.elearning.service.LessonService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST Controller for administrative global lesson oversight, creation, publishing,
 * and direct management without moderation queue (Single Authority / Zero-Moderation).
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
     * Retrieves full detail of a specific lesson by ID for administrative oversight.
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
     * Creates a new lesson, auto-publishing directly with status 'Approved'.
     *
     * @param request lesson creation parameters
     * @return 201 Created with LessonDetailResponse
     */
    @PostMapping
    public ResponseEntity<ApiResponse<LessonDetailResponse>> createLesson(
            @Valid @RequestBody CreateLessonRequest request) {
        LessonDetailResponse response = lessonService.createAdminLesson(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo bài học và xuất bản thành công", response));
    }

    /**
     * Step 1: Uploads and validates an Excel file for preview.
     *
     * @param file uploaded .xlsx file
     * @return 200 OK with ImportValidationReport
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImportValidationReport>> importPreview(
            @RequestParam("file") MultipartFile file) {
        ImportValidationReport report = lessonService.previewAdminLessonImport(file);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    /**
     * Step 2: Confirms creation of a new lesson and constituent vocabulary items from Excel,
     * auto-publishing directly with status 'Approved'.
     *
     * @param title title of the new lesson
     * @param file  the uploaded .xlsx file
     * @return 201 Created with LessonDetailResponse
     */
    @PostMapping(value = "/import/confirm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<LessonDetailResponse>> importConfirm(
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file) {
        LessonDetailResponse response = lessonService.importAdminLessonFromExcel(title, file);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nhập bài học từ Excel và xuất bản thành công", response));
    }

    /**
     * Updates an existing lesson's title / metadata.
     *
     * @param id      lesson primary ID
     * @param request update payload
     * @return 200 OK with updated LessonDetailResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> updateLesson(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateLessonRequest request) {
        LessonDetailResponse response = lessonService.updateAdminLesson(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bài học thành công", response));
    }

    /**
     * Deletes a lesson.
     *
     * @param id lesson primary ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable("id") Long id) {
        lessonService.deleteAdminLesson(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Adds a vocabulary to a lesson.
     *
     * @param id      lesson primary ID
     * @param vocabId vocabulary primary ID
     * @return 200 OK with updated LessonDetailResponse
     */
    @PostMapping("/{id}/vocabularies/{vocabId}")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> addVocabularyToLesson(
            @PathVariable("id") Long id,
            @PathVariable("vocabId") Long vocabId) {
        LessonDetailResponse response = lessonService.addVocabularyToAdminLesson(id, vocabId);
        return ResponseEntity.ok(ApiResponse.success("Thêm từ vựng vào bài học thành công", response));
    }

    /**
     * Removes a vocabulary from a lesson.
     *
     * @param id      lesson primary ID
     * @param vocabId vocabulary primary ID
     * @return 200 OK with updated LessonDetailResponse
     */
    @DeleteMapping("/{id}/vocabularies/{vocabId}")
    public ResponseEntity<ApiResponse<LessonDetailResponse>> removeVocabularyFromLesson(
            @PathVariable("id") Long id,
            @PathVariable("vocabId") Long vocabId) {
        LessonDetailResponse response = lessonService.removeVocabularyFromAdminLesson(id, vocabId);
        return ResponseEntity.ok(ApiResponse.success("Xóa từ vựng khỏi bài học thành công", response));
    }

    /**
     * Reorders vocabulary items within a lesson.
     * Supports both PUT and POST.
     *
     * @param id      lesson primary ID
     * @param request reorder payload
     * @return 200 OK with updated LessonDetailResponse
     */
    @RequestMapping(value = "/{id}/reorder", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<ApiResponse<LessonDetailResponse>> reorderVocabulary(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReorderVocabRequest request) {
        LessonDetailResponse response = lessonService.reorderVocabularyInAdminLesson(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thứ tự từ vựng thành công", response));
    }

    /**
     * Emergency Lesson Revocation (Take-Down) (TASK-7.2).
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
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bài học thành công", response));
    }
}
