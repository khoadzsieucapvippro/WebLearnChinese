package com.elearning.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Standardized DTO for pronunciation & tone assessment response (Chao 5-scale Tone Sandhi Engine).
 * Follows strict design guidelines:
 * - status: 'assessed' | 'not_scorable' | 'unconfigured' | 'engine_unavailable' | 'error'
 * - overallScore: 0..100 (null if status != 'assessed')
 * - confidence: 'HIGH' | 'MEDIUM' | 'LOW'
 * - Avoids pseudo-exact percentages; score is an educational estimate.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PronunciationAssessmentResponse {

    private String status;
    private String targetText;
    private String targetPinyin;
    private String recognizedText;
    private Integer overallScore;
    private String confidence;
    private String summaryVi;
    private String pronunciationFeedback;
    private PronunciationComponentsDto components;
    private List<Map<String, Object>> syllables;
    private String retryAdvice;
    private String limitations;

    public PronunciationAssessmentResponse() {
    }

    public static PronunciationAssessmentResponse unconfigured(String targetText, String targetPinyin) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("unconfigured");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setSummaryVi("Hệ thống Phân tích Phát âm & Thanh điệu chưa được cấu hình địa chỉ dịch vụ.");
        res.setRetryAdvice("Quản trị viên vui lòng thiết lập biến môi trường SPEECH_SERVICE_URL trên máy chủ.");
        res.setLimitations("Chưa có dịch vụ speech-service hợp lệ để phân tích phát âm.");
        return res;
    }

    public static PronunciationAssessmentResponse notScorable(String targetText, String targetPinyin, String summaryVi, String retryAdvice) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("not_scorable");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setOverallScore(null);
        res.setSummaryVi(summaryVi != null ? summaryVi : "Không thể đánh giá bản ghi âm này.");
        res.setRetryAdvice(retryAdvice != null ? retryAdvice : "Vui lòng đọc to, rõ ràng và gần micro hơn.");
        res.setLimitations("Bản ghi âm không đủ rõ ràng hoặc chứa tạp âm lớn để phân tích đường cao độ F0.");
        return res;
    }

    public static PronunciationAssessmentResponse engineUnavailable(String targetText, String targetPinyin) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("engine_unavailable");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setOverallScore(null);
        res.setSummaryVi("Hệ thống Phân tích Phát âm & Thanh điệu chưa được khởi chạy hoặc không thể kết nối.");
        res.setRetryAdvice("Quản trị viên vui lòng khởi chạy speech-service (cổng 8000) hoặc kiểm tra SPEECH_SERVICE_URL.");
        res.setLimitations("Hệ thống phân tích âm học cục bộ chưa sẵn sàng.");
        return res;
    }

    public static PronunciationAssessmentResponse coldStartWakingUp(String targetText, String targetPinyin) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("engine_unavailable");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setOverallScore(null);
        res.setSummaryVi("Hệ thống Phân tích Phát âm & Thanh điệu đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s).");
        res.setRetryAdvice("Máy chủ phân tích âm thanh cần khoảng 30-50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm 'Thử đọc lại' sau giây lát hoặc bấm 'Bỏ qua →' để tiếp tục ôn tập.");
        res.setLimitations("Hệ thống speech-service đang được đánh thức từ chế độ ngủ (Render Free Tier).");
        return res;
    }

    public static PronunciationAssessmentResponse error(String targetText, String targetPinyin, String errorMessage) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("error");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setOverallScore(null);
        res.setSummaryVi(errorMessage != null ? errorMessage : "Đã xảy ra lỗi khi phân tích phát âm.");
        res.setRetryAdvice("Vui lòng thử lại sau giây lát.");
        res.setLimitations("Hệ thống phân tích phát âm tạm thời gặp gián đoạn.");
        return res;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTargetText() {
        return targetText;
    }

    public void setTargetText(String targetText) {
        this.targetText = targetText;
    }

    public String getTargetPinyin() {
        return targetPinyin;
    }

    public void setTargetPinyin(String targetPinyin) {
        this.targetPinyin = targetPinyin;
    }

    public String getRecognizedText() {
        return recognizedText;
    }

    public void setRecognizedText(String recognizedText) {
        this.recognizedText = recognizedText;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public String getConfidence() {
        return confidence;
    }

    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }

    public String getSummaryVi() {
        return summaryVi;
    }

    public void setSummaryVi(String summaryVi) {
        this.summaryVi = summaryVi;
    }

    public String getPronunciationFeedback() {
        return pronunciationFeedback;
    }

    public void setPronunciationFeedback(String pronunciationFeedback) {
        this.pronunciationFeedback = pronunciationFeedback;
    }

    public PronunciationComponentsDto getComponents() {
        return components;
    }

    public void setComponents(PronunciationComponentsDto components) {
        this.components = components;
    }

    public List<Map<String, Object>> getSyllables() {
        return syllables;
    }

    public void setSyllables(List<Map<String, Object>> syllables) {
        this.syllables = syllables;
    }

    public String getRetryAdvice() {
        return retryAdvice;
    }

    public void setRetryAdvice(String retryAdvice) {
        this.retryAdvice = retryAdvice;
    }

    public String getLimitations() {
        return limitations;
    }

    public void setLimitations(String limitations) {
        this.limitations = limitations;
    }
}
