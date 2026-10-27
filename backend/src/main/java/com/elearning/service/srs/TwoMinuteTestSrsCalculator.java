package com.elearning.service.srs;

import java.math.BigDecimal;

/**
 * Thuật toán kiểm thử Spaced Repetition System (SRS) nhanh (chu kỳ 2 phút).
 * Được thiết kế riêng phục vụ kiểm thử và trải nghiệm nhanh vòng đời ôn tập SRS:
 * <ul>
 *   <li>Rating 1 (AGAIN): Quên / Học lại -> Đến hạn ngay lập tức (0 phút)</li>
 *   <li>Rating 2 (HARD): Khó -> Đến hạn sau khoảng 2 phút</li>
 *   <li>Rating 3 (GOOD): Chuẩn -> Đến hạn sau khoảng 2 phút</li>
 *   <li>Rating 4 (EASY): Dễ -> Đến hạn sau khoảng 2 phút</li>
 * </ul>
 * <p>
 * Thuật toán gốc SuperMemo SM-2 chuẩn (tính theo ngày) trong {@link SrsCalculator}
 * vẫn được lưu giữ nguyên vẹn 100% và có thể kích hoạt lại bất kỳ lúc nào bằng cách
 * chuyển cấu hình {@code app.srs.test-mode.enabled=false}.
 * </p>
 */
public class TwoMinuteTestSrsCalculator {

    public static final int DEFAULT_TEST_INTERVAL_MINUTES = 2;

    /**
     * Tính toán trạng thái thẻ cho chu kỳ kiểm thử nhanh.
     *
     * @param currentEaseFactor    hệ số dễ hiện tại
     * @param currentIntervalDays  khoảng cách hiện tại (dùng làm mốc tham chiếu)
     * @param currentRepetitions   số lần ôn tập thành công liên tiếp
     * @param rating               đánh giá người dùng (AGAIN, HARD, GOOD, EASY)
     * @param testIntervalMinutes  số phút cho chu kỳ kiểm thử (mặc định 2 phút)
     * @return kết quả tính toán SRS với repetitions, easeFactor và intervalDays
     */
    public SrsCalculationResult calculate(
            BigDecimal currentEaseFactor,
            int currentIntervalDays,
            int currentRepetitions,
            ReviewRating rating,
            int testIntervalMinutes) {

        if (rating == null) {
            throw new IllegalArgumentException("rating không được để null");
        }
        if (currentEaseFactor == null || currentEaseFactor.compareTo(BigDecimal.ZERO) <= 0) {
            currentEaseFactor = SrsCalculator.DEFAULT_EASE_FACTOR;
        }

        if (rating == ReviewRating.AGAIN) {
            // Học lại ngay lập tức (interval = 0, repetitions reset về 0)
            BigDecimal newEf = currentEaseFactor.subtract(new BigDecimal("0.20"))
                    .max(SrsCalculator.MIN_EASE_FACTOR)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            return new SrsCalculationResult(newEf, 0, 0);
        }

        // Với Hard, Good, Easy: Ôn tập thành công
        int newRepetitions = Math.max(0, currentRepetitions) + 1;
        BigDecimal newEf = switch (rating) {
            case HARD -> currentEaseFactor.subtract(new BigDecimal("0.14")).max(SrsCalculator.MIN_EASE_FACTOR);
            case GOOD -> currentEaseFactor;
            case EASY -> currentEaseFactor.add(new BigDecimal("0.10"));
            default -> currentEaseFactor;
        };
        newEf = newEf.setScale(2, java.math.RoundingMode.HALF_UP);

        // intervalDays = 1 để biểu thị thẻ đã vượt qua mốc ôn tập ban đầu,
        // kích hoạt bảo vệ chống ôn tập trước hạn (existing.getIntervalDays() > 0)
        // trong suốt 2 phút chờ.
        int intervalMarker = 1;

        return new SrsCalculationResult(newEf, intervalMarker, newRepetitions);
    }

    /**
     * Overload mặc định sử dụng 2 phút.
     */
    public SrsCalculationResult calculate(
            BigDecimal currentEaseFactor,
            int currentIntervalDays,
            int currentRepetitions,
            ReviewRating rating) {
        return calculate(currentEaseFactor, currentIntervalDays, currentRepetitions, rating, DEFAULT_TEST_INTERVAL_MINUTES);
    }
}
