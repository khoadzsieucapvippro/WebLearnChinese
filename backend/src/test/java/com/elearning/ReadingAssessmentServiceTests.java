package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.config.GeminiConfig;
import com.elearning.config.LocalSpeechConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.entity.Radical;
import com.elearning.entity.Vocabulary;
import com.elearning.exception.BusinessException;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.GeminiPronunciationService;
import com.elearning.service.LocalSpeechServiceClient;
import com.elearning.service.impl.ReadingAssessmentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReadingAssessmentService Unit Tests")
class ReadingAssessmentServiceTests {

    @Mock
    private GeminiPronunciationService geminiPronunciationService;

    @Mock
    private LocalSpeechServiceClient localSpeechServiceClient;

    @Mock
    private LocalSpeechConfig localSpeechConfig;

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private RadicalRepository radicalRepository;

    @Mock
    private GeminiConfig geminiConfig;

    private ReadingAssessmentServiceImpl readingAssessmentService;

    @BeforeEach
    void setUp() {
        lenient().when(geminiConfig.getMaxAudioBytes()).thenReturn(5242880L);
        readingAssessmentService = new ReadingAssessmentServiceImpl(
                geminiPronunciationService,
                localSpeechServiceClient,
                vocabularyRepository,
                radicalRepository,
                geminiConfig,
                localSpeechConfig
        );

        // Set up mock authenticated user in SecurityContextHolder
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "learner@test.com", "password", Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("assessReading validates target vocabulary from server DB and delegates to Gemini")
    void testAssessReadingVocabularySuccess() {
        Vocabulary vocab = new Vocabulary();
        vocab.setVocabId(101L);
        vocab.setHanzi("请");
        vocab.setPinyin("qǐng");
        vocab.setMeaningHanViet("Thỉnh");
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(vocab));

        byte[] audioBytes = new byte[500];
        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", audioBytes);

        PronunciationAssessmentResponse mockResp = new PronunciationAssessmentResponse();
        mockResp.setStatus("assessed");
        mockResp.setOverallScore(90);
        when(geminiPronunciationService.assessPronunciation(any(), eq("audio/webm"), eq("请"), eq("qǐng"), eq("Thỉnh")))
                .thenReturn(mockResp);

        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertNotNull(result);
        assertEquals("assessed", result.getStatus());
        assertEquals(90, result.getOverallScore());
        verify(vocabularyRepository).findById(101L);
    }

    @Test
    @DisplayName("assessReading validates target radical from server DB and delegates to Gemini")
    void testAssessReadingRadicalSuccess() {
        Radical radical = new Radical();
        radical.setRadicalId(1);
        radical.setCharacter("一");
        radical.setPinyin("yī");
        radical.setMeaningHanViet("Nhất");
        when(radicalRepository.findById(1)).thenReturn(Optional.of(radical));

        byte[] audioBytes = new byte[300];
        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", audioBytes);

        PronunciationAssessmentResponse mockResp = new PronunciationAssessmentResponse();
        mockResp.setStatus("assessed");
        mockResp.setOverallScore(95);
        when(geminiPronunciationService.assessPronunciation(any(), eq("audio/webm"), eq("一"), eq("yī"), eq("Nhất")))
                .thenReturn(mockResp);

        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "RADICAL", 1L);

