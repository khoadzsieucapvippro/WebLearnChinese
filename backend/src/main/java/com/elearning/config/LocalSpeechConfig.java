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

    @Value("${speech.engine.local.connect-timeout-ms:2500}")
    private int connectTimeoutMs;

    @Value("${speech.engine.local.read-timeout-ms:10000}")
    private int readTimeoutMs;

    public boolean isEnabled() {
        return enabled;
    }

    public String getBaseUrl() {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            return "http://127.0.0.1:8000";
        }
        return baseUrl.trim();
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs > 0 ? connectTimeoutMs : 2500;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs > 0 ? readTimeoutMs : 10000;
    }
}
