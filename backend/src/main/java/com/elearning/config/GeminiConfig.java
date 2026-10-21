package com.elearning.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Google Gemini API integration.
 * In accordance with project cost policy:
 * - Operates strictly within Google Gemini Free Tier limits.
 * - Credential read strictly from server-side environment variables (GEMINI_API_KEY / GOOGLE_API_KEY).
 * - Never logged or leaked to frontend or logs.
 */
@Configuration
public class GeminiConfig {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String model;

    @Value("${gemini.timeout-seconds:35}")
    private int timeoutSeconds;

    @Value("${gemini.max-audio-bytes:5242880}")
    private long maxAudioBytes;

    public String getApiKey() {
        return (apiKey != null) ? apiKey.trim() : "";
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public String getModel() {
        return (model != null && !model.trim().isEmpty()) ? model.trim() : "gemini-3.5-flash";
    }

    public int getTimeoutSeconds() {
        return (timeoutSeconds > 0) ? timeoutSeconds : 35;
    }

    public long getMaxAudioBytes() {
        return (maxAudioBytes > 0) ? maxAudioBytes : 5242880L;
    }
}
