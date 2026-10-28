package com.elearning.dto.response;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * DTO representing server-side curriculum learning progress for an authenticated learner.
 * Provides lesson-level and radical-chapter learned counts derived from CardProgress records.
 */
public class CurriculumProgressResponse {

    private Map<Long, Integer> lessonProgress;
    private Map<String, Integer> chapterProgress;
    private int totalLearnedVocabularies;
    private int totalLearnedRadicals;
    private List<Long> learnedVocabIds;
    private List<Long> learnedRadicalIds;

    public CurriculumProgressResponse() {
        this.lessonProgress = Collections.emptyMap();
        this.chapterProgress = Collections.emptyMap();
        this.learnedVocabIds = Collections.emptyList();
        this.learnedRadicalIds = Collections.emptyList();
    }

    public CurriculumProgressResponse(
            Map<Long, Integer> lessonProgress,
            Map<String, Integer> chapterProgress,
            int totalLearnedVocabularies,
            int totalLearnedRadicals,
            List<Long> learnedVocabIds,
            List<Long> learnedRadicalIds) {
        this.lessonProgress = lessonProgress != null ? lessonProgress : Collections.emptyMap();
        this.chapterProgress = chapterProgress != null ? chapterProgress : Collections.emptyMap();
        this.totalLearnedVocabularies = totalLearnedVocabularies;
        this.totalLearnedRadicals = totalLearnedRadicals;
        this.learnedVocabIds = learnedVocabIds != null ? learnedVocabIds : Collections.emptyList();
        this.learnedRadicalIds = learnedRadicalIds != null ? learnedRadicalIds : Collections.emptyList();
    }

    public Map<Long, Integer> getLessonProgress() {
        return lessonProgress;
    }

    public void setLessonProgress(Map<Long, Integer> lessonProgress) {
        this.lessonProgress = lessonProgress;
    }

    public Map<String, Integer> getChapterProgress() {
        return chapterProgress;
    }

    public void setChapterProgress(Map<String, Integer> chapterProgress) {
        this.chapterProgress = chapterProgress;
    }

    public int getTotalLearnedVocabularies() {
        return totalLearnedVocabularies;
    }

    public void setTotalLearnedVocabularies(int totalLearnedVocabularies) {
        this.totalLearnedVocabularies = totalLearnedVocabularies;
    }

    public int getTotalLearnedRadicals() {
        return totalLearnedRadicals;
    }

    public void setTotalLearnedRadicals(int totalLearnedRadicals) {
        this.totalLearnedRadicals = totalLearnedRadicals;
    }

    public List<Long> getLearnedVocabIds() {
        return learnedVocabIds;
    }

    public void setLearnedVocabIds(List<Long> learnedVocabIds) {
        this.learnedVocabIds = learnedVocabIds;
    }

    public List<Long> getLearnedRadicalIds() {
        return learnedRadicalIds;
    }

    public void setLearnedRadicalIds(List<Long> learnedRadicalIds) {
        this.learnedRadicalIds = learnedRadicalIds;
    }
}
