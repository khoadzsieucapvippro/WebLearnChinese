package com.elearning.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standardized DTO for pronunciation evaluation response from Gemini AI.
 * Follows strict design guidelines:
 * - status: 'assessed' | 'not_scorable' | 'unconfigured' | 'error'
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
        res.setSummaryVi("Hệ thống chưa được cấu hình khóa truy cập Google Gemini (GEMINI_API_KEY).");
        res.setRetryAdvice("Vui lòng thiết lập biến môi trường GEMINI_API_KEY trên máy chủ để kích hoạt Luyện đọc.");
        res.setLimitations("Chưa có API key hợp lệ để gửi bản ghi âm đến Gemini API.");
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
        res.setLimitations("Bản ghi âm không đủ rõ ràng hoặc chứa tạp âm lớn để Gemini AI phân tích.");
        return res;
    }

    public static PronunciationAssessmentResponse engineUnavailable(String targetText, String targetPinyin) {
        PronunciationAssessmentResponse res = new PronunciationAssessmentResponse();
        res.setStatus("engine_unavailable");
        res.setTargetText(targetText);
        res.setTargetPinyin(targetPinyin);
        res.setConfidence("LOW");
        res.setOverallScore(null);
        res.setSummaryVi("Dịch vụ AI Luyện đọc Local chưa được khởi chạy hoặc không thể kết nối (cổng 8000).");
        res.setRetryAdvice("Quản trị viên vui lòng chạy lệnh: python run_service.py để kích hoạt engine.");
        res.setLimitations("Dịch vụ AI cục bộ chưa sẵn sàng.");
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
        res.setLimitations("Dịch vụ phân tích AI tạm thời gặp gián đoạn.");
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