        assertNotNull(result);
        assertEquals("assessed", result.getStatus());
        assertEquals(95, result.getOverallScore());
        verify(radicalRepository).findById(1);
    }

    @Test
    @DisplayName("assessReading throws NOT_FOUND when vocabulary ID does not exist")
    void testAssessReadingVocabularyNotFound() {
        when(vocabularyRepository.findById(999L)).thenReturn(Optional.empty());

        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                readingAssessmentService.assessReading(audioFile, "VOCABULARY", 999L)
        );
        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
        verify(geminiPronunciationService, never()).assessPronunciation(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("assessReading throws VALIDATION_ERROR on unsupported itemType")
    void testAssessReadingInvalidItemType() {
        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                readingAssessmentService.assessReading(audioFile, "SENTENCE", 101L)
        );
        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
    }

    @Test
    @DisplayName("assessReading throws FILE_TOO_LARGE when audio exceeds 5MB")
    void testAssessReadingFileTooLarge() {
        Vocabulary vocab = new Vocabulary();
        vocab.setVocabId(101L);
        vocab.setHanzi("学");
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(vocab));

        byte[] bigAudio = new byte[5242881]; // 5MB + 1 byte
        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", bigAudio);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L)
        );
        assertEquals(ErrorCode.FILE_TOO_LARGE, ex.getErrorCode());
    }

    @Test
    @DisplayName("assessReading returns not_scorable when audio is too short (< 100 bytes)")
    void testAssessReadingAudioTooShort() {
        Vocabulary vocab = new Vocabulary();
        vocab.setVocabId(101L);
        vocab.setHanzi("学");
        vocab.setPinyin("xué");
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(vocab));

        byte[] tinyAudio = new byte[20]; // 20 bytes
        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", tinyAudio);

        PronunciationAssessmentResponse resp = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertEquals("not_scorable", resp.getStatus());
        assertNull(resp.getOverallScore());
        verify(geminiPronunciationService, never()).assessPronunciation(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("assessReading throws UNAUTHORIZED when no security context exists")
    void testAssessReadingUnauthenticated() {
        SecurityContextHolder.clearContext();

        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);

        BusinessException ex = assertThrows(BusinessException.class, () ->
                readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L)
        );
        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
    }

    @Test
    @DisplayName("getServiceStatus returns speech-service-local metadata when local engine is healthy")
    void testGetServiceStatusLocalEnabledAndHealthy() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(true);

        Map<String, Object> status = readingAssessmentService.getServiceStatus();

        assertEquals(true, status.get("configured"));
        assertEquals(true, status.get("available"));
        assertEquals("speech-service-local", status.get("provider"));
        assertEquals("local-offline", status.get("tier"));
    }

    @Test
    @DisplayName("getServiceStatus indicates fallback to Gemini when local engine is offline but Gemini is configured")
    void testGetServiceStatusLocalUnavailableFallbackToGemini() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(false);
        when(geminiPronunciationService.isConfigured()).thenReturn(true);

        Map<String, Object> status = readingAssessmentService.getServiceStatus();

        assertEquals(true, status.get("configured"));
        assertEquals(true, status.get("available"));
        assertEquals("Google Gemini API", status.get("provider"));
        assertEquals(true, status.get("fallback"));
    }

    @Test
    @DisplayName("assessReading falls back to Gemini when local engine returns engine_unavailable")
    void testAssessReadingFallbackToGeminiWhenLocalUnavailable() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        Vocabulary vocab = new Vocabulary();
        vocab.setVocabId(101L);
        vocab.setHanzi("学");
        vocab.setPinyin("xué");
        vocab.setMeaningHanViet("Học");
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(vocab));

        PronunciationAssessmentResponse unavailableResp = PronunciationAssessmentResponse.engineUnavailable("学", "xué");
        when(localSpeechServiceClient.assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học")))
                .thenReturn(unavailableResp);
        when(geminiPronunciationService.isConfigured()).thenReturn(true);

        PronunciationAssessmentResponse geminiSuccess = new PronunciationAssessmentResponse();
        geminiSuccess.setStatus("assessed");
        geminiSuccess.setOverallScore(92);
        when(geminiPronunciationService.assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học")))
                .thenReturn(geminiSuccess);

        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);
        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertNotNull(result);
        assertEquals("assessed", result.getStatus());
        assertEquals(92, result.getOverallScore());
        verify(geminiPronunciationService).assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học"));
    }

    @Test
    @DisplayName("isServiceAvailable returns true when local engine is enabled and healthy")
    void testIsServiceAvailableLocalHealthyReturnsTrue() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(true);

        assertTrue(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns true when local engine is down but Gemini fallback is configured")
    void testIsServiceAvailableLocalDownGeminiReadyReturnsTrue() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(false);
        when(geminiPronunciationService.isConfigured()).thenReturn(true);

        assertTrue(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns false when local engine is down and Gemini is not configured")
    void testIsServiceAvailableLocalDownGeminiNotConfiguredReturnsFalse() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(false);
        when(geminiPronunciationService.isConfigured()).thenReturn(false);

        assertFalse(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns true when local engine is disabled and Gemini is configured")
    void testIsServiceAvailableLocalDisabledGeminiReadyReturnsTrue() {
        when(localSpeechConfig.isEnabled()).thenReturn(false);
        when(geminiPronunciationService.isConfigured()).thenReturn(true);

        assertTrue(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns false when local engine is disabled and Gemini is not configured")
    void testIsServiceAvailableLocalDisabledGeminiNotConfiguredReturnsFalse() {
        when(localSpeechConfig.isEnabled()).thenReturn(false);
        when(geminiPronunciationService.isConfigured()).thenReturn(false);

        assertFalse(readingAssessmentService.isServiceAvailable());
    }
}
