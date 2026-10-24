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
 * REST Controller for Speech / Reading Pronunciation Assessment (Chao 5-scale Tone Sandhi Engine).
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
     * Retrieves runtime status of the Reading assessment service.
     * Accurately reflects provider (Local Speech Service),
     * live health check status, and offline capability.
     *
     * @return ApiResponse wrapping configuration status and provider metadata
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReadingStatus() {
        Map<String, Object> data = readingAssessmentService.getServiceStatus();
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
