package com.elearning.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Phonetic component breakdown for pronunciation assessment.
 * Captures initials (thanh mẫu), finals (vận mẫu), and tones (thanh điệu).
 * Null or absent when model lacks sufficient acoustic evidence.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PronunciationComponentsDto {

    private String initialsFeedback;
    private String finalsFeedback;
    private String tonesFeedback;

    public PronunciationComponentsDto() {
    }

    public PronunciationComponentsDto(String initialsFeedback, String finalsFeedback, String tonesFeedback) {
        this.initialsFeedback = initialsFeedback;
        this.finalsFeedback = finalsFeedback;
        this.tonesFeedback = tonesFeedback;
    }

    public String getInitialsFeedback() {
        return initialsFeedback;
    }

    public void setInitialsFeedback(String initialsFeedback) {
        this.initialsFeedback = initialsFeedback;
    }

    public String getFinalsFeedback() {
        return finalsFeedback;
    }

    public void setFinalsFeedback(String finalsFeedback) {
        this.finalsFeedback = finalsFeedback;
    }

    public String getTonesFeedback() {
        return tonesFeedback;
    }

    public void setTonesFeedback(String tonesFeedback) {
        this.tonesFeedback = tonesFeedback;
    }
}
