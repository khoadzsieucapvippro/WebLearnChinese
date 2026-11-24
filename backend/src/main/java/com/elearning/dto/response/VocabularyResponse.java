package com.elearning.dto.response;

import com.elearning.entity.Vocabulary;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Summary Response DTO for Vocabulary catalog listing and search results.
 * Conforms to .agents/API.md section 2.2 and zero-entity-leak rules.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VocabularyResponse {

    private Long vocabId;
    private String hanzi;
    private String pinyin;
    private String pinyinRaw;
    private String meaningHanViet;
    private String meaningVi;
    private String audioUrl;
    private String videoWritingUrl;
    private String exampleSentence;
    private String exampleTranslation;
    private List<RadicalResponse> radicals = new ArrayList<>();
    private Integer hskLevel;
    private String hskStandard;
    private Integer hskSourceId;
    private String hskSourceLabel;
    private String hskEdition;
    private String partOfSpeech;
    private Integer homographIndex;
    private Integer sourcePdfPage;

    public VocabularyResponse() {
        this.radicals = new ArrayList<>();
    }

    public VocabularyResponse(Long vocabId, String hanzi, String pinyin, String pinyinRaw,
                              String meaningHanViet, String meaningVi, String audioUrl,
                              String videoWritingUrl, String exampleSentence, String exampleTranslation) {
        this.vocabId = vocabId;
        this.hanzi = hanzi;
        this.pinyin = pinyin;
        this.pinyinRaw = pinyinRaw;
        this.meaningHanViet = meaningHanViet;
        this.meaningVi = meaningVi;
        this.audioUrl = audioUrl;
        this.videoWritingUrl = videoWritingUrl;
        this.exampleSentence = exampleSentence;
        this.exampleTranslation = exampleTranslation;
        this.radicals = new ArrayList<>();
    }

    public VocabularyResponse(Long vocabId, String hanzi, String pinyin, String pinyinRaw,
                              String meaningHanViet, String meaningVi) {
        this(vocabId, hanzi, pinyin, pinyinRaw, meaningHanViet, meaningVi, null, null, null, null);
    }

    public static VocabularyResponse fromEntity(Vocabulary vocabulary) {
        if (vocabulary == null) {
            return null;
        }
        VocabularyResponse response = new VocabularyResponse(
                vocabulary.getVocabId(),
                vocabulary.getHanzi(),
                vocabulary.getPinyin(),
                vocabulary.getPinyinRaw(),
                vocabulary.getMeaningHanViet(),
                vocabulary.getMeaningVi(),
                vocabulary.getAudioUrl(),
                vocabulary.getVideoWritingUrl(),
                vocabulary.getExampleSentence(),
                vocabulary.getExampleTranslation()
        );
        List<RadicalResponse> radicalResponses = Collections.emptyList();
        try {
            if (vocabulary.getVocabRadicals() != null && !vocabulary.getVocabRadicals().isEmpty()) {
                radicalResponses = vocabulary.getVocabRadicals().stream()
                        .map(vr -> {
                            RadicalResponse rr = RadicalResponse.fromEntity(vr.getRadical());
                            if (rr != null) {
                                rr.setHanziChar(vr.getHanziChar());
                                rr.setComponentType(vr.getComponentType());
                                rr.setVerificationStatus(vr.getVerificationStatus());
                            }
                            return rr;
                        })
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(RadicalResponse::getRadicalId)
                                .thenComparing(rr -> rr.getHanziChar() != null ? rr.getHanziChar() : ""))
                        .toList();
            } else if (vocabulary.getRadicals() != null && !vocabulary.getRadicals().isEmpty()) {
                radicalResponses = vocabulary.getRadicals().stream()
                        .map(RadicalResponse::fromEntity)
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparing(RadicalResponse::getRadicalId))
                        .toList();
            }
        } catch (Exception ignored) {
            // Lazy initialization fallback if outside transaction
        }
        response.setRadicals(radicalResponses);
        response.setHskLevel(vocabulary.getHskLevel());
        response.setHskStandard(vocabulary.getHskStandard());
        response.setHskSourceId(vocabulary.getHskSourceId());
        response.setHskSourceLabel(vocabulary.getHskSourceLabel());
        response.setHskEdition(vocabulary.getHskEdition());
        response.setPartOfSpeech(vocabulary.getPartOfSpeech());
        response.setHomographIndex(vocabulary.getHomographIndex());
        response.setSourcePdfPage(vocabulary.getSourcePdfPage());
        return response;
    }

    public Long getVocabId() {
        return vocabId;
    }

    public void setVocabId(Long vocabId) {
        this.vocabId = vocabId;
    }

    public String getHanzi() {
        return hanzi;
    }

    public void setHanzi(String hanzi) {
        this.hanzi = hanzi;
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin;
    }

    public String getPinyinRaw() {
        return pinyinRaw;
    }

    public void setPinyinRaw(String pinyinRaw) {
        this.pinyinRaw = pinyinRaw;
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

    public String getExampleSentence() {
        return exampleSentence;
    }

    public void setExampleSentence(String exampleSentence) {
        this.exampleSentence = exampleSentence;
    }

    public String getExampleTranslation() {
        return exampleTranslation;
    }

    public void setExampleTranslation(String exampleTranslation) {
        this.exampleTranslation = exampleTranslation;
    }

    public List<RadicalResponse> getRadicals() {
        return radicals;
    }

    public void setRadicals(List<RadicalResponse> radicals) {
        this.radicals = (radicals != null) ? radicals : new ArrayList<>();
    }

    public Integer getHskLevel() {
        return hskLevel;
    }

    public void setHskLevel(Integer hskLevel) {
        this.hskLevel = hskLevel;
    }

    public String getHskStandard() {
        return hskStandard;
    }

    public void setHskStandard(String hskStandard) {
        this.hskStandard = hskStandard;
    }

    public Integer getHskSourceId() {
        return hskSourceId;
    }

    public void setHskSourceId(Integer hskSourceId) {
        this.hskSourceId = hskSourceId;
    }

    public String getHskSourceLabel() {
        return hskSourceLabel;
    }

    public void setHskSourceLabel(String hskSourceLabel) {
        this.hskSourceLabel = hskSourceLabel;
    }

    public String getHskEdition() {
        return hskEdition;
    }

    public void setHskEdition(String hskEdition) {
        this.hskEdition = hskEdition;
    }

    public String getPartOfSpeech() {
        return partOfSpeech;
    }

    public void setPartOfSpeech(String partOfSpeech) {
        this.partOfSpeech = partOfSpeech;
    }

    public Integer getHomographIndex() {
        return homographIndex;
    }

    public void setHomographIndex(Integer homographIndex) {
        this.homographIndex = homographIndex;
    }

    public Integer getSourcePdfPage() {
        return sourcePdfPage;
    }

    public void setSourcePdfPage(Integer sourcePdfPage) {
        this.sourcePdfPage = sourcePdfPage;
    }
}
