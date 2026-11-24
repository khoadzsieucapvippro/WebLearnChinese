package com.elearning.service;

import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.request.CreateLessonRequest;
import com.elearning.dto.request.ReorderVocabRequest;
import com.elearning.dto.request.UpdateLessonRequest;
import com.elearning.dto.response.ImportValidationReport;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for Public and Administrative Lesson Operations.
 * Provides public discovery of approved lessons and full Admin management of lessons.
 * In the simplified RBAC model, Admin publishes lessons directly in 'Approved' state.
 */
public interface LessonService {

    /**
     * Retrieves a paginated list of approved public lessons.
     *
     * @param pageable pagination parameters
     * @return Page of {@link LessonSummaryResponse}
     */
    Page<LessonSummaryResponse> getApprovedLessons(Pageable pageable);

    /**
     * Retrieves detailed information of an approved public lesson by its ID.
     *
     * @param lessonId the primary ID of the lesson
     * @return {@link LessonDetailResponse}
     */
    LessonDetailResponse getApprovedLessonById(Long lessonId);

    /**
     * Retrieves a paginated list of lessons for administrative oversight.
     *
     * @param status   optional status filter
     * @param pageable pagination parameters
     * @return Page of {@link LessonSummaryResponse}
     */
    Page<LessonSummaryResponse> getAdminLessons(String status, Pageable pageable);

    /**
     * Retrieves full detail of a specific lesson by its ID for administrative oversight.
     *
     * @param lessonId the primary ID of the lesson
     * @return {@link LessonDetailResponse}
     */
    LessonDetailResponse getAdminLessonById(Long lessonId);

    /**
     * Emergency Lesson Revocation (Take-Down).
     *
     * @param lessonId the primary ID of the lesson
     * @param request  revocation request with mandatory reason
     * @return updated LessonDetailResponse
     */
    LessonDetailResponse revokeLesson(Long lessonId, AdminRevokeLessonRequest request);

    /**
     * Supervisory Arbiter Approval.
     *
     * @param lessonId the primary ID of the lesson
     * @param request  optional approval notes
     * @return updated LessonDetailResponse
     */
    LessonDetailResponse supervisoryApproveLesson(Long lessonId, ApproveLessonRequest request);

    /**
     * Admin creates a new lesson, published immediately with status 'Approved'.
     *
     * @param request lesson creation parameters
     * @return created {@link LessonDetailResponse}
     */
    LessonDetailResponse createAdminLesson(CreateLessonRequest request);

    /**
     * Step 1: Uploads and validates an Excel file for preview.
     *
     * @param file uploaded .xlsx file
     * @return {@link ImportValidationReport}
     */
    ImportValidationReport previewAdminLessonImport(MultipartFile file);

    /**
     * Step 2: Confirms creation of a new lesson and constituent vocabulary items from Excel,
     * published immediately with status 'Approved'.
     *
     * @param title title of the new lesson
     * @param file  uploaded .xlsx file
     * @return created {@link LessonDetailResponse}
     */
    LessonDetailResponse importAdminLessonFromExcel(String title, MultipartFile file);

    /**
     * Updates an existing lesson's title and metadata.
     *
     * @param lessonId primary ID of the lesson
     * @param request  update payload
     * @return updated {@link LessonDetailResponse}
     */
    LessonDetailResponse updateAdminLesson(Long lessonId, UpdateLessonRequest request);

    /**
     * Deletes a lesson and its associations.
     *
     * @param lessonId primary ID of the lesson
     */
    void deleteAdminLesson(Long lessonId);

    /**
     * Adds a vocabulary to a lesson.
     *
     * @param lessonId primary ID of the lesson
     * @param vocabId  primary ID of the vocabulary
     * @return updated {@link LessonDetailResponse}
     */
    LessonDetailResponse addVocabularyToAdminLesson(Long lessonId, Long vocabId);

    /**
     * Removes a vocabulary from a lesson.
     *
     * @param lessonId primary ID of the lesson
     * @param vocabId  primary ID of the vocabulary
     * @return updated {@link LessonDetailResponse}
     */
    LessonDetailResponse removeVocabularyFromAdminLesson(Long lessonId, Long vocabId);

    /**
     * Reorders vocabulary items within a lesson.
     *
     * @param lessonId primary ID of the lesson
     * @param request  reorder payload
     * @return updated {@link LessonDetailResponse}
     */
    LessonDetailResponse reorderVocabularyInAdminLesson(Long lessonId, ReorderVocabRequest request);
}
