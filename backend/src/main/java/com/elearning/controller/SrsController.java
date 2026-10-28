package com.elearning.controller;

import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.CurriculumProgressResponse;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.service.SrsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for Spaced Repetition System (SRS) review sessions.
 * Base path: /api/v1/srs
 * Protected by Spring Security: Requires authenticated learner or admin user.
 * Enforces thin-controller architecture; delegates due card queries,
 * review rating calculation, and study statistics retrieval to {@link SrsService}.
 */
@RestController
@RequestMapping("/api/v1/srs")
@PreAuthorize("isAuthenticated()")
public class SrsController {

    private final SrsService srsService;

    public SrsController(SrsService srsService) {
        this.srsService = srsService;
    }

    /**
     * Retrieves flashcards due for review for the authenticated learner.
     * Optionally filtered by lessonId, cardType, itemType, and limit.
     *
     * @param itemType optional card type filter ("VOCABULARY" or "RADICAL")
     * @param cardType optional skill card type filter ("LISTENING", "WRITING", "READING")
     * @param lessonId optional lesson filter ID
     * @param limit    optional max cards count (constrained by daily review limits)
     * @return ApiResponse wrapping list of DueCardResponse
     */
    @GetMapping("/due")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getDueCards(
            @RequestParam(name = "itemType", required = false) String itemType,
            @RequestParam(name = "cardType", required = false) String cardType,
            @RequestParam(name = "lessonId", required = false) Long lessonId,
            @RequestParam(name = "limit", required = false) Integer limit) {
        List<DueCardResponse> dueCards;
        if (lessonId != null) {
            dueCards = srsService.getDueCards(itemType, cardType, lessonId, limit);
        } else if (cardType != null && !cardType.trim().isEmpty()) {
            dueCards = srsService.getDueCards(itemType, cardType, limit);
        } else {
            dueCards = srsService.getDueCards(itemType, limit);
        }
        return ResponseEntity.ok(ApiResponse.success(dueCards));
    }

    /**
     * RESTful sub-resource alias to retrieve flashcards due for review for an approved lesson.
     *
     * @param lessonId the approved lesson ID
     * @param itemType optional card type filter ("VOCABULARY" or "RADICAL")
     * @param cardType optional skill card type filter ("LISTENING", "WRITING", "READING")
     * @param limit    optional max cards count
     * @return ApiResponse wrapping list of DueCardResponse for the lesson
     */
    @GetMapping("/lessons/{lessonId}/due")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getDueCardsForLesson(
            @PathVariable("lessonId") Long lessonId,
            @RequestParam(name = "itemType", required = false) String itemType,
            @RequestParam(name = "cardType", required = false) String cardType,
            @RequestParam(name = "limit", required = false) Integer limit) {
        List<DueCardResponse> dueCards = srsService.getDueCards(itemType, cardType, lessonId, limit);
        return ResponseEntity.ok(ApiResponse.success(dueCards));
    }

