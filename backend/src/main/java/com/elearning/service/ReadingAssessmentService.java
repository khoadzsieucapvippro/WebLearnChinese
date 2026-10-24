package com.elearning.service;

import com.elearning.dto.response.PronunciationAssessmentResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for orchestrating learner reading assessments.
 * Coordinates input validation, authoritative database lookup, and pronunciation & tone evaluation.
 */
public interface ReadingAssessmentService {

    /**
     * Assesses a learner's speech audio against an authoritative vocabulary or radical card.
     *
     * @param audio the recorded audio MultipartFile
     * @param itemType "VOCABULARY" or "RADICAL"
     * @param itemId ID of the vocabulary or radical in database
     * @return PronunciationAssessmentResponse with rubric-guided feedback
     */
    PronunciationAssessmentResponse assessReading(MultipartFile audio, String itemType, Long itemId);

    /**
     * Checks if the speech & tone assessment engine is available.
     */
    boolean isServiceAvailable();

    /**
     * Retrieves runtime status metadata describing provider and availability.
     */
    java.util.Map<String, Object> getServiceStatus();
}
