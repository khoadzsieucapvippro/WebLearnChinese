package com.elearning.service;

import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.CurriculumProgressResponse;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;

import java.util.List;

/**
 * Service interface managing Spaced Repetition System (SRS) review sessions,
 * card progress lifecycle, and study statistics for authenticated learners.
 */
public interface SrsService {

    /**
     * Retrieves flashcards due for review for the current authenticated user.
     * Applies daily limits from user settings and filters by optional itemType.
     *
     * @param itemType optional filter ("VOCABULARY" or "RADICAL", or null for all)
     * @param limit    maximum number of cards to retrieve (null for default daily quota)
     * @return list of {@link DueCardResponse} due for review
     */
    List<DueCardResponse> getDueCards(String itemType, Integer limit);

    /**
     * Retrieves flashcards due for review filtered by optional itemType and cardType ("LISTENING", "WRITING", "READING").
     */
    List<DueCardResponse> getDueCards(String itemType, String cardType, Integer limit);

    /**
     * Retrieves flashcards due for review filtered by optional itemType, cardType, and lessonId.
     * When lessonId is present, only returns cards belonging to that lesson,
     * enforcing that the lesson is Approved or caller has permission.
     */
    List<DueCardResponse> getDueCards(String itemType, String cardType, Long lessonId, Integer limit);

    /**
     * Retrieves SRS review statistics for a specific lesson for the authenticated learner.
     */
    LessonSrsStatsResponse getLessonSrsStats(Long lessonId);

    /**
     * Retrieves new-card candidates for an approved lesson for the current authenticated learner.
     * Candidates are unstudied vocabulary items belonging to the specified approved lesson,
     * ordered strictly by order_index ASC, constrained by remaining daily new-card quota (R1-DEC-02, R1-DEC-04).
     * Candidate retrieval is idempotent and creates zero CardProgress records (preview vs introduction).
     *
     * @param lessonId the approved lesson ID
     * @param limit optional maximum number of candidate cards to retrieve
     * @return list of {@link DueCardResponse} candidate cards with isNew=true
     */
    List<DueCardResponse> getNewCardCandidates(Long lessonId, Integer limit);

    List<DueCardResponse> getNewCardCandidates(Long lessonId, String cardType, Integer limit);

    /**
     * Retrieves all vocabulary cards for an approved lesson for free replay / practice (ADR-01 Mode B).
     * Cards are ordered strictly by order_index ASC and are completely unaffected by daily limits
     * or existing CardProgress. Creates zero CardProgress records and mutates zero SRS state.
     *
     * @param lessonId the approved lesson ID
     * @return list of {@link DueCardResponse} cards in lesson order
     */
    List<DueCardResponse> getPracticeCards(Long lessonId);

    List<DueCardResponse> getPracticeCards(Long lessonId, String cardType);

    /**
     * Processes a flashcard review rating submission from the authenticated learner.
     * Delegates mathematical calculation to {@link com.elearning.service.srs.SrsCalculator},
     * updates {@link com.elearning.entity.CardProgress}, and appends an immutable
     * {@link com.elearning.entity.ReviewLog} within an atomic transaction.
     *
     * @param request review rating submission DTO
     * @return updated {@link DueCardResponse} with new interval and progress state
     */
    DueCardResponse reviewCard(ReviewCardRequest request);

    /**
     * Calculates current study and review session statistics for the authenticated learner.
     *
     * @return {@link StudyStatsResponse} with due cards, reviews completed today, and limits
     */
    StudyStatsResponse getStudyStats();

    /**
     * Retrieves server-side curriculum learning progress for the authenticated learner.
     * Returns learned counts per lesson, chapter progress, and total learned cards.
     *
     * @return {@link CurriculumProgressResponse} containing aggregated progress data
     */
    CurriculumProgressResponse getCurriculumProgress();
}