    /**
     * Retrieves lesson-scoped SRS statistics for the authenticated learner.
     *
     * @param lessonId the approved lesson ID
     * @return ApiResponse wrapping LessonSrsStatsResponse
     */
    @GetMapping("/lessons/{lessonId}/stats")
    public ResponseEntity<ApiResponse<LessonSrsStatsResponse>> getLessonSrsStats(
            @PathVariable("lessonId") Long lessonId) {
        LessonSrsStatsResponse stats = srsService.getLessonSrsStats(lessonId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Retrieves new-card candidates for a specific approved lesson for the authenticated learner.
     * Enforces lesson approval status, order_index ASC ordering, and daily new-card quota (R1-DEC-02, R1-DEC-04).
     *
     * @param lessonId the approved lesson ID
     * @param cardType optional skill card type filter ("LISTENING", "WRITING")
     * @param limit    optional max cards count
     * @return ApiResponse wrapping list of candidate DueCardResponse with isNew=true
     */
    @GetMapping("/new-cards")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getNewCardCandidates(
            @RequestParam(name = "lessonId") Long lessonId,
            @RequestParam(name = "cardType", required = false) String cardType,
            @RequestParam(name = "limit", required = false) Integer limit) {
        List<DueCardResponse> candidates = (cardType != null && !cardType.trim().isEmpty())
                ? srsService.getNewCardCandidates(lessonId, cardType, limit)
                : srsService.getNewCardCandidates(lessonId, limit);
        return ResponseEntity.ok(ApiResponse.success(candidates));
    }

    /**
     * RESTful sub-resource alias to retrieve new-card candidates for an approved lesson.
     *
     * @param lessonId the approved lesson ID
     * @param cardType optional skill card type filter ("LISTENING", "WRITING")
     * @param limit    optional max cards count
     * @return ApiResponse wrapping list of candidate DueCardResponse with isNew=true
     */
    @GetMapping("/lessons/{lessonId}/new-cards")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getNewCardCandidatesForLesson(
            @org.springframework.web.bind.annotation.PathVariable("lessonId") Long lessonId,
            @RequestParam(name = "cardType", required = false) String cardType,
            @RequestParam(name = "limit", required = false) Integer limit) {
        List<DueCardResponse> candidates = (cardType != null && !cardType.trim().isEmpty())
                ? srsService.getNewCardCandidates(lessonId, cardType, limit)
                : srsService.getNewCardCandidates(lessonId, limit);
        return ResponseEntity.ok(ApiResponse.success(candidates));
    }

    /**
     * Retrieves all vocabulary cards for an approved lesson for free replay / practice (ADR-01 Mode B).
     * Cards are ordered strictly by order_index ASC without being filtered by CardProgress or daily quotas.
     *
     * @param lessonId the approved lesson ID
     * @param cardType optional skill card type filter ("LISTENING", "WRITING")
     * @return ApiResponse wrapping list of DueCardResponse for the lesson
     */
    @GetMapping("/practice-cards")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getPracticeCards(
            @RequestParam(name = "lessonId") Long lessonId,
            @RequestParam(name = "cardType", required = false) String cardType) {
        List<DueCardResponse> practiceCards = (cardType != null && !cardType.trim().isEmpty())
                ? srsService.getPracticeCards(lessonId, cardType)
                : srsService.getPracticeCards(lessonId);
        return ResponseEntity.ok(ApiResponse.success(practiceCards));
    }

    /**
     * RESTful sub-resource alias to retrieve practice cards for an approved lesson.
     *
     * @param lessonId the approved lesson ID
     * @param cardType optional skill card type filter ("LISTENING", "WRITING")
     * @return ApiResponse wrapping list of DueCardResponse for the lesson
     */
    @GetMapping("/lessons/{lessonId}/practice-cards")
    public ResponseEntity<ApiResponse<List<DueCardResponse>>> getPracticeCardsForLesson(
            @org.springframework.web.bind.annotation.PathVariable("lessonId") Long lessonId,
            @RequestParam(name = "cardType", required = false) String cardType) {
        List<DueCardResponse> practiceCards = (cardType != null && !cardType.trim().isEmpty())
                ? srsService.getPracticeCards(lessonId, cardType)
                : srsService.getPracticeCards(lessonId);
        return ResponseEntity.ok(ApiResponse.success(practiceCards));
    }

    /**
     * Submits a flashcard review rating from the authenticated learner.
     * Delegates SM-2 mathematical calculation and atomic audit logging to SrsService.
     *
     * @param request validated review request payload
     * @return ApiResponse wrapping updated DueCardResponse with new interval and progress state
     */
    @PostMapping("/review")
    public ResponseEntity<ApiResponse<DueCardResponse>> reviewCard(
            @Valid @RequestBody ReviewCardRequest request) {
        DueCardResponse response = srsService.reviewCard(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves current study and review session statistics for the authenticated learner.
     *
     * @return ApiResponse wrapping StudyStatsResponse
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StudyStatsResponse>> getStudyStats() {
        StudyStatsResponse stats = srsService.getStudyStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Retrieves curriculum learning progress for the authenticated learner.
     * Returns learned counts per lesson, chapter progress, and total learned cards.
     * Enforces IDOR defense by deriving user identity strictly from SecurityContext.
     *
     * @return ApiResponse wrapping CurriculumProgressResponse
     */
    @GetMapping("/curriculum-progress")
    public ResponseEntity<ApiResponse<CurriculumProgressResponse>> getCurriculumProgress() {
        CurriculumProgressResponse progress = srsService.getCurriculumProgress();
        return ResponseEntity.ok(ApiResponse.success(progress));
    }
}
