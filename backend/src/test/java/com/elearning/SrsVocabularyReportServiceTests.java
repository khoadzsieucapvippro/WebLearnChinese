package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.response.VocabularyReportResponse;
import com.elearning.entity.Account;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.exception.BusinessException;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.impl.SrsServiceImpl;
import com.elearning.service.srs.SrsCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Vocabulary Report Aggregation Unit Tests")
class SrsVocabularyReportServiceTests {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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

    @BeforeEach
    void setUp() {
        // Fixed business time: 2026-11-24T10:00:00+07:00 (Q4, November)
        Clock fixedClock = Clock.fixed(Instant.parse("2026-11-24T03:00:00Z"), BUSINESS_ZONE);
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
        account.setAccountId(1L);
        account.setEmailOrPhone("learner@example.com");
        account.setStatus("Active");

        testUserProfile = new UserProfile();
        testUserProfile.setUserId(10L);
        testUserProfile.setAccount(account);
        testUserProfile.setFullName("Learner Report");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "learner@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_Learner"))
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockBaseUserAndData() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@example.com"))
                .thenReturn(Optional.of(testUserProfile));

        UserSrsSetting setting = new UserSrsSetting();
        setting.setUser(testUserProfile);
        setting.setNewCardsPerDay(25);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.of(setting));
        when(vocabularyRepository.count()).thenReturn(1000L);
        when(radicalRepository.count()).thenReturn(214L);

        // Vocab 101 first learned 2026-11-24 (today)
        // Radical 101 first learned 2026-11-24 (today) - same numeric ID as Vocab 101, distinct itemType!
        // Vocab 103 first learned 2026-11-20 (Nov, Q4)
        // Vocab 104 first learned 2026-10-15 (Oct, Q4)
        // Vocab 105 first learned 2026-08-05 (Aug, Q3)
        List<Object[]> firstRows = List.of(
                new Object[]{"VOCABULARY", 101L, LocalDateTime.of(2026, 11, 24, 8, 30)},
                new Object[]{"RADICAL", 101L, LocalDateTime.of(2026, 11, 24, 9, 0)},
                new Object[]{"VOCABULARY", 103L, LocalDateTime.of(2026, 11, 20, 14, 0)},
                new Object[]{"VOCABULARY", 104L, LocalDateTime.of(2026, 10, 15, 19, 0)},
                new Object[]{"VOCABULARY", 105L, LocalDateTime.of(2026, 8, 5, 20, 0)}
        );
        when(reviewLogRepository.findFirstReviewedAtByUser(testUserProfile))
                .thenReturn(firstRows);

        // Review logs inside range: VOCABULARY:101 reviewed twice today, RADICAL:101 once today, VOCABULARY:104 re-reviewed today, VOCABULARY:103 reviewed Nov 20
        List<Object[]> activityRows = List.of(
                new Object[]{"VOCABULARY", 101L, LocalDateTime.of(2026, 11, 24, 8, 30), "FLASHCARD"},
                new Object[]{"VOCABULARY", 101L, LocalDateTime.of(2026, 11, 24, 8, 45), "FLASHCARD"},
                new Object[]{"RADICAL", 101L, LocalDateTime.of(2026, 11, 24, 9, 0), "FLASHCARD"},
                new Object[]{"VOCABULARY", 104L, LocalDateTime.of(2026, 11, 24, 9, 15), "READING"},
                new Object[]{"VOCABULARY", 103L, LocalDateTime.of(2026, 11, 20, 14, 0), "FLASHCARD"}
        );
        when(reviewLogRepository.findActivityInRangeByUser(
                eq(testUserProfile),
                any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(activityRows);
    }

    @Test
    @DisplayName("Aggregates daily buckets accurately without double-counting re-reviews as new words")
    void testGetVocabularyReport_dayPeriod() {
        mockBaseUserAndData();

        VocabularyReportResponse report = srsService.getVocabularyReport("day", null, 7, null);

        assertThat(report.getPeriod()).isEqualTo("day");
        assertThat(report.getDays()).isEqualTo(7);
        assertThat(report.getEndDate()).isEqualTo("2026-11-24");
        assertThat(report.getDailyGoal()).isEqualTo(25);
        assertThat(report.getBuckets()).hasSize(7);

        VocabularyReportResponse.VocabularyReportBucket todayBucket = report.getBuckets().get(6);
        assertThat(todayBucket.getKey()).isEqualTo("2026-11-24");
        assertThat(todayBucket.isCurrent()).isTrue();
        assertThat(todayBucket.getNewWordsCount()).isEqualTo(2L);       // VOCABULARY:101, RADICAL:101
        assertThat(todayBucket.getReviewedWordsCount()).isEqualTo(3L);  // VOCABULARY:101, RADICAL:101, VOCABULARY:104
        assertThat(todayBucket.getReviewActionsCount()).isEqualTo(4L);

        assertThat(report.getSummary().getTodayNewCount()).isEqualTo(2L);
        assertThat(report.getSummary().getTodayReviewedCount()).isEqualTo(3L);
        assertThat(report.getSummary().getMonthNewCount()).isEqualTo(3L);        // VOCABULARY:101, RADICAL:101, VOCABULARY:103
        assertThat(report.getSummary().getPreviousMonthNewCount()).isEqualTo(1L); // VOCABULARY:104
        assertThat(report.getSummary().getQuarterNewCount()).isEqualTo(4L);      // 4 items in Q4
        assertThat(report.getSummary().getTotalLearnedVocab()).isEqualTo(5L);    // all 5 distinct (itemType, itemId)
        assertThat(report.getSummary().getTotalSystemVocab()).isEqualTo(1214L);  // 1000 + 214
    }

    @Test
    @DisplayName("Aggregates monthly buckets for target year")
    void testGetVocabularyReport_monthPeriod() {
        mockBaseUserAndData();

        VocabularyReportResponse report = srsService.getVocabularyReport("month", 2026, null, null);

        assertThat(report.getPeriod()).isEqualTo("month");
        assertThat(report.getBuckets()).hasSize(12);
        assertThat(report.getBuckets().get(7).getKey()).isEqualTo("2026-08");
        assertThat(report.getBuckets().get(7).getNewWordsCount()).isEqualTo(1L);
        assertThat(report.getBuckets().get(9).getKey()).isEqualTo("2026-10");
        assertThat(report.getBuckets().get(9).getNewWordsCount()).isEqualTo(1L);
        assertThat(report.getBuckets().get(10).getKey()).isEqualTo("2026-11");
        assertThat(report.getBuckets().get(10).getNewWordsCount()).isEqualTo(3L);
        assertThat(report.getBuckets().get(10).isCurrent()).isTrue();
    }

    @Test
    @DisplayName("Aggregates quarterly buckets Q1..Q4 for target year")
    void testGetVocabularyReport_quarterPeriod() {
        mockBaseUserAndData();

        VocabularyReportResponse report = srsService.getVocabularyReport("quarter", 2026, null, null);

        assertThat(report.getPeriod()).isEqualTo("quarter");
        assertThat(report.getBuckets()).hasSize(4);
        assertThat(report.getBuckets().get(2).getKey()).isEqualTo("2026-Q3");
        assertThat(report.getBuckets().get(2).getNewWordsCount()).isEqualTo(1L);
        assertThat(report.getBuckets().get(3).getKey()).isEqualTo("2026-Q4");
        assertThat(report.getBuckets().get(3).getNewWordsCount()).isEqualTo(4L);
        assertThat(report.getBuckets().get(3).isCurrent()).isTrue();
    }

    @Test
    @DisplayName("Throws validation error for unsupported period, year, days, or malformed endDate")
    void testGetVocabularyReport_validationErrors() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@example.com"))
                .thenReturn(Optional.of(testUserProfile));

        assertThatThrownBy(() -> srsService.getVocabularyReport("weekly", null, null, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> srsService.getVocabularyReport("month", 1990, null, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> srsService.getVocabularyReport("day", null, 120, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> srsService.getVocabularyReport("day", null, 14, "24-11-2026"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);

        assertThatThrownBy(() -> srsService.getVocabularyReport("day", null, 14, null, "SPEAKING"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("Filters vocabulary report strictly by skill cardType when specified")
    void testGetVocabularyReport_skillFilter() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@example.com"))
                .thenReturn(Optional.of(testUserProfile));
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.empty());
        when(vocabularyRepository.count()).thenReturn(1000L);
        when(radicalRepository.count()).thenReturn(214L);

        List<Object[]> listeningFirstRows = List.of(
                new Object[]{"VOCABULARY", 101L, LocalDateTime.of(2026, 11, 24, 11, 0)},
                new Object[]{"RADICAL", 5L, LocalDateTime.of(2026, 11, 24, 11, 5)}
        );
        when(reviewLogRepository.findFirstReviewedAtByUserAndCardType(
                testUserProfile, "LISTENING"))
                .thenReturn(listeningFirstRows);

        List<Object[]> listeningActivityRows = List.of(
                new Object[]{"VOCABULARY", 101L, LocalDateTime.of(2026, 11, 24, 11, 0), "LISTENING"},
                new Object[]{"RADICAL", 5L, LocalDateTime.of(2026, 11, 24, 11, 5), "LISTENING"}
        );
        when(reviewLogRepository.findActivityInRangeByUserAndCardType(
                eq(testUserProfile),
                eq("LISTENING"),
                any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(listeningActivityRows);

        VocabularyReportResponse report = srsService.getVocabularyReport("day", null, 7, null, "LISTENING");

        assertThat(report.getCardType()).isEqualTo("LISTENING");
        assertThat(report.getSummary().getTodayNewCount()).isEqualTo(2L);
        assertThat(report.getSummary().getTodayReviewedCount()).isEqualTo(2L);
        VocabularyReportResponse.VocabularyReportBucket todayBucket = report.getBuckets().get(6);
        assertThat(todayBucket.getNewWordsCount()).isEqualTo(2L);
        assertThat(todayBucket.getSkillReviewedCounts().get("LISTENING")).isEqualTo(2L);
        assertThat(todayBucket.getSkillReviewedCounts().get("FLASHCARD")).isEqualTo(0L);
    }
}
