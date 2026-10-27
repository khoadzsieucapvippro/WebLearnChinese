package com.elearning.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

/**
 * DTO representing a flashcard recall review submission by a learner.
 * Transports user rating and reaction time for Spaced Repetition calculation.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReviewCardRequest {

    @NotBlank(message = "Loại thẻ (itemType) không được để trống")
    @Pattern(regexp = "^(?i)(VOCABULARY|RADICAL)$", message = "Loại thẻ phải là VOCABULARY hoặc RADICAL")
    private String itemType;

    @NotNull(message = "ID thẻ (itemId) không được để trống")
    @Positive(message = "ID thẻ phải là số dương")
    private Long itemId;

    @Pattern(regexp = "^(?i)(READING|LISTENING|WRITING)$", message = "cardType phải là READING, LISTENING hoặc WRITING")
    private String cardType;

    private Long lessonId;

    @NotNull(message = "Điểm đánh giá (rating) không được để trống")
    @Min(value = 1, message = "Rating phải từ 1 đến 4 (1=Again, 2=Hard, 3=Good, 4=Easy)")
    @Max(value = 4, message = "Rating phải từ 1 đến 4 (1=Again, 2=Hard, 3=Good, 4=Easy)")
    private Integer rating;

    @NotNull(message = "Thời gian phản xạ (reviewTimeSeconds) không được để trống")
    @Min(value = 0, message = "Thời gian phản xạ không được âm")
    private Integer reviewTimeSeconds = 0;

    public ReviewCardRequest() {
    }

    public ReviewCardRequest(String itemType, Long itemId, Integer rating, Integer reviewTimeSeconds) {
        this(itemType, itemId, null, rating, reviewTimeSeconds);
    }

    public ReviewCardRequest(String itemType, Long itemId, String cardType, Integer rating, Integer reviewTimeSeconds) {
        this(itemType, itemId, cardType, null, rating, reviewTimeSeconds);
    }

    public ReviewCardRequest(String itemType, Long itemId, String cardType, Long lessonId, Integer rating, Integer reviewTimeSeconds) {
        this.itemType = itemType;
        this.itemId = itemId;
        this.cardType = cardType;
        this.lessonId = lessonId;
        this.rating = rating;
        this.reviewTimeSeconds = reviewTimeSeconds;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Integer getReviewTimeSeconds() {
        return reviewTimeSeconds;
    }

    public void setReviewTimeSeconds(Integer reviewTimeSeconds) {
        this.reviewTimeSeconds = reviewTimeSeconds;
    }
}
