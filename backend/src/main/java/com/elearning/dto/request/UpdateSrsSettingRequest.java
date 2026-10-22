package com.elearning.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request payload for updating learner's personalized Spaced Repetition System (SRS) parameters.
 * Validates strictly positive integers (> 0) and upper bound (<= 100) for daily new card limits.
 */
public class UpdateSrsSettingRequest {

    @NotNull(message = "Số thẻ mới mỗi ngày không được để trống")
    @Positive(message = "Số thẻ mới mỗi ngày phải là số nguyên dương lớn hơn 0")
    @Max(value = 100, message = "Số thẻ mới mỗi ngày không được vượt quá 100")
    private Integer newCardsPerDay;

    @Positive(message = "Số thẻ ôn tập tối đa mỗi ngày phải là số nguyên dương lớn hơn 0")
    private Integer maxReviewPerDay;

    public UpdateSrsSettingRequest() {
    }

    public UpdateSrsSettingRequest(Integer newCardsPerDay) {
        this.newCardsPerDay = newCardsPerDay;
    }

    public UpdateSrsSettingRequest(Integer newCardsPerDay, Integer maxReviewPerDay) {
        this.newCardsPerDay = newCardsPerDay;
        this.maxReviewPerDay = maxReviewPerDay;
    }

    public Integer getNewCardsPerDay() {
        return newCardsPerDay;
    }

    public void setNewCardsPerDay(Integer newCardsPerDay) {
        this.newCardsPerDay = newCardsPerDay;
    }

    public Integer getMaxReviewPerDay() {
        return maxReviewPerDay;
    }

    public void setMaxReviewPerDay(Integer maxReviewPerDay) {
        this.maxReviewPerDay = maxReviewPerDay;
    }
}
