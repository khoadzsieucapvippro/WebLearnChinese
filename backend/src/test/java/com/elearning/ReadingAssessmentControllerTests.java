package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.controller.ReadingAssessmentController;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.dto.response.PronunciationComponentsDto;
import com.elearning.exception.BusinessException;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.ReadingAssessmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReadingAssessmentController Unit Tests")
class ReadingAssessmentControllerTests {

    private MockMvc mockMvc;

    @Mock
    private ReadingAssessmentService readingAssessmentService;

    @InjectMocks
    private ReadingAssessmentController readingAssessmentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(readingAssessmentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/srs/reading/status returns operational status and free-tier metadata")
    void testGetReadingStatus() throws Exception {
        java.util.Map<String, Object> statusData = java.util.Map.of(
                "configured", true,
                "available", true,
                "tier", "free",
                "provider", "Google Gemini API",
                "audioInputSupported", true
        );
        when(readingAssessmentService.getServiceStatus()).thenReturn(statusData);

        mockMvc.perform(get("/api/v1/srs/reading/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data.configured", is(true)))
                .andExpect(jsonPath("$.data.tier", is("free")))
                .andExpect(jsonPath("$.data.provider", is("Google Gemini API")));
    }

    @Test
    @DisplayName("POST /api/v1/srs/reading/assess succeeds with valid audio payload")
    void testAssessReadingSuccess() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio",
                "recording.webm",
                "audio/webm",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8}
        );

        PronunciationAssessmentResponse mockResponse = new PronunciationAssessmentResponse();
        mockResponse.setStatus("assessed");
        mockResponse.setTargetText("学");
        mockResponse.setTargetPinyin("xué");
        mockResponse.setOverallScore(88);
        mockResponse.setConfidence("HIGH");
        mockResponse.setSummaryVi("Phát âm rõ ràng, đúng thanh 2.");
        mockResponse.setComponents(new PronunciationComponentsDto("Chuẩn", "Chuẩn", "Thanh điệu chính xác"));

        when(readingAssessmentService.assessReading(any(), eq("VOCABULARY"), eq(101L)))
                .thenReturn(mockResponse);

        mockMvc.perform(multipart("/api/v1/srs/reading/assess")
                        .file(audioFile)
                        .param("itemType", "VOCABULARY")
                        .param("itemId", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data.status", is("assessed")))
                .andExpect(jsonPath("$.data.targetText", is("学")))
                .andExpect(jsonPath("$.data.overallScore", is(88)))
                .andExpect(jsonPath("$.data.confidence", is("HIGH")));
    }

    @Test
    @DisplayName("POST /api/v1/srs/reading/assess returns unconfigured status when GEMINI_API_KEY is not set")
    void testAssessReadingUnconfigured() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "recording.webm", "audio/webm", new byte[]{1, 2, 3, 4}
        );

        PronunciationAssessmentResponse unconfiguredResp = PronunciationAssessmentResponse.unconfigured("学", "xué");
        when(readingAssessmentService.assessReading(any(), eq("VOCABULARY"), eq(101L)))
                .thenReturn(unconfiguredResp);

        mockMvc.perform(multipart("/api/v1/srs/reading/assess")
                        .file(audioFile)
                        .param("itemType", "VOCABULARY")
                        .param("itemId", "101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("unconfigured")))
                .andExpect(jsonPath("$.data.overallScore").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/srs/reading/assess returns 404 when target item is not found")
    void testAssessReadingNotFound() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "recording.webm", "audio/webm", new byte[]{1, 2, 3, 4}
        );

        when(readingAssessmentService.assessReading(any(), eq("VOCABULARY"), eq(999L)))
                .thenThrow(new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng"));

        mockMvc.perform(multipart("/api/v1/srs/reading/assess")
                        .file(audioFile)
                        .param("itemType", "VOCABULARY")
                        .param("itemId", "999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("NOT_FOUND")));
    }

    @Test
    @DisplayName("POST /api/v1/srs/reading/assess returns 429 when rate limit is exceeded")
    void testAssessReadingRateLimit() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "recording.webm", "audio/webm", new byte[]{1, 2, 3, 4}
        );

        when(readingAssessmentService.assessReading(any(), eq("VOCABULARY"), eq(101L)))
                .thenThrow(new BusinessException(ErrorCode.TOO_MANY_REQUESTS, "Bạn đang gửi yêu cầu quá nhanh"));

        mockMvc.perform(multipart("/api/v1/srs/reading/assess")
                        .file(audioFile)
                        .param("itemType", "VOCABULARY")
                        .param("itemId", "101"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("TOO_MANY_REQUESTS")));
    }
}
