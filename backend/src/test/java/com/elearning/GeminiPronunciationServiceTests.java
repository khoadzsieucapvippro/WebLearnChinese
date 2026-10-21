package com.elearning;

import com.elearning.config.GeminiConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.dto.response.PronunciationComponentsDto;
import com.elearning.service.impl.GeminiPronunciationServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GeminiPronunciationService Unit Tests (Mock & Invariant Verification)")
class GeminiPronunciationServiceTests {

    @Mock
    private GeminiConfig geminiConfig;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private GeminiPronunciationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GeminiPronunciationServiceImpl(geminiConfig, objectMapper);
    }

    @Test
    @DisplayName("returns unconfigured when GEMINI_API_KEY is not set (Zero False-PASS, Zero Leak)")
    void testAssessPronunciationUnconfigured() {
        when(geminiConfig.isConfigured()).thenReturn(false);

        PronunciationAssessmentResponse resp = service.assessPronunciation(
                new byte[]{1, 2, 3}, "audio/webm", "学", "xué", "Học"
        );

        assertNotNull(resp);
        assertEquals("unconfigured", resp.getStatus());
        assertEquals("学", resp.getTargetText());
        assertEquals("xué", resp.getTargetPinyin());
        assertNull(resp.getOverallScore());
        assertEquals("LOW", resp.getConfidence());
        assertTrue(resp.getSummaryVi().contains("chưa được cấu hình"));
    }

    @Test
    @DisplayName("returns not_scorable when audio bytes are empty")
    void testAssessPronunciationEmptyAudio() {
        when(geminiConfig.isConfigured()).thenReturn(true);

        PronunciationAssessmentResponse resp = service.assessPronunciation(
                new byte[0], "audio/webm", "学", "xué", "Học"
        );

        assertNotNull(resp);
        assertEquals("not_scorable", resp.getStatus());
        assertNull(resp.getOverallScore());
    }

    @Test
    @DisplayName("cleanJsonFences and parseGeminiResponse correctly parse structured JSON response")
    void testParseGeminiResponseValidJson() throws Exception {
        Method parseMethod = GeminiPronunciationServiceImpl.class.getDeclaredMethod(
                "parseGeminiResponse", String.class, String.class, String.class
        );
        parseMethod.setAccessible(true);

        String sampleJson = """
            ```json
            {
              "status": "assessed",
              "recognizedText": "学",
              "overallScore": 88,
              "confidence": "HIGH",
              "summaryVi": "Phát âm thanh 2 chuẩn xác, khẩu hình đúng.",
              "pronunciationFeedback": "Rất tốt! Cần chú ý giữ độ dài thanh điệu.",
              "components": {
                "initialsFeedback": "Thanh mẫu x chuẩn",
                "finalsFeedback": "Vận mẫu ue rõ ràng",
                "tonesFeedback": "Thanh 2 (dương bình) vuốt đều"
              },
              "retryAdvice": "Thử đọc lại để duy trì độ ổn định.",
              "limitations": "Điểm số là ước lượng tham khảo từ Gemini AI."
            }
            ```
            """;

        PronunciationAssessmentResponse resp = (PronunciationAssessmentResponse) parseMethod.invoke(
                service, sampleJson, "学", "xué"
        );

        assertNotNull(resp);
        assertEquals("assessed", resp.getStatus());
        assertEquals(88, resp.getOverallScore());
        assertEquals("HIGH", resp.getConfidence());
        assertEquals("学", resp.getRecognizedText());
        assertEquals("Phát âm thanh 2 chuẩn xác, khẩu hình đúng.", resp.getSummaryVi());
        assertNotNull(resp.getComponents());
        assertEquals("Thanh mẫu x chuẩn", resp.getComponents().getInitialsFeedback());
        assertEquals("Vận mẫu ue rõ ràng", resp.getComponents().getFinalsFeedback());
        assertEquals("Thanh 2 (dương bình) vuốt đều", resp.getComponents().getTonesFeedback());
    }

    @Test
    @DisplayName("parseGeminiResponse handles not_scorable when model reports unclear audio")
    void testParseGeminiResponseNotScorable() throws Exception {
        Method parseMethod = GeminiPronunciationServiceImpl.class.getDeclaredMethod(
                "parseGeminiResponse", String.class, String.class, String.class
        );
        parseMethod.setAccessible(true);

        String notScorableJson = """
            {
              "status": "not_scorable",
              "recognizedText": "",
              "overallScore": null,
              "confidence": "LOW",
              "summaryVi": "Âm thanh quá nhỏ hoặc nhiều tạp âm, không thể nghe rõ chữ Hán.",
              "retryAdvice": "Vui lòng giữ micro gần hơn và đọc to, dứt khoát.",
              "limitations": "Gemini AI không thể chấm điểm khi tín hiệu âm thanh quá yếu."
            }
            """;

        PronunciationAssessmentResponse resp = (PronunciationAssessmentResponse) parseMethod.invoke(
                service, notScorableJson, "学", "xué"
        );

        assertNotNull(resp);
        assertEquals("not_scorable", resp.getStatus());
        assertNull(resp.getOverallScore());
        assertEquals("LOW", resp.getConfidence());
        assertTrue(resp.getSummaryVi().contains("không thể nghe rõ"));
    }

    @Test
    @DisplayName("parseGeminiResponse falls back gracefully on malformed JSON without crashing")
    void testParseGeminiResponseMalformedJson() throws Exception {
        Method parseMethod = GeminiPronunciationServiceImpl.class.getDeclaredMethod(
                "parseGeminiResponse", String.class, String.class, String.class
        );
        parseMethod.setAccessible(true);

        String malformedJson = "{ broken json content: true ";

        PronunciationAssessmentResponse resp = (PronunciationAssessmentResponse) parseMethod.invoke(
                service, malformedJson, "学", "xué"
        );

        assertNotNull(resp);
        assertEquals("not_scorable", resp.getStatus());
        assertNull(resp.getOverallScore());
        assertTrue(resp.getSummaryVi().contains("không đúng định dạng"));
    }

    @Test
    @DisplayName("normalizeMimeType normalizes browser audio MIME types correctly")
    void testNormalizeMimeType() throws Exception {
        Method normMethod = GeminiPronunciationServiceImpl.class.getDeclaredMethod("normalizeMimeType", String.class);
        normMethod.setAccessible(true);

        assertEquals("audio/webm", normMethod.invoke(service, "audio/webm;codecs=opus"));
        assertEquals("audio/ogg", normMethod.invoke(service, "audio/ogg; codecs=opus"));
        assertEquals("audio/mp4", normMethod.invoke(service, "audio/mp4"));
        assertEquals("audio/wav", normMethod.invoke(service, "audio/x-wav"));
        assertEquals("audio/mp3", normMethod.invoke(service, "audio/mpeg"));
        assertEquals("audio/webm", normMethod.invoke(service, new Object[]{null}));
    }
}
