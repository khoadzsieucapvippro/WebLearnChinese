package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.config.LocalSpeechConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.entity.Radical;
import com.elearning.entity.Vocabulary;
import com.elearning.exception.BusinessException;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.VocabularyRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReadingAssessmentService Unit Tests")
class ReadingAssessmentServiceTests {

    @Mock
    private LocalSpeechServiceClient localSpeechServiceClient;

    @Mock
    private LocalSpeechConfig localSpeechConfig;

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private RadicalRepository radicalRepository;

    private ReadingAssessmentServiceImpl readingAssessmentService;

    @BeforeEach
    void setUp() {
        readingAssessmentService = new ReadingAssessmentServiceImpl(
                localSpeechServiceClient,
                vocabularyRepository,
                radicalRepository,
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
    @DisplayName("assessReading validates target vocabulary from server DB and delegates to local speech service")
    void testAssessReadingVocabularySuccess() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
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
        when(localSpeechServiceClient.assessPronunciation(any(), eq("audio/webm"), eq("请"), eq("qǐng"), eq("Thỉnh")))
                .thenReturn(mockResp);

        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertNotNull(result);
        assertEquals("assessed", result.getStatus());
        assertEquals(90, result.getOverallScore());
        verify(vocabularyRepository).findById(101L);
        verify(localSpeechServiceClient).assessPronunciation(any(), eq("audio/webm"), eq("请"), eq("qǐng"), eq("Thỉnh"));
    }

    @Test
    @DisplayName("assessReading validates target radical from server DB and delegates to local speech service")
    void testAssessReadingRadicalSuccess() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
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
        when(localSpeechServiceClient.assessPronunciation(any(), eq("audio/webm"), eq("一"), eq("yī"), eq("Nhất")))
                .thenReturn(mockResp);

        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "RADICAL", 1L);

        assertNotNull(result);
        assertEquals("assessed", result.getStatus());
        assertEquals(95, result.getOverallScore());
        verify(radicalRepository).findById(1);
        verify(localSpeechServiceClient).assessPronunciation(any(), eq("audio/webm"), eq("一"), eq("yī"), eq("Nhất"));
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
        verify(localSpeechServiceClient, never()).assessPronunciation(any(), any(), any(), any(), any());
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
        verify(localSpeechServiceClient, never()).assessPronunciation(any(), any(), any(), any(), any());
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
        assertEquals("open-source-offline", status.get("tier"));
        assertEquals("Chao-5-Scale Tone Sandhi Engine", status.get("model"));
    }

    @Test
    @DisplayName("getServiceStatus indicates unavailable when local engine is offline")
    void testGetServiceStatusLocalUnavailable() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(false);

        Map<String, Object> status = readingAssessmentService.getServiceStatus();

        assertEquals(true, status.get("configured"));
        assertEquals(false, status.get("available"));
        assertEquals("speech-service-local", status.get("provider"));
        assertEquals("open-source-offline", status.get("tier"));
    }

    @Test
    @DisplayName("getServiceStatus indicates unconfigured when local speech is disabled")
    void testGetServiceStatusLocalDisabled() {
        when(localSpeechConfig.isEnabled()).thenReturn(false);

        Map<String, Object> status = readingAssessmentService.getServiceStatus();

        assertEquals(false, status.get("configured"));
        assertEquals(false, status.get("available"));
        assertEquals("speech-service-local", status.get("provider"));
        assertEquals("open-source-offline", status.get("tier"));
    }

    @Test
    @DisplayName("assessReading directly returns engine_unavailable without cloud fallback")
    void testAssessReadingDirectReturnWhenLocalUnavailable() {
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

        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);
        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertNotNull(result);
        assertEquals("engine_unavailable", result.getStatus());
        verify(localSpeechServiceClient).assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học"));
    }

    @Test
    @DisplayName("assessReading directly returns coldStartWakingUp without cloud fallback")
    void testAssessReadingDirectReturnWhenLocalColdStart() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        Vocabulary vocab = new Vocabulary();
        vocab.setVocabId(101L);
        vocab.setHanzi("学");
        vocab.setPinyin("xué");
        vocab.setMeaningHanViet("Học");
        when(vocabularyRepository.findById(101L)).thenReturn(Optional.of(vocab));

        PronunciationAssessmentResponse coldStartResp = PronunciationAssessmentResponse.coldStartWakingUp("学", "xué");
        when(localSpeechServiceClient.assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học")))
                .thenReturn(coldStartResp);

        MockMultipartFile audioFile = new MockMultipartFile("audio", "speech.webm", "audio/webm", new byte[300]);
        PronunciationAssessmentResponse result = readingAssessmentService.assessReading(audioFile, "VOCABULARY", 101L);

        assertNotNull(result);
        assertEquals("engine_unavailable", result.getStatus());
        assertTrue(result.getSummaryVi().contains("Render Free Tier spin-up ~30-50s"));
        verify(localSpeechServiceClient).assessPronunciation(any(), any(), eq("学"), eq("xué"), eq("Học"));
    }

    @Test
    @DisplayName("isServiceAvailable returns true when local engine is enabled and healthy")
    void testIsServiceAvailableLocalHealthyReturnsTrue() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(true);

        assertTrue(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns false when local engine is down")
    void testIsServiceAvailableLocalDownReturnsFalse() {
        when(localSpeechConfig.isEnabled()).thenReturn(true);
        when(localSpeechServiceClient.isAvailable()).thenReturn(false);

        assertFalse(readingAssessmentService.isServiceAvailable());
    }

    @Test
    @DisplayName("isServiceAvailable returns false when local engine is disabled")
    void testIsServiceAvailableLocalDisabledReturnsFalse() {
        when(localSpeechConfig.isEnabled()).thenReturn(false);

        assertFalse(readingAssessmentService.isServiceAvailable());
    }
}
