package com.elearning;

import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.entity.Account;
import com.elearning.entity.CardProgress;
import com.elearning.entity.ReviewLog;
import com.elearning.entity.UserProfile;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.impl.SrsServiceImpl;
import com.elearning.service.srs.ReviewRating;
import com.elearning.service.srs.SrsCalculationResult;
import com.elearning.service.srs.SrsCalculator;
import com.elearning.service.srs.TwoMinuteTestSrsCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TwoMinuteTestSrsCalculator & SRS 2-Minute Test Mode Verification")
class TwoMinuteTestSrsCalculatorTests {

    private TwoMinuteTestSrsCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new TwoMinuteTestSrsCalculator();
    }

    @Nested
    @DisplayName("1. Unit Tests for Pure TwoMinuteTestSrsCalculator")
    class CalculatorPureTests {

        @Test
        @DisplayName("AGAIN (rating 1) resets repetitions and intervalDays to 0")
        void testAgain_resetsToZero() {
            SrsCalculationResult result = calculator.calculate(
                    new BigDecimal("2.50"), 1, 3, ReviewRating.AGAIN, 2);

            assertThat(result.intervalDays()).isEqualTo(0);
            assertThat(result.repetitions()).isEqualTo(0);
            assertThat(result.easeFactor()).isEqualTo(new BigDecimal("2.30"));
        }

        @Test
        @DisplayName("HARD (rating 2) sets intervalDays to 1, increments repetitions, decreases EF")
        void testHard_incrementsRepetitionsAndDecreasesEf() {
            SrsCalculationResult result = calculator.calculate(
                    new BigDecimal("2.50"), 0, 0, ReviewRating.HARD, 2);

            assertThat(result.intervalDays()).isEqualTo(1);
            assertThat(result.repetitions()).isEqualTo(1);
            assertThat(result.easeFactor()).isEqualTo(new BigDecimal("2.36"));
        }

        @Test
        @DisplayName("GOOD (rating 3) sets intervalDays to 1, increments repetitions, maintains EF")
        void testGood_maintainsEf() {
            SrsCalculationResult result = calculator.calculate(
                    new BigDecimal("2.50"), 1, 1, ReviewRating.GOOD, 2);

            assertThat(result.intervalDays()).isEqualTo(1);
            assertThat(result.repetitions()).isEqualTo(2);
            assertThat(result.easeFactor()).isEqualTo(new BigDecimal("2.50"));
        }

        @Test
        @DisplayName("EASY (rating 4) sets intervalDays to 1, increments repetitions, increases EF")
        void testEasy_increasesEf() {
            SrsCalculationResult result = calculator.calculate(
                    new BigDecimal("2.50"), 1, 2, ReviewRating.EASY, 2);

            assertThat(result.intervalDays()).isEqualTo(1);
            assertThat(result.repetitions()).isEqualTo(3);
            assertThat(result.easeFactor()).isEqualTo(new BigDecimal("2.60"));
        }

        @Test
        @DisplayName("Null rating throws IllegalArgumentException")
        void testNullRating_throwsException() {
            assertThatThrownBy(() -> calculator.calculate(new BigDecimal("2.50"), 1, 1, null, 2))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("2. Service Integration Tests: 2-Minute Mode vs Original SM-2 Mode")
    class ServiceModeTests {

        @Mock
        private CardProgressRepository cardProgressRepository;
        @Mock
        private ReviewLogRepository reviewLogRepository;
        @Mock
        private UserSrsSettingRepository userSrsSettingRepository;
        @Mock
        private VocabularyRepository vocabularyRepository;
        @Mock
        private RadicalRepository radicalRepository;
        @Mock
        private UserProfileRepository userProfileRepository;
        @Mock
        private LessonRepository lessonRepository;
        @Mock
        private LessonVocabularyRepository lessonVocabularyRepository;

        private SrsServiceImpl srsService;
        private UserProfile testUserProfile;
        private Clock fixedClock;
        private LocalDateTime fixedNow;

        @BeforeEach
        void initService() {
            // Fixed clock at 2026-10-26 10:00:00 UTC
            Instant fixedInstant = Instant.parse("2026-10-26T10:00:00Z");
            ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
            fixedClock = Clock.fixed(fixedInstant, zoneId);
            fixedNow = LocalDateTime.now(fixedClock);

            srsService = new SrsServiceImpl(
                    cardProgressRepository,
                    reviewLogRepository,
                    userSrsSettingRepository,
                    vocabularyRepository,
                    radicalRepository,
                    userProfileRepository,
                    lessonRepository,
                    lessonVocabularyRepository,
                    new SrsCalculator(),
                    fixedClock
            );

            Account account = new Account();
            account.setEmailOrPhone("testuser@elearning.com");
            account.setAccountId(99L);
            testUserProfile = new UserProfile();
            testUserProfile.setAccount(account);
            testUserProfile.setUserId(99L);

            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken("testuser@elearning.com", null,
                            List.of(new SimpleGrantedAuthority("ROLE_LEARNER")))
            );

            when(userProfileRepository.findByAccountEmailOrPhoneWithLock("testuser@elearning.com"))
                    .thenReturn(Optional.of(testUserProfile));
        }

        @AfterEach
        void tearDown() {
            SecurityContextHolder.clearContext();
        }

        @Test
        @DisplayName("When testModeEnabled=true: Thẻ sau khi ôn tập được đặt nextReviewAt đúng 2 phút sau")
        void testReviewCard_testModeEnabled_schedulesTwoMinutesLater() {
            srsService.setTestModeEnabled(true);
            srsService.setTestIntervalMinutes(2);

            Vocabulary vocab = new Vocabulary("好", "hǎo", "hao", "Hảo", "Tốt");
            vocab.setVocabId(101L);
            when(vocabularyRepository.findByIdWithLock(101L)).thenReturn(Optional.of(vocab));
            when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(101L)).thenReturn(true);
            when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(any(), any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 101L, 3, 5); // Rating 3 = Good
            request.setCardType("READING");

            DueCardResponse response = srsService.reviewCard(request);

            assertThat(response).isNotNull();
            assertThat(response.getNextReviewAt()).isEqualTo(fixedNow.plusMinutes(2));

            ArgumentCaptor<CardProgress> captor = ArgumentCaptor.forClass(CardProgress.class);
            verify(cardProgressRepository).save(captor.capture());
            CardProgress saved = captor.getValue();
            assertThat(saved.getNextReviewAt()).isEqualTo(fixedNow.plusMinutes(2));
            assertThat(saved.getIntervalDays()).isEqualTo(1);
        }

        @Test
        @DisplayName("When testModeEnabled=true and rating=1 (Again): Thẻ đến hạn ngay lập tức")
        void testReviewCard_testModeEnabled_againIsImmediate() {
            srsService.setTestModeEnabled(true);

            Vocabulary vocab = new Vocabulary("好", "hǎo", "hao", "Hảo", "Tốt");
            vocab.setVocabId(101L);
            when(vocabularyRepository.findByIdWithLock(101L)).thenReturn(Optional.of(vocab));
            when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(101L)).thenReturn(true);
            when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(any(), any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 101L, 1, 5); // Rating 1 = Again
            request.setCardType("READING");

            DueCardResponse response = srsService.reviewCard(request);

            assertThat(response.getNextReviewAt()).isEqualTo(fixedNow);
            assertThat(response.getIntervalDays()).isEqualTo(0);
        }

        @Test
        @DisplayName("When testModeEnabled=false: Thuật toán gốc SM-2 được mở khóa lại và đặt nextReviewAt sau 1 ngày")
        void testReviewCard_testModeDisabled_restoresOriginalSm2Algorithm() {
            // Khóa test mode, mở lại thuật toán gốc SM-2
            srsService.setTestModeEnabled(false);

            Vocabulary vocab = new Vocabulary("好", "hǎo", "hao", "Hảo", "Tốt");
            vocab.setVocabId(101L);
            when(vocabularyRepository.findByIdWithLock(101L)).thenReturn(Optional.of(vocab));
            when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(101L)).thenReturn(true);
            when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(any(), any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 101L, 3, 5); // Rating 3 = Good (lần 1 -> 1 ngày)
            request.setCardType("READING");

            DueCardResponse response = srsService.reviewCard(request);

            // Thuật toán SM-2 gốc: 1 ngày sau (plusDays(1))
            assertThat(response.getNextReviewAt()).isEqualTo(fixedNow.plusDays(1));
            assertThat(response.getIntervalDays()).isEqualTo(1);
        }
    }
}
