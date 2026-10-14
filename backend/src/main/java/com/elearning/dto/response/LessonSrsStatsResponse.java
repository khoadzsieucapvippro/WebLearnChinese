package com.elearning.dto.response;

/**
 * Response DTO providing lesson-scoped SRS statistics.
 */
public class LessonSrsStatsResponse {

    private Long lessonId;
    private Integer totalVocabularies;
    private Long newWordsCount;
    private Long dueCardsCount;
    private Long dueCardsListening;
    private Long dueCardsWriting;
    private Long dueCardsReading;

    public LessonSrsStatsResponse() {
    }

    public LessonSrsStatsResponse(
            Long lessonId,
            Integer totalVocabularies,
            Long newWordsCount,
            Long dueCardsCount,
            Long dueCardsListening,
            Long dueCardsWriting,
            Long dueCardsReading) {
        this.lessonId = lessonId;
        this.totalVocabularies = totalVocabularies;
        this.newWordsCount = newWordsCount;
        this.dueCardsCount = dueCardsCount;
        this.dueCardsListening = dueCardsListening;
        this.dueCardsWriting = dueCardsWriting;
        this.dueCardsReading = dueCardsReading;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Integer getTotalVocabularies() {
        return totalVocabularies;
    }

    public void setTotalVocabularies(Integer totalVocabularies) {
        this.totalVocabularies = totalVocabularies;
    }

    public Long getNewWordsCount() {
        return newWordsCount;
    }

    public void setNewWordsCount(Long newWordsCount) {
        this.newWordsCount = newWordsCount;
    }

    public Long getDueCardsCount() {
        return dueCardsCount;
    }

    public void setDueCardsCount(Long dueCardsCount) {
        this.dueCardsCount = dueCardsCount;
    }

    public Long getDueCardsListening() {
        return dueCardsListening;
    }

    public void setDueCardsListening(Long dueCardsListening) {
        this.dueCardsListening = dueCardsListening;
    }

    public Long getDueCardsWriting() {
        return dueCardsWriting;
    }

    public void setDueCardsWriting(Long dueCardsWriting) {
        this.dueCardsWriting = dueCardsWriting;
    }

    public Long getDueCardsReading() {
        return dueCardsReading;
    }

    public void setDueCardsReading(Long dueCardsReading) {
        this.dueCardsReading = dueCardsReading;
    }
}
