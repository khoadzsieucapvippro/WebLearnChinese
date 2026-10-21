package com.elearning.service.impl;

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
import com.elearning.service.ReadingAssessmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementation of ReadingAssessmentService.
 * Enforces:
 * - Server-authoritative target text verification from database (never blindly trusts client).
 * - Per-user rate limiting to protect Gemini free-tier quota (15 requests/minute).
 * - Payload size and audio MIME type validation.
 * - Zero persistence of audio files (pure in-memory transient processing).
 */
@Service
public class ReadingAssessmentServiceImpl implements ReadingAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(ReadingAssessmentServiceImpl.class);

    private static final int MAX_REQUESTS_PER_MINUTE = 15;
    private static final long ONE_MINUTE_MS = 60_000L;

    private final GeminiPronunciationService geminiPronunciationService;
    private final LocalSpeechServiceClient localSpeechServiceClient;
    private final VocabularyRepository vocabularyRepository;
    private final RadicalRepository radicalRepository;
    private final GeminiConfig geminiConfig;
    private final LocalSpeechConfig localSpeechConfig;

    // In-memory sliding window rate limiter per user account
    private final Map<String, UserRateWindow> rateLimiterMap = new ConcurrentHashMap<>();

    public ReadingAssessmentServiceImpl(
            GeminiPronunciationService geminiPronunciationService,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            GeminiConfig geminiConfig) {
        this(geminiPronunciationService, null, vocabularyRepository, radicalRepository, geminiConfig, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ReadingAssessmentServiceImpl(
            GeminiPronunciationService geminiPronunciationService,
            LocalSpeechServiceClient localSpeechServiceClient,
            VocabularyRepository vocabularyRepository,
            RadicalRepository radicalRepository,
            GeminiConfig geminiConfig,
            LocalSpeechConfig localSpeechConfig) {
        this.geminiPronunciationService = geminiPronunciationService;
        this.localSpeechServiceClient = localSpeechServiceClient;
        this.vocabularyRepository = vocabularyRepository;
        this.radicalRepository = radicalRepository;
        this.geminiConfig = geminiConfig;
        this.localSpeechConfig = localSpeechConfig;
    }

    @Override
    public boolean isGeminiConfigured() {
        if (localSpeechConfig != null && localSpeechConfig.isEnabled()) {
            return true;
        }
        return geminiPronunciationService.isConfigured();
    }

    @Override
    public PronunciationAssessmentResponse assessReading(MultipartFile audio, String itemType, Long itemId) {
        String currentUser = resolveAuthenticatedUser();
        enforceRateLimit(currentUser);

        if (itemId == null || itemId <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Mã nội dung học tập (itemId) không hợp lệ");
        }

        if (itemType == null || itemType.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại nội dung (itemType) không được để trống");
        }

        String normalizedItemType = itemType.trim().toUpperCase();
        if (!"VOCABULARY".equals(normalizedItemType) && !"RADICAL".equals(normalizedItemType)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Loại nội dung phải là VOCABULARY hoặc RADICAL");
        }

        // Authoritative server-side resolution of target text and pinyin
        String targetHanzi;
        String targetPinyin;
        String meaningHanViet;

        if ("VOCABULARY".equals(normalizedItemType)) {
            Vocabulary vocab = vocabularyRepository.findById(itemId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng với ID: " + itemId));
            targetHanzi = vocab.getHanzi();
            targetPinyin = vocab.getPinyin();
            meaningHanViet = vocab.getMeaningHanViet();
        } else {
            Radical radical = radicalRepository.findById(itemId.intValue())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thủ với ID: " + itemId));
            targetHanzi = radical.getCharacter();
            targetPinyin = radical.getPinyin();
            meaningHanViet = radical.getMeaningHanViet();
        }

        // Validate audio file
        if (audio == null || audio.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Tệp âm thanh không được để trống");
        }

        if (audio.getSize() > geminiConfig.getMaxAudioBytes()) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE, "Dung lượng bản ghi âm vượt quá giới hạn 5MB");
        }

        if (audio.getSize() < 100) {
            return PronunciationAssessmentResponse.notScorable(
                    targetHanzi, targetPinyin,
                    "Bản ghi âm quá ngắn hoặc không có dữ liệu âm thanh.",
                    "Vui lòng nhấn nút micro và phát âm rõ ràng."
            );
        }

        String contentType = audio.getContentType();
        if (contentType != null && !contentType.toLowerCase().startsWith("audio/") && !contentType.toLowerCase().contains("octet-stream")) {
            throw new BusinessException(ErrorCode.FILE_TYPE_INVALID, "Định dạng tệp không phải âm thanh hợp lệ (ContentType: " + contentType + ")");
        }

        byte[] audioBytes;
        try {
            audioBytes = audio.getBytes();
        } catch (IOException e) {
            log.warn("Could not read audio upload bytes for user {}: {}", currentUser, e.getMessage());
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không thể đọc dữ liệu âm thanh tải lên");
        }

        if (localSpeechConfig != null && localSpeechConfig.isEnabled()) {
            return localSpeechServiceClient.assessPronunciation(
                    audioBytes,
                    contentType,
                    targetHanzi,
                    targetPinyin,
                    meaningHanViet
            );
        }

        return geminiPronunciationService.assessPronunciation(
                audioBytes,
                contentType,
                targetHanzi,
                targetPinyin,
                meaningHanViet
        );
    }

    private String resolveAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Người dùng chưa được xác thực");
        }
        return auth.getName();
    }

    private void enforceRateLimit(String username) {
        long now = System.currentTimeMillis();
        UserRateWindow window = rateLimiterMap.compute(username, (k, existing) -> {
            if (existing == null || now - existing.windowStart > ONE_MINUTE_MS) {
                return new UserRateWindow(now, 1);
            }
            existing.count++;
            return existing;
        });

        if (window.count > MAX_REQUESTS_PER_MINUTE) {
            throw new BusinessException(
                    ErrorCode.TOO_MANY_REQUESTS,
                    "Bạn đang gửi yêu cầu luyện đọc quá nhanh. Vui lòng đợi giây lát trước khi thử lại để bảo vệ hạn mức miễn phí."
            );
        }
    }

    private static class UserRateWindow {
        final long windowStart;
        int count;

        UserRateWindow(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
