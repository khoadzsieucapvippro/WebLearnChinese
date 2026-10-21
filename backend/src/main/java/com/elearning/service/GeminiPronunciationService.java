package com.elearning.service;

import com.elearning.dto.response.PronunciationAssessmentResponse;

/**
 * Service boundary for assessing pronunciation audio through Gemini AI.
 * Strictly operates on byte array payloads, eliminating persistent audio storage.
 */
public interface GeminiPronunciationService {

    /**
     * Assesses a user's spoken audio against authoritative target Chinese text.
     *
     * @param audioBytes raw audio recording bytes
     * @param mimeType MIME type of audio (e.g. "audio/webm", "audio/ogg", "audio/mp4", "audio/wav")
     * @param targetHanzi authoritative target Chinese character(s) from server DB
     * @param targetPinyin authoritative target Pinyin from server DB
     * @param meaningHanViet target Sino-Vietnamese meaning
     * @return PronunciationAssessmentResponse with structured rubric feedback
     */
    PronunciationAssessmentResponse assessPronunciation(
            byte[] audioBytes,
            String mimeType,
            String targetHanzi,
            String targetPinyin,
            String meaningHanViet
    );

    /**
     * Checks if Gemini API key is configured and valid for execution.
     *
     * @return true if GEMINI_API_KEY or GOOGLE_API_KEY is present
     */
    boolean isConfigured();
}
