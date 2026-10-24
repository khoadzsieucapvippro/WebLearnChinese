package com.elearning;

import com.elearning.config.LocalSpeechConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.SocketTimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@DisplayName("LocalSpeechServiceClient Empirical Challenge Tests")
public class LocalSpeechServiceClientTests {

    private LocalSpeechConfig config;
    private ObjectMapper objectMapper;
    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private com.elearning.service.LocalSpeechServiceClient client;

    @BeforeEach
    void setUp() {
        config = new LocalSpeechConfig();
        config.setEnabled(true);
        config.setBaseUrl("http://127.0.0.1:8000");
        config.setInternalToken("test-secret-token-xyz");

        objectMapper = new ObjectMapper();
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);

        client = new com.elearning.service.LocalSpeechServiceClient(config, objectMapper, restTemplate);
        client.setBackoffMs(5L); // Minimize sleep during tests
        client.setMaxAttempts(3);
    }

    @Test
    @DisplayName("assessPronunciation injects X-Internal-Token and parses successful response")
    void testSuccessfulCallWithInternalToken() {
        String jsonSuccess = "{\"status\":\"assessed\",\"targetText\":\"你好\",\"overallScore\":85,\"confidence\":\"HIGH\",\"summaryVi\":\"Phát âm tốt\"}";

        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-Token", "test-secret-token-xyz"))
                .andRespond(withSuccess(jsonSuccess, MediaType.APPLICATION_JSON));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "你好", "nǐ hǎo", "Xin chào"
        );

        assertNotNull(resp);
        assertEquals("assessed", resp.getStatus());
        assertEquals(85, resp.getOverallScore());
        assertEquals("HIGH", resp.getConfidence());
        assertEquals("Phát âm tốt", resp.getSummaryVi());
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation retries 3 times on HTTP 502 Bad Gateway and triggers coldStartWakingUp")
    void testRetryOn502BadGatewayExhausted() {
        mockServer.expect(ExpectedCount.times(3), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-Token", "test-secret-token-xyz"))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "学", "xué", "Học"
        );

        assertNotNull(resp);
        assertEquals("engine_unavailable", resp.getStatus());
        assertNull(resp.getOverallScore());
        assertEquals("LOW", resp.getConfidence());
        assertTrue(resp.getSummaryVi().contains("Render Free Tier spin-up ~30-50s"),
                "Expected summaryVi to explain Render spin-up: " + resp.getSummaryVi());
        assertTrue(resp.getRetryAdvice().contains("30-50 giây"),
                "Expected retryAdvice to suggest waiting: " + resp.getRetryAdvice());
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation retries 3 times on HTTP 503 Service Unavailable and triggers coldStartWakingUp")
    void testRetryOn503ServiceUnavailableExhausted() {
        mockServer.expect(ExpectedCount.times(3), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "学", "xué", "Học"
        );

        assertNotNull(resp);
        assertEquals("engine_unavailable", resp.getStatus());
        assertTrue(resp.getSummaryVi().contains("Render Free Tier spin-up ~30-50s"));
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation retries 3 times on HTTP 504 Gateway Timeout and triggers coldStartWakingUp")
    void testRetryOn504GatewayTimeoutExhausted() {
        mockServer.expect(ExpectedCount.times(3), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.GATEWAY_TIMEOUT));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "学", "xué", "Học"
        );

        assertNotNull(resp);
        assertEquals("engine_unavailable", resp.getStatus());
        assertTrue(resp.getSummaryVi().contains("Render Free Tier spin-up ~30-50s"));
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation retries on ResourceAccessException (network timeout) and falls back to coldStartWakingUp")
    void testRetryOnResourceAccessExceptionExhausted() {
        mockServer.expect(ExpectedCount.times(3), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withException(new IOException("Connection timed out")));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "水", "shuǐ", "Nước"
        );

        assertNotNull(resp);
        assertEquals("engine_unavailable", resp.getStatus());
        assertTrue(resp.getSummaryVi().contains("Render Free Tier spin-up ~30-50s"));
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation recovers on attempt 2 after initial 502/503 failure")
    void testRetryRecoversOnSecondAttempt() {
        String jsonSuccess = "{\"status\":\"assessed\",\"targetText\":\"大\",\"overallScore\":92,\"confidence\":\"HIGH\",\"summaryVi\":\"Phát âm chuẩn xác\"}";

        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY));

        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(jsonSuccess, MediaType.APPLICATION_JSON));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "大", "dà", "Đại"
        );

        assertNotNull(resp);
        assertEquals("assessed", resp.getStatus());
        assertEquals(92, resp.getOverallScore());
        assertEquals("HIGH", resp.getConfidence());
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation fails immediately on 401 Unauthorized without wasteful retries")
    void testNonColdStartErrorNoRetryOn401Unauthorized() {
        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "大", "dà", "Đại"
        );

        assertNotNull(resp);
        assertEquals("error", resp.getStatus());
        assertNull(resp.getOverallScore());
        assertTrue(resp.getSummaryVi().contains("401"), "Expected error message to mention 401: " + resp.getSummaryVi());
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation fails immediately on 400 Bad Request without retries")
    void testNonColdStartErrorNoRetryOn400BadRequest() {
        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "大", "dà", "Đại"
        );

        assertNotNull(resp);
        assertEquals("error", resp.getStatus());
        assertTrue(resp.getSummaryVi().contains("400"));
        mockServer.verify();
    }

    @Test
    @DisplayName("assessPronunciation fails immediately on 500 Internal Server Error without retries")
    void testNonColdStartErrorNoRetryOn500InternalError() {
        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/evaluate-reading"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        PronunciationAssessmentResponse resp = client.assessPronunciation(
                new byte[]{1, 2, 3, 4}, "audio/webm", "大", "dà", "Đại"
        );

        assertNotNull(resp);
        assertEquals("error", resp.getStatus());
        assertTrue(resp.getSummaryVi().contains("500"));
        mockServer.verify();
    }

    @Test
    @DisplayName("isAvailable sends X-Internal-Token and returns true on 200 OK")
    void testIsAvailableWithToken() {
        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/health"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("X-Internal-Token", "test-secret-token-xyz"))
                .andRespond(withSuccess("{\"status\":\"READY\"}", MediaType.APPLICATION_JSON));

        boolean available = client.isAvailable();

        assertTrue(available);
        mockServer.verify();
    }

    @Test
    @DisplayName("isAvailable returns false on connection error or 5xx without throwing exception")
    void testIsAvailableReturnsFalseOnError() {
        mockServer.expect(ExpectedCount.once(), requestTo("http://127.0.0.1:8000/health"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        boolean available = client.isAvailable();

        assertFalse(available);
        mockServer.verify();
    }

    @Test
    @DisplayName("isAvailable returns false when local engine is disabled in config")
    void testIsAvailableReturnsFalseWhenDisabled() {
        config.setEnabled(false);
        boolean available = client.isAvailable();
        assertFalse(available);
    }

    @Test
    @DisplayName("PronunciationAssessmentResponse factory methods produce accurate Vietnamese strings")
    void testVietnameseLocalizationContent() {
        // 1. coldStartWakingUp
        PronunciationAssessmentResponse cold = PronunciationAssessmentResponse.coldStartWakingUp("好", "hǎo");
        assertEquals("engine_unavailable", cold.getStatus());
        assertEquals("Hệ thống Phân tích Phát âm & Thanh điệu đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).", cold.getSummaryVi());
        assertEquals("Máy chủ phân tích âm thanh cần khoảng 30-50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm 'Thử đọc lại' sau giây lát hoặc bấm 'Bỏ qua →' để tiếp tục ôn tập.", cold.getRetryAdvice());
        assertEquals("Hệ thống speech-service đang được đánh thức từ chế độ ngủ (Render Free Tier).", cold.getLimitations());

        // 2. engineUnavailable
        PronunciationAssessmentResponse unavail = PronunciationAssessmentResponse.engineUnavailable("好", "hǎo");
        assertEquals("engine_unavailable", unavail.getStatus());
        assertEquals("Hệ thống Phân tích Phát âm & Thanh điệu chưa được khởi chạy hoặc không thể kết nối.", unavail.getSummaryVi());
        assertEquals("Quản trị viên vui lòng khởi chạy speech-service (cổng 8000) hoặc kiểm tra SPEECH_SERVICE_URL.", unavail.getRetryAdvice());
        assertEquals("Hệ thống phân tích âm học cục bộ chưa sẵn sàng.", unavail.getLimitations());

        // 3. unconfigured
        PronunciationAssessmentResponse unconf = PronunciationAssessmentResponse.unconfigured("好", "hǎo");
        assertEquals("unconfigured", unconf.getStatus());
        assertEquals("Hệ thống Phân tích Phát âm & Thanh điệu chưa được cấu hình địa chỉ dịch vụ.", unconf.getSummaryVi());
        assertEquals("Quản trị viên vui lòng thiết lập biến môi trường SPEECH_SERVICE_URL trên máy chủ.", unconf.getRetryAdvice());
        assertEquals("Chưa có dịch vụ speech-service hợp lệ để phân tích phát âm.", unconf.getLimitations());

        // 4. notScorable
        PronunciationAssessmentResponse notScorable = PronunciationAssessmentResponse.notScorable("好", "hǎo", null, null);
        assertEquals("not_scorable", notScorable.getStatus());
        assertEquals("Không thể đánh giá bản ghi âm này.", notScorable.getSummaryVi());
        assertEquals("Vui lòng đọc to, rõ ràng và gần micro hơn.", notScorable.getRetryAdvice());
        assertEquals("Bản ghi âm không đủ rõ ràng hoặc chứa tạp âm lớn để phân tích đường cao độ F0.", notScorable.getLimitations());

        // 5. error
        PronunciationAssessmentResponse err = PronunciationAssessmentResponse.error("好", "hǎo", "Lỗi mạng kiểm tra");
        assertEquals("error", err.getStatus());
        assertEquals("Lỗi mạng kiểm tra", err.getSummaryVi());
        assertEquals("Vui lòng thử lại sau giây lát.", err.getRetryAdvice());
        assertEquals("Hệ thống phân tích phát âm tạm thời gặp gián đoạn.", err.getLimitations());
    }

    @Test
    @DisplayName("LocalSpeechConfig URL scheme normalization handles various inputs")
    void testUrlSchemeNormalization() {
        LocalSpeechConfig cfg = new LocalSpeechConfig();

        cfg.setBaseUrl(null);
        assertEquals("http://127.0.0.1:8000", cfg.getBaseUrl());

        cfg.setBaseUrl("   ");
        assertEquals("http://127.0.0.1:8000", cfg.getBaseUrl());

        cfg.setBaseUrl("http://speech.internal:8000/");
        assertEquals("http://speech.internal:8000", cfg.getBaseUrl());

        cfg.setBaseUrl("https://speech.onrender.com///");
        assertEquals("https://speech.onrender.com", cfg.getBaseUrl());

        cfg.setBaseUrl("speech-service.onrender.com");
        assertEquals("https://speech-service.onrender.com", cfg.getBaseUrl());

        cfg.setBaseUrl(" speech-service.onrender.com/ ");
        assertEquals("https://speech-service.onrender.com", cfg.getBaseUrl());
    }
}
