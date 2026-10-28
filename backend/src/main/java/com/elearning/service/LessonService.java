package com.elearning.service;

import com.elearning.dto.request.AdminRevokeLessonRequest;
import com.elearning.dto.request.ApproveLessonRequest;
import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Public Lesson Exploration domain (Module 5A).
 * Provides public discovery of approved lessons and detailed lesson content.
 * Enforces security invariant: ONLY lessons with status 'Approved' are discoverable.
 * Conforms to .agents/API.md section 2.3 and zero-entity-leak rules.
 */
public interface LessonService {

    /**
     * Retrieves a paginated list of approved public lessons.
     * Lessons with status Draft, Pending, or Rejected are strictly excluded.
     *
     * @param pageable pagination parameters
     * @return Page of {@link LessonSummaryResponse}
     */
    Page<LessonSummaryResponse> getApprovedLessons(Pageable pageable);

    /**
     * Retrieves detailed information of an approved public lesson by its ID,
     * including its constituent vocabulary items strictly sorted by order_index ascending.
     * If the lesson does not exist or its status is not 'Approved',
     * throws {@link com.elearning.exception.BusinessException} with ErrorCode.NOT_FOUND.
     *
     * @param lessonId the primary ID of the lesson
     * @return {@link LessonDetailResponse}
     * @throws com.elearning.exception.BusinessException if lesson is null, not found, or not approved
     */
    LessonDetailResponse getApprovedLessonById(Long lessonId);

    /**
     * Retrieves a paginated list of lessons across all lifecycle statuses for administrative oversight (Module 8D.4).
     *
     * @param status   optional status filter (Draft, Pending, Approved, Rejected)
     * @param pageable pagination parameters
     * @return Page of {@link LessonSummaryResponse}
     */
    Page<LessonSummaryResponse> getAdminLessons(String status, Pageable pageable);

    /**
     * Retrieves full detail of a specific lesson by its ID for administrative oversight (Module 8D.4),
     * regardless of lifecycle status (Draft, Pending, Approved, Rejected).
     *
     * @param lessonId the primary ID of the lesson
     * @return {@link LessonDetailResponse}
     * @throws com.elearning.exception.BusinessException if lesson is null or not found
     */
    LessonDetailResponse getAdminLessonById(Long lessonId);

    /**
     * Emergency Lesson Revocation (Take-Down) (TASK-7.2).
     * Transitions an 'Approved' lesson back to 'Rejected' state with a violation reason.
     * Enforces Self-Review Prohibition (Creator cannot revoke their own lesson even as Admin).
     *
     * @param lessonId the primary ID of the lesson
     * @param request  revocation request with mandatory reason
     * @return updated LessonDetailResponse
     */
    LessonDetailResponse revokeLesson(Long lessonId, AdminRevokeLessonRequest request);

    /**
     * Supervisory Arbiter Approval (Trọng Tài Tối Cao) (TASK-7.2).
     * Approves a 'Pending' or 'Rejected' lesson that was disputed or delayed.
     * Enforces Self-Review Prohibition (Creator cannot approve their own lesson).
     *
     * @param lessonId the primary ID of the lesson
     * @param request  optional approval notes
     * @return updated LessonDetailResponse
     */
    LessonDetailResponse supervisoryApproveLesson(Long lessonId, ApproveLessonRequest request);
}
