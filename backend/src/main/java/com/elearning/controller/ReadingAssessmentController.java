package com.elearning.controller;

import com.elearning.dto.response.ApiResponse;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.service.ReadingAssessmentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST Controller for Speech / Reading Pronunciation Assessment powered by Gemini AI.
 * Base path: /api/v1/srs/reading
 * Protected by Spring Security: Requires authenticated learner.
 */
@RestController
@RequestMapping("/api/v1/srs/reading")
public class ReadingAssessmentController {

    private final ReadingAssessmentService readingAssessmentService;

    public ReadingAssessmentController(ReadingAssessmentService readingAssessmentService) {
        this.readingAssessmentService = readingAssessmentService;
    }

    /**
     * Assesses a recorded pronunciation against an authoritative SRS item.
     *
     * @param audio the recorded audio MultipartFile
     * @param itemType "VOCABULARY" or "RADICAL"
     * @param itemId primary key of the vocabulary or radical
     * @return ApiResponse wrapping PronunciationAssessmentResponse
     */
    @PostMapping(value = "/assess", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PronunciationAssessmentResponse>> assessReading(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("itemType") String itemType,
            @RequestParam("itemId") Long itemId) {

        PronunciationAssessmentResponse response = readingAssessmentService.assessReading(audio, itemType, itemId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves runtime status of the Gemini Reading AI service.
     * Enables frontend to gracefully adapt when GEMINI_API_KEY is not yet configured.
     *
     * @return ApiResponse wrapping configuration status and free-tier metadata
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReadingStatus() {
        boolean configured = readingAssessmentService.isGeminiConfigured();
        Map<String, Object> data = Map.of(
                "configured", configured,
                "tier", "free",
                "provider", "Google Gemini API",
                "audioInputSupported", true
        );
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
