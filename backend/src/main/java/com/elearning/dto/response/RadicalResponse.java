package com.elearning.dto.response;

import com.elearning.entity.Radical;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO representing summary catalog information for a Kangxi radical.
 * Used for listing and catalog retrieval (e.g. GET /api/v1/radicals).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RadicalResponse {

    private Integer radicalId;
    private String character;
    private String pinyin;
    private String meaningHanViet;
    private String meaningVi;
    private String audioUrl;
    private String videoWritingUrl;
    private String explanationVi;
    private String videoLessonUrl;
    private Integer commonRank;

    public RadicalResponse() {
    }

    public RadicalResponse(Integer radicalId, String character, String pinyin,
                           String meaningHanViet, String meaningVi,
                           String audioUrl, String videoWritingUrl) {
        this.radicalId = radicalId;
        this.character = character;
        this.pinyin = pinyin;
        this.meaningHanViet = meaningHanViet;
        this.meaningVi = meaningVi;
        this.audioUrl = audioUrl;
        this.videoWritingUrl = videoWritingUrl;
    }

    public RadicalResponse(Integer radicalId, String character, String pinyin,
                           String meaningHanViet, String meaningVi,
                           String audioUrl, String videoWritingUrl,
                           String explanationVi, String videoLessonUrl, Integer commonRank) {
        this(radicalId, character, pinyin, meaningHanViet, meaningVi, audioUrl, videoWritingUrl);
        this.explanationVi = explanationVi;
        this.videoLessonUrl = videoLessonUrl;
        this.commonRank = commonRank;
    }

    public static RadicalResponse fromEntity(Radical radical) {
        if (radical == null) {
            return null;
        }
        RadicalResponse response = new RadicalResponse(
                radical.getRadicalId(),
                radical.getCharacter(),
                radical.getPinyin(),
                radical.getMeaningHanViet(),
                radical.getMeaningVi(),
                radical.getAudioUrl(),
                radical.getVideoWritingUrl()
        );
        response.setExplanationVi(radical.getExplanationVi());
        response.setVideoLessonUrl(radical.getVideoLessonUrl());
        response.setCommonRank(radical.getCommonRank());
        return response;
    }

    public Integer getRadicalId() {
        return radicalId;
    }

    public void setRadicalId(Integer radicalId) {
        this.radicalId = radicalId;
    }

    public String getCharacter() {
        return character;
    }

    public void setCharacter(String character) {
        this.character = character;
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin;
    }

    public String getMeaningHanViet() {
        return meaningHanViet;
    }

    public void setMeaningHanViet(String meaningHanViet) {
        this.meaningHanViet = meaningHanViet;
    }

    public String getMeaningVi() {
        return meaningVi;
    }

    public void setMeaningVi(String meaningVi) {
        this.meaningVi = meaningVi;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getVideoWritingUrl() {
        return videoWritingUrl;
    }

    public void setVideoWritingUrl(String videoWritingUrl) {
        this.videoWritingUrl = videoWritingUrl;
    }

    public String getExplanationVi() {
        return explanationVi;
    }

    public void setExplanationVi(String explanationVi) {
        this.explanationVi = explanationVi;
    }

    public String getVideoLessonUrl() {
        return videoLessonUrl;
    }

    public void setVideoLessonUrl(String videoLessonUrl) {
        this.videoLessonUrl = videoLessonUrl;
    }

    public Integer getCommonRank() {
        return commonRank;
    }

    public void setCommonRank(Integer commonRank) {
        this.commonRank = commonRank;
    }

    @Override
    public String toString() {
        return "RadicalResponse{" +
                "radicalId=" + radicalId +
                ", character='" + character + '\'' +
                ", pinyin='" + pinyin + '\'' +
                ", meaningHanViet='" + meaningHanViet + '\'' +
                ", meaningVi='" + meaningVi + '\'' +
                ", audioUrl='" + audioUrl + '\'' +
                ", videoWritingUrl='" + videoWritingUrl + '\'' +
                '}';
    }
}
