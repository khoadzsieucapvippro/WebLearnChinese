package com.elearning.service;

import com.elearning.config.LocalSpeechConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for communicating with the local Python Speech & Tone Assessment Microservice.
 * Runs 100% locally on http://127.0.0.1:8000 without external cloud dependencies.
 */
@Service
public class LocalSpeechServiceClient {

    private static final Logger log = LoggerFactory.getLogger(LocalSpeechServiceClient.class);

    private final LocalSpeechConfig localSpeechConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private int maxAttempts = 3;
    private long backoffMs = 2500L;

    @Autowired
    public LocalSpeechServiceClient(LocalSpeechConfig localSpeechConfig, ObjectMapper objectMapper) {
        this.localSpeechConfig = localSpeechConfig;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(localSpeechConfig.getConnectTimeoutMs());
        factory.setReadTimeout(localSpeechConfig.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);
    }

    public LocalSpeechServiceClient(LocalSpeechConfig localSpeechConfig, ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.localSpeechConfig = localSpeechConfig;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public void setBackoffMs(long backoffMs) {
        this.backoffMs = backoffMs;
    }

    /**
     * Checks if the local speech microservice is up and responding.
     */
    public boolean isAvailable() {
        if (!localSpeechConfig.isEnabled()) {
            return false;
        }
        try {
            String healthUrl = localSpeechConfig.getBaseUrl() + "/health";
            HttpHeaders headers = new HttpHeaders();
            String token = localSpeechConfig.getInternalToken();
            if (token != null && !token.isEmpty()) {
                headers.set("X-Internal-Token", token);
            }
            HttpEntity<?> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    healthUrl,
                    HttpMethod.GET,
                    requestEntity,
                    Map.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.debug("Local speech service health check failed at {}: {}", localSpeechConfig.getBaseUrl(), e.getMessage());
            return false;
        }
    }

    /**
     * Sends user audio to local Python microservice for ASR & Tone assessment.
     * Implements bounded retries and cold-start fallback when the service is waking up.
     */
    public PronunciationAssessmentResponse assessPronunciation(
            byte[] audioBytes,
            String mimeType,
            String targetHanzi,
            String targetPinyin,
            String meaningHanViet) {

        String evaluateUrl = localSpeechConfig.getBaseUrl() + "/evaluate-reading";
        boolean coldStartSuspected = false;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            if (attempt > 1 && backoffMs > 0) {
                try {
                    log.info("Backing off {}ms before attempt {}/{} to reach speech service at {}",
                            backoffMs, attempt, maxAttempts, evaluateUrl);
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return PronunciationAssessmentResponse.error(
                            targetHanzi,
                            targetPinyin,
                            "Yêu cầu bị gián đoạn trong khi chờ dịch vụ AI."
                    );
                }
            }

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                String token = localSpeechConfig.getInternalToken();
                if (token != null && !token.isEmpty()) {
                    headers.set("X-Internal-Token", token);
                }

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

                String filename = "reading." + (mimeType != null && mimeType.contains("wav") ? "wav" : "webm");
                ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                };

                body.add("audio", audioResource);
                body.add("target_hanzi", targetHanzi);
                body.add("target_pinyin", targetPinyin != null ? targetPinyin : "");
                body.add("target_meaning", meaningHanViet != null ? meaningHanViet : "");

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                ResponseEntity<PronunciationAssessmentResponse> response = restTemplate.exchange(
                        evaluateUrl,
                        HttpMethod.POST,
                        requestEntity,
                        PronunciationAssessmentResponse.class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return response.getBody();
                } else {
                    return PronunciationAssessmentResponse.error(
                            targetHanzi,
                            targetPinyin,
                            "Dịch vụ AI cục bộ phản hồi mã lỗi: " + response.getStatusCode()
                    );
                }
            } catch (HttpStatusCodeException e) {
                int statusCode = e.getStatusCode().value();
                log.warn("Speech service HTTP {} on attempt {}/{} at {}: {}",
                        statusCode, attempt, maxAttempts, evaluateUrl, e.getMessage());

                if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
                    coldStartSuspected = true;
                    if (attempt < maxAttempts) {
                        continue;
                    }
                } else {
                    // Non-cold-start error (e.g. 401 Unauthorized, 400 Bad Request, 500)
                    return PronunciationAssessmentResponse.error(
                            targetHanzi,
                            targetPinyin,
                            "Dịch vụ AI phản hồi mã lỗi: " + statusCode
                    );
                }
            } catch (ResourceAccessException e) {
                log.warn("Network/timeout error reaching speech service on attempt {}/{} at {}: {}",
                        attempt, maxAttempts, evaluateUrl, e.getMessage());
                coldStartSuspected = true;
                if (attempt < maxAttempts) {
                    continue;
                }
            } catch (RestClientException e) {
                log.warn("RestClientException reaching speech service on attempt {}/{} at {}: {}",
                        attempt, maxAttempts, evaluateUrl, e.getMessage());
                if (attempt < maxAttempts) {
                    continue;
                }
                return PronunciationAssessmentResponse.engineUnavailable(targetHanzi, targetPinyin);
            } catch (Exception e) {
                log.error("Unexpected error calling local speech service: {}", e.getMessage(), e);
                return PronunciationAssessmentResponse.error(
                        targetHanzi,
                        targetPinyin,
                        "Lỗi khi xử lý qua dịch vụ AI cục bộ: " + e.getMessage()
                );
            }
        }

        if (coldStartSuspected) {
            log.warn("Connection/retry attempts exhausted for speech service at {}. Returning coldStartWakingUp.", evaluateUrl);
            return PronunciationAssessmentResponse.coldStartWakingUp(targetHanzi, targetPinyin);
        }

        return PronunciationAssessmentResponse.engineUnavailable(targetHanzi, targetPinyin);
    }
}
