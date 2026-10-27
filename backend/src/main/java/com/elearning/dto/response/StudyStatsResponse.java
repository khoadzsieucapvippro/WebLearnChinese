package com.elearning.dto.response;

/**
 * Response DTO providing learner study statistics for the SRS dashboard.
 */
public class StudyStatsResponse {

    private long cardsDue;
    private long cardsDueListening;
    private long cardsDueWriting;
    private long cardsDueReading;
    private long cardsDueFlashcard;
    private long reviewsToday;
    private int newCardsLimit;
    private int maxReviewLimit;
    private long newCardsToday;

    public StudyStatsResponse() {
    }

    public StudyStatsResponse(long cardsDue, long reviewsToday, int newCardsLimit, int maxReviewLimit) {
        this(cardsDue, reviewsToday, newCardsLimit, maxReviewLimit, 0L);
    }

    public StudyStatsResponse(long cardsDue, long reviewsToday, int newCardsLimit, int maxReviewLimit, long newCardsToday) {
        this(cardsDue, 0L, 0L, 0L, 0L, reviewsToday, newCardsLimit, maxReviewLimit, newCardsToday);
    }

    public StudyStatsResponse(long cardsDue, long cardsDueListening, long cardsDueWriting, long reviewsToday, int newCardsLimit, int maxReviewLimit, long newCardsToday) {
        this(cardsDue, cardsDueListening, cardsDueWriting, 0L, 0L, reviewsToday, newCardsLimit, maxReviewLimit, newCardsToday);
    }

    public StudyStatsResponse(long cardsDue, long cardsDueListening, long cardsDueWriting, long cardsDueReading, long reviewsToday, int newCardsLimit, int maxReviewLimit, long newCardsToday) {
        this(cardsDue, cardsDueListening, cardsDueWriting, cardsDueReading, 0L, reviewsToday, newCardsLimit, maxReviewLimit, newCardsToday);
    }

    public StudyStatsResponse(long cardsDue, long cardsDueListening, long cardsDueWriting, long cardsDueReading, long cardsDueFlashcard, long reviewsToday, int newCardsLimit, int maxReviewLimit, long newCardsToday) {
        this.cardsDue = cardsDue;
        this.cardsDueListening = cardsDueListening;
        this.cardsDueWriting = cardsDueWriting;
        this.cardsDueReading = cardsDueReading;
        this.cardsDueFlashcard = cardsDueFlashcard;
        this.reviewsToday = reviewsToday;
        this.newCardsLimit = newCardsLimit;
        this.maxReviewLimit = maxReviewLimit;
        this.newCardsToday = newCardsToday;
    }

    public long getCardsDue() {
        return cardsDue;
    }

    public void setCardsDue(long cardsDue) {
        this.cardsDue = cardsDue;
    }

    public long getCardsDueListening() {
        return cardsDueListening;
    }

    public void setCardsDueListening(long cardsDueListening) {
        this.cardsDueListening = cardsDueListening;
    }

    public long getCardsDueWriting() {
        return cardsDueWriting;
    }

    public void setCardsDueWriting(long cardsDueWriting) {
        this.cardsDueWriting = cardsDueWriting;
    }

    public long getCardsDueReading() {
        return cardsDueReading;
    }

    public void setCardsDueReading(long cardsDueReading) {
        this.cardsDueReading = cardsDueReading;
    }

    public long getCardsDueFlashcard() {
        return cardsDueFlashcard;
    }

    public void setCardsDueFlashcard(long cardsDueFlashcard) {
        this.cardsDueFlashcard = cardsDueFlashcard;
    }

    public long getReviewsToday() {
        return reviewsToday;
    }

    public void setReviewsToday(long reviewsToday) {
        this.reviewsToday = reviewsToday;
    }

    public int getNewCardsLimit() {
        return newCardsLimit;
    }

    public void setNewCardsLimit(int newCardsLimit) {
        this.newCardsLimit = newCardsLimit;
    }

    public int getMaxReviewLimit() {
        return maxReviewLimit;
    }

    public void setMaxReviewLimit(int maxReviewLimit) {
        this.maxReviewLimit = maxReviewLimit;
    }

    public long getNewCardsToday() {
        return newCardsToday;
    }

    public void setNewCardsToday(long newCardsToday) {
        this.newCardsToday = newCardsToday;
    }
}
