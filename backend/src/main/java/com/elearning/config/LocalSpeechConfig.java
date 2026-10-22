package com.elearning.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for the 100% Local / Offline Speech Assessment Microservice.
 * Adheres strictly to offline inference (zero cloud AI API calls during inference).
 */
@Configuration
public class LocalSpeechConfig {

    @Value("${speech.engine.local.enabled:true}")
    private boolean enabled;

    @Value("${speech.engine.local.base-url:http://127.0.0.1:8000}")
    private String baseUrl;

    @Value("${speech.engine.local.internal-token:}")
    private String internalToken;

    @Value("${speech.engine.local.connect-timeout-ms:30000}")
    private int connectTimeoutMs;

    @Value("${speech.engine.local.read-timeout-ms:45000}")
    private int readTimeoutMs;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            return "http://127.0.0.1:8000";
        }
        String trimmed = baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
        }
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getInternalToken() {
        return internalToken != null ? internalToken.trim() : "";
    }

    public void setInternalToken(String internalToken) {
        this.internalToken = internalToken;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs > 0 ? connectTimeoutMs : 30000;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs > 0 ? readTimeoutMs : 45000;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }
}
