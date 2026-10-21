package com.elearning.service.impl;

import com.elearning.config.GeminiConfig;
import com.elearning.dto.response.PronunciationAssessmentResponse;
import com.elearning.dto.response.PronunciationComponentsDto;
import com.elearning.service.GeminiPronunciationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Implementation of Gemini AI pronunciation assessment service.
 * Enforces:
 * - Free tier only, zero paid upgrades or billable fallbacks.
 * - Zero persistence or logging of user audio streams.
 * - Structured JSON output parsing with Vietnamese pedagogical feedback.
 * - Honest 'not_scorable' handling when acoustic evidence is insufficient.
 */
@Service
public class GeminiPronunciationServiceImpl implements GeminiPronunciationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiPronunciationServiceImpl.class);

    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper;
    private volatile Client cachedClient;
    private volatile String cachedApiKey;

    public GeminiPronunciationServiceImpl(GeminiConfig geminiConfig, ObjectMapper objectMapper) {
        this.geminiConfig = geminiConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isConfigured() {
        return geminiConfig.isConfigured();
    }

    @Override
    public PronunciationAssessmentResponse assessPronunciation(
            byte[] audioBytes,
            String mimeType,
            String targetHanzi,
            String targetPinyin,
            String meaningHanViet) {

        if (!isConfigured()) {
            return PronunciationAssessmentResponse.unconfigured(targetHanzi, targetPinyin);
        }

        if (audioBytes == null || audioBytes.length == 0) {
            return PronunciationAssessmentResponse.notScorable(
                    targetHanzi, targetPinyin,
                    "Không nhận được dữ liệu âm thanh.",
                    "Vui lòng kiểm tra micro và thử đọc lại."
            );
        }

        String effectiveMimeType = normalizeMimeType(mimeType);

        try {
            // Asynchronous execution with explicit timeout to prevent thread starvation
            int timeoutSec = geminiConfig.getTimeoutSeconds();
            return CompletableFuture.supplyAsync(() -> callGeminiApi(audioBytes, effectiveMimeType, targetHanzi, targetPinyin, meaningHanViet))
                    .get(timeoutSec, TimeUnit.SECONDS);
        } catch (TimeoutException te) {
            log.warn("Gemini pronunciation assessment timed out after {}s for target: {}", geminiConfig.getTimeoutSeconds(), targetHanzi);
            return PronunciationAssessmentResponse.error(
                    targetHanzi, targetPinyin,
                    "Thời gian phân tích âm thanh quá lâu (Timeout). Vui lòng thử lại."
            );
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            log.warn("Gemini API call failed for target {}: {}", targetHanzi, msg);

            if (msg.contains("429") || msg.toLowerCase().contains("quota") || msg.toLowerCase().contains("resource_exhausted")) {
                return PronunciationAssessmentResponse.error(
                        targetHanzi, targetPinyin,
                        "Đã đạt giới hạn yêu cầu miễn phí của Google Gemini (Rate Limit / Quota). Vui lòng đợi 30 giây rồi thử lại."
                );
            }
            if (msg.contains("401") || msg.contains("403") || msg.toLowerCase().contains("api_key") || msg.toLowerCase().contains("invalid")) {
                return PronunciationAssessmentResponse.error(
                        targetHanzi, targetPinyin,
                        "Khóa truy cập Gemini API không hợp lệ hoặc chưa được cấp quyền."
                );
            }

            return PronunciationAssessmentResponse.error(
                    targetHanzi, targetPinyin,
                    "Dịch vụ AI tạm thời không thể xử lý yêu cầu. Vui lòng thử lại."
            );
        }
    }

    private Client getClient() {
        String apiKey = geminiConfig.getApiKey();
        if (cachedClient == null || !apiKey.equals(cachedApiKey)) {
            synchronized (this) {
                if (cachedClient == null || !apiKey.equals(cachedApiKey)) {
                    cachedClient = Client.builder()
                            .apiKey(apiKey)
                            .build();
                    cachedApiKey = apiKey;
                }
            }
        }
        return cachedClient;
    }

    private PronunciationAssessmentResponse callGeminiApi(
            byte[] audioBytes,
            String mimeType,
            String targetHanzi,
            String targetPinyin,
            String meaningHanViet) {

        Client client = getClient();

        String systemInstructionText = """
            Bạn là chuyên gia thẩm định phát âm tiếng Trung Quốc (Mandarin Chinese) cho người Việt Nam học tiếng Hán.
            Nhiệm vụ: Lắng nghe bản ghi âm của người học và đánh giá phát âm so với văn bản Hán ngữ mục tiêu (Target Hanzi và Target Pinyin) do hệ thống cung cấp.

            Quy tắc bắt buộc:
            1. Đánh giá giọng nói so với văn bản Hán ngữ mục tiêu. Nhận diện chữ Hán/Pinyin mà bạn thực sự nghe được từ âm thanh.
            2. Nếu âm thanh quá rè, quá ngắn, im lặng, chứa tạp âm lớn hoặc không thể nhận diện được người học đang đọc gì, hãy trả về status = 'not_scorable', overallScore = null, confidence = 'LOW', và đưa ra retryAdvice bằng tiếng Việt.
            3. Không bịa điểm số, không khẳng định độ chính xác khách quan tuyệt đối. Điểm overallScore (thang 0-100) chỉ là ước lượng tham khảo học tập dựa trên độ khớp ngữ âm, thanh điệu và độ rõ ràng. Nếu status là 'not_scorable', overallScore PHẢI là null.
            4. Phân biệt rõ giữa:
               - Đọc sai hoàn toàn / từ khác (overallScore thấp < 40, status = 'assessed' hoặc 'not_scorable' nếu không rõ).
               - Đọc đúng từ nhưng phát âm chưa chuẩn (ví dụ: nhầm thanh điệu 1-4, nhầm âm đầu zh/ch/sh/j/q/x, nhầm vận mẫu).
               - Đọc đúng và rõ ràng (overallScore >= 80).
            5. Nhận xét chi tiết các thành phần (components):
               - initialsFeedback: Nhận xét thanh mẫu (âm đầu), hoặc null nếu không có vấn đề đáng chú ý.
               - finalsFeedback: Nhận xét vận mẫu (vần), hoặc null nếu không có vấn đề đáng chú ý.
               - tonesFeedback: Nhận xét thanh điệu (thanh 1, 2, 3, 4, thanh nhẹ), hoặc null nếu không có vấn đề đáng chú ý.
            6. Hướng dẫn luyện tập và nhận xét hoàn toàn bằng tiếng Việt tự nhiên, dễ hiểu, khích lệ người học.
            7. Đưa ra limitations giải thích rõ: 'Điểm số và nhận xét là ước lượng tham khảo từ Gemini AI, không thay thế giáo viên bản ngữ'.
            8. Trả về kết quả ĐÚNG định dạng JSON theo schema:
            {
              "status": "assessed" | "not_scorable",
              "recognizedText": "chữ Hán hoặc pinyin nghe được",
              "overallScore": số nguyên 0-100 hoặc null,
              "confidence": "HIGH" | "MEDIUM" | "LOW",
              "summaryVi": "nhận xét tổng quan ngắn gọn bằng tiếng Việt",
              "pronunciationFeedback": "gợi ý cải thiện phát âm cụ thể",
              "components": {
                "initialsFeedback": "nhận xét thanh mẫu hoặc null",
                "finalsFeedback": "nhận xét vận mẫu hoặc null",
                "tonesFeedback": "nhận xét thanh điệu hoặc null"
              },
              "retryAdvice": "lời khuyên khi đọc lại",
              "limitations": "giải thích giới hạn đánh giá AI"
            }
            """;

        String userPromptText = String.format("""
            Target Hanzi: %s
            Target Pinyin: %s
            Target Meaning (Hán-Việt): %s
            Lưu ý: Hãy lắng nghe tệp âm thanh đính kèm và thẩm định phát âm theo văn bản mục tiêu trên.
            """,
                targetHanzi,
                targetPinyin != null ? targetPinyin : "",
                meaningHanViet != null ? meaningHanViet : ""
        );

        Part mediaPart = Part.fromBytes(audioBytes, mimeType);
        Part textPart = Part.fromText(userPromptText);
        Content content = Content.fromParts(mediaPart, textPart);

        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(systemInstructionText)))
                .responseMimeType("application/json")
                .temperature(0.2f)
                .build();

        GenerateContentResponse response = client.models.generateContent(
                geminiConfig.getModel(),
                content,
                config
        );

        String jsonText = response.text();
        return parseGeminiResponse(jsonText, targetHanzi, targetPinyin);
    }

    private PronunciationAssessmentResponse parseGeminiResponse(String rawText, String targetHanzi, String targetPinyin) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return PronunciationAssessmentResponse.notScorable(
                    targetHanzi, targetPinyin,
                    "Mô hình không trả về nội dung đánh giá.",
                    "Vui lòng thử đọc lại lần nữa."
            );
        }

        String cleaned = cleanJsonFences(rawText);

        try {
            JsonNode root = objectMapper.readTree(cleaned);

            PronunciationAssessmentResponse resp = new PronunciationAssessmentResponse();
            resp.setTargetText(targetHanzi);
            resp.setTargetPinyin(targetPinyin);

            String status = root.path("status").asText("assessed");
            if (!"assessed".equalsIgnoreCase(status) && !"not_scorable".equalsIgnoreCase(status)) {
                status = "assessed";
            }
            resp.setStatus(status);

            if (root.hasNonNull("overallScore") && "assessed".equalsIgnoreCase(status)) {
                int score = root.path("overallScore").asInt();
                resp.setOverallScore(Math.max(0, Math.min(100, score)));
            } else {
                resp.setOverallScore(null);
            }

            resp.setConfidence(root.path("confidence").asText("MEDIUM"));
            resp.setRecognizedText(root.path("recognizedText").asText(""));
            resp.setSummaryVi(root.path("summaryVi").asText("Đã hoàn tất phân tích âm thanh."));
            resp.setPronunciationFeedback(root.path("pronunciationFeedback").asText(""));
            resp.setRetryAdvice(root.path("retryAdvice").asText("Tiếp tục luyện tập để phát âm chuẩn hơn."));
            resp.setLimitations(root.path("limitations").asText("Điểm số là ước lượng tham khảo từ Gemini AI."));

            if (root.has("components") && root.get("components").isObject()) {
                JsonNode compNode = root.get("components");
                PronunciationComponentsDto comp = new PronunciationComponentsDto();
                if (compNode.hasNonNull("initialsFeedback")) comp.setInitialsFeedback(compNode.path("initialsFeedback").asText());
                if (compNode.hasNonNull("finalsFeedback")) comp.setFinalsFeedback(compNode.path("finalsFeedback").asText());
                if (compNode.hasNonNull("tonesFeedback")) comp.setTonesFeedback(compNode.path("tonesFeedback").asText());
                resp.setComponents(comp);
            }

            return resp;

        } catch (Exception e) {
            log.warn("Failed to parse Gemini JSON output for target {}: {}", targetHanzi, e.getMessage());
            return PronunciationAssessmentResponse.notScorable(
                    targetHanzi, targetPinyin,
                    "Phản hồi từ AI không đúng định dạng chuẩn.",
                    "Vui lòng đọc lại rõ ràng hơn."
            );
        }
    }

    private String cleanJsonFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private String normalizeMimeType(String mimeType) {
        if (mimeType == null || mimeType.trim().isEmpty()) {
            return "audio/webm";
        }
        String clean = mimeType.split(";")[0].trim().toLowerCase();
        return switch (clean) {
            case "audio/webm" -> "audio/webm";
            case "audio/ogg" -> "audio/ogg";
            case "audio/mp4" -> "audio/mp4";
            case "audio/wav", "audio/x-wav" -> "audio/wav";
            case "audio/mpeg", "audio/mp3" -> "audio/mp3";
            case "audio/aac" -> "audio/aac";
            default -> "audio/webm";
        };
    }
}
