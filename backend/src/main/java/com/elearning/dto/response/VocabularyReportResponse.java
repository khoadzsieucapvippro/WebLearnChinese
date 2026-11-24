package com.elearning.dto.response;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Response DTO providing vocabulary learning progress aggregated by day, month, or quarter
 * for the authenticated learner, optionally filtered by SRS skill cardType.
 */
public class VocabularyReportResponse {

    private String period;
    private String cardType = "ALL";
    private int year;
    private int days;
    private String endDate;
    private int dailyGoal;
    private VocabularyReportSummary summary;
    private List<VocabularyReportBucket> buckets = new ArrayList<>();
    private List<Integer> availableYears = new ArrayList<>();

    public VocabularyReportResponse() {
    }

    public VocabularyReportResponse(
            String period,
            int year,
            int days,
            String endDate,
            int dailyGoal,
            VocabularyReportSummary summary,
            List<VocabularyReportBucket> buckets,
            List<Integer> availableYears) {
        this(period, "ALL", year, days, endDate, dailyGoal, summary, buckets, availableYears);
    }

    public VocabularyReportResponse(
            String period,
            String cardType,
            int year,
            int days,
            String endDate,
            int dailyGoal,
            VocabularyReportSummary summary,
            List<VocabularyReportBucket> buckets,
            List<Integer> availableYears) {
        this.period = period;
        this.cardType = cardType != null ? cardType : "ALL";
        this.year = year;
        this.days = days;
        this.endDate = endDate;
        this.dailyGoal = dailyGoal;
        this.summary = summary;
        this.buckets = buckets != null ? buckets : new ArrayList<>();
        this.availableYears = availableYears != null ? availableYears : new ArrayList<>();
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType != null ? cardType : "ALL";
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getDays() {
        return days;
    }

    public void setDays(int days) {
        this.days = days;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public int getDailyGoal() {
        return dailyGoal;
    }

    public void setDailyGoal(int dailyGoal) {
        this.dailyGoal = dailyGoal;
    }

    public VocabularyReportSummary getSummary() {
        return summary;
    }

    public void setSummary(VocabularyReportSummary summary) {
        this.summary = summary;
    }

    public List<VocabularyReportBucket> getBuckets() {
        return buckets;
    }

    public void setBuckets(List<VocabularyReportBucket> buckets) {
        this.buckets = buckets != null ? buckets : new ArrayList<>();
    }

    public List<Integer> getAvailableYears() {
        return availableYears;
    }

    public void setAvailableYears(List<Integer> availableYears) {
        this.availableYears = availableYears != null ? availableYears : new ArrayList<>();
    }

    public static class VocabularyReportSummary {

        private long todayNewCount;
        private long todayReviewedCount;
        private long monthNewCount;
        private long monthReviewedCount;
        private long previousMonthNewCount;
        private long quarterNewCount;
        private long quarterReviewedCount;
        private long totalLearnedVocab;
        private long totalSystemVocab;

        public VocabularyReportSummary() {
        }

        public VocabularyReportSummary(
                long todayNewCount,
                long todayReviewedCount,
                long monthNewCount,
                long monthReviewedCount,
                long previousMonthNewCount,
                long quarterNewCount,
                long quarterReviewedCount,
                long totalLearnedVocab,
                long totalSystemVocab) {
            this.todayNewCount = todayNewCount;
            this.todayReviewedCount = todayReviewedCount;
            this.monthNewCount = monthNewCount;
            this.monthReviewedCount = monthReviewedCount;
            this.previousMonthNewCount = previousMonthNewCount;
            this.quarterNewCount = quarterNewCount;
            this.quarterReviewedCount = quarterReviewedCount;
            this.totalLearnedVocab = totalLearnedVocab;
            this.totalSystemVocab = totalSystemVocab;
        }

        public long getTodayNewCount() {
            return todayNewCount;
        }

        public void setTodayNewCount(long todayNewCount) {
            this.todayNewCount = todayNewCount;
        }

        public long getTodayReviewedCount() {
            return todayReviewedCount;
        }

        public void setTodayReviewedCount(long todayReviewedCount) {
            this.todayReviewedCount = todayReviewedCount;
        }

        public long getMonthNewCount() {
            return monthNewCount;
        }

        public void setMonthNewCount(long monthNewCount) {
            this.monthNewCount = monthNewCount;
        }

        public long getMonthReviewedCount() {
            return monthReviewedCount;
        }

        public void setMonthReviewedCount(long monthReviewedCount) {
            this.monthReviewedCount = monthReviewedCount;
        }

        public long getPreviousMonthNewCount() {
            return previousMonthNewCount;
        }

        public void setPreviousMonthNewCount(long previousMonthNewCount) {
            this.previousMonthNewCount = previousMonthNewCount;
        }

        public long getQuarterNewCount() {
            return quarterNewCount;
        }

        public void setQuarterNewCount(long quarterNewCount) {
            this.quarterNewCount = quarterNewCount;
        }

        public long getQuarterReviewedCount() {
            return quarterReviewedCount;
        }

        public void setQuarterReviewedCount(long quarterReviewedCount) {
            this.quarterReviewedCount = quarterReviewedCount;
        }

        public long getTotalLearnedVocab() {
            return totalLearnedVocab;
        }

        public void setTotalLearnedVocab(long totalLearnedVocab) {
            this.totalLearnedVocab = totalLearnedVocab;
        }

        public long getTotalSystemVocab() {
            return totalSystemVocab;
        }

        public void setTotalSystemVocab(long totalSystemVocab) {
            this.totalSystemVocab = totalSystemVocab;
        }
    }

    public static class VocabularyReportBucket {

        private String key;
        private String label;
        private String fullLabel;
        private long newWordsCount;
        private long reviewedWordsCount;
        private long reviewActionsCount;
        private boolean current;
        private Map<String, Long> skillReviewedCounts = new LinkedHashMap<>();

        public VocabularyReportBucket() {
        }

        public VocabularyReportBucket(
                String key,
                String label,
                String fullLabel,
                long newWordsCount,
                long reviewedWordsCount,
                long reviewActionsCount,
                boolean current) {
            this(key, label, fullLabel, newWordsCount, reviewedWordsCount, reviewActionsCount, current, null);
        }

        public VocabularyReportBucket(
                String key,
                String label,
                String fullLabel,
                long newWordsCount,
                long reviewedWordsCount,
                long reviewActionsCount,
                boolean current,
                Map<String, Long> skillReviewedCounts) {
            this.key = key;
            this.label = label;
            this.fullLabel = fullLabel;
            this.newWordsCount = newWordsCount;
            this.reviewedWordsCount = reviewedWordsCount;
            this.reviewActionsCount = reviewActionsCount;
            this.current = current;
            this.skillReviewedCounts = skillReviewedCounts != null ? skillReviewedCounts : new LinkedHashMap<>();
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getFullLabel() {
            return fullLabel;
        }

        public void setFullLabel(String fullLabel) {
            this.fullLabel = fullLabel;
        }

        public long getNewWordsCount() {
            return newWordsCount;
        }

        public void setNewWordsCount(long newWordsCount) {
            this.newWordsCount = newWordsCount;
        }

        public long getReviewedWordsCount() {
            return reviewedWordsCount;
        }

        public void setReviewedWordsCount(long reviewedWordsCount) {
            this.reviewedWordsCount = reviewedWordsCount;
        }

        public long getReviewActionsCount() {
            return reviewActionsCount;
        }

        public void setReviewActionsCount(long reviewActionsCount) {
            this.reviewActionsCount = reviewActionsCount;
        }

        public boolean isCurrent() {
            return current;
        }

        public void setCurrent(boolean current) {
            this.current = current;
        }

        public Map<String, Long> getSkillReviewedCounts() {
            return skillReviewedCounts;
        }

        public void setSkillReviewedCounts(Map<String, Long> skillReviewedCounts) {
            this.skillReviewedCounts = skillReviewedCounts != null ? skillReviewedCounts : new LinkedHashMap<>();
        }
    }
}
