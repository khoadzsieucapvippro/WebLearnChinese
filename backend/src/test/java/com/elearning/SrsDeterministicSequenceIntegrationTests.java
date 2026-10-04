package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.entity.Account;
import com.elearning.entity.CardProgress;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.Radical;
import com.elearning.entity.ReviewLog;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.entity.Vocabulary;
import com.elearning.exception.BusinessException;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.RadicalRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.impl.SrsServiceImpl;
import com.elearning.service.srs.SrsCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Task: Deterministic SM-2 SRS Regression Test Suite with Time Simulation.
 * Verifies Cases A through G + Quotas + Isolation using a MutableClock.
 */
@SpringBootTest
@DisplayName("Deterministic SM-2 SRS Sequence & Time Simulation Integration Tests")
class SrsDeterministicSequenceIntegrationTests {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private CardProgressRepository cardProgressRepository;

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Autowired
    private UserSrsSettingRepository userSrsSettingRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private RadicalRepository radicalRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonVocabularyRepository lessonVocabularyRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TransactionTemplate txTemplate;

    private MutableClock mutableClock;
    private SrsServiceImpl srsService;

    private UserProfile testLearner;
    private Lesson approvedLesson;
    private Lesson draftLesson;
    private final List<Vocabulary> testVocabs = new ArrayList<>();
    private final List<Radical> testRadicals = new ArrayList<>();
    private String learnerEmail;

    /**
     * Controllable business clock enabling deterministic simulation across days/hours.
     */
    public static class MutableClock extends Clock {
        private final ZoneId zone;
        private Instant instant;

        public MutableClock(Instant initialInstant, ZoneId zone) {
            this.instant = initialInstant;
            this.zone = zone;
        }

        public void advanceDays(long days) {
            this.instant = this.instant.plus(days, ChronoUnit.DAYS);
        }

        public void advanceHours(long hours) {
            this.instant = this.instant.plus(hours, ChronoUnit.HOURS);
        }

        public void advanceMinutes(long minutes) {
            this.instant = this.instant.plus(minutes, ChronoUnit.MINUTES);
        }

        public void advanceSeconds(long seconds) {
            this.instant = this.instant.plus(seconds, ChronoUnit.SECONDS);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }

    @BeforeEach
    void setUp() {
        // Base time: 2026-09-01 08:00:00 Ho Chi Minh time
        Instant startInstant = Instant.parse("2026-09-01T01:00:00Z"); // 08:00:00 +07:00
        mutableClock = new MutableClock(startInstant, BUSINESS_ZONE);

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
                mutableClock
        );

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        learnerEmail = "det_learner_" + suffix + "@test.com";

        txTemplate.execute(status -> {
            Role learnerRole = roleRepository.findByRoleName("Learner").orElse(null);

            Account account = new Account();
            account.setEmailOrPhone(learnerEmail);
            account.setPasswordHash("hash123");
            account.setStatus("Active");
            if (learnerRole != null) {
                account.getRoles().add(learnerRole);
            }
            account = accountRepository.save(account);

            UserProfile profile = new UserProfile();
            profile.setAccount(account);
            profile.setFullName("Deterministic Learner " + suffix);
            testLearner = userProfileRepository.save(profile);

            // Generous quota for regression tests
            UserSrsSetting setting = new UserSrsSetting(testLearner, 50, 200);
            userSrsSettingRepository.save(setting);

            approvedLesson = new Lesson();
            approvedLesson.setTitle("Det Approved Lesson " + suffix);
            approvedLesson.setStatus("Approved");
            approvedLesson.setCreatedBy(account);
            approvedLesson = lessonRepository.save(approvedLesson);

            draftLesson = new Lesson();
            draftLesson.setTitle("Det Draft Lesson " + suffix);
            draftLesson.setStatus("Draft");
            draftLesson.setCreatedBy(account);
            draftLesson = lessonRepository.save(draftLesson);

            return null;
        });

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(learnerEmail, "N/A", List.of(new SimpleGrantedAuthority("ROLE_Learner")))
        );
    }

    private DueCardResponse reviewCard(ReviewCardRequest request) {
        return txTemplate.execute(status -> srsService.reviewCard(request));
    }

    private List<DueCardResponse> getDueCards(String itemType, Integer limit) {
        return txTemplate.execute(status -> srsService.getDueCards(itemType, limit));
    }

    private List<DueCardResponse> getNewCardCandidates(Long lessonId, Integer limit) {
        return txTemplate.execute(status -> srsService.getNewCardCandidates(lessonId, limit));
    }

    private StudyStatsResponse getStudyStats() {
        return txTemplate.execute(status -> srsService.getStudyStats());
    }

    private Vocabulary createApprovedVocabulary(String hanzi, String pinyin, String pinyinRaw, String meaningVi) {
        return txTemplate.execute(status -> {
            Vocabulary v = vocabularyRepository.save(new Vocabulary(hanzi, pinyin, pinyinRaw, "Hán Việt", meaningVi));
            testVocabs.add(v);
            lessonVocabularyRepository.save(new LessonVocabulary(approvedLesson, v, testVocabs.size()));
            return v;
        });
    }

    private Vocabulary createDraftVocabulary(String hanzi, String pinyin, String pinyinRaw, String meaningVi) {
        return txTemplate.execute(status -> {
            Vocabulary v = vocabularyRepository.save(new Vocabulary(hanzi, pinyin, pinyinRaw, "Hán Việt", meaningVi));
            testVocabs.add(v);
            lessonVocabularyRepository.save(new LessonVocabulary(draftLesson, v, testVocabs.size()));
            return v;
        });
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        txTemplate.execute(status -> {
            if (approvedLesson != null) {
                lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(approvedLesson.getLessonId()));
                lessonRepository.delete(approvedLesson);
            }
            if (draftLesson != null) {
                lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(draftLesson.getLessonId()));
                lessonRepository.delete(draftLesson);
            }
            if (testLearner != null) {
                reviewLogRepository.deleteAll(reviewLogRepository.findByUserOrderByReviewedAtDesc(testLearner));
                cardProgressRepository.deleteAll(cardProgressRepository.findByUserAndItemTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        testLearner, "VOCABULARY", LocalDateTime.now(mutableClock).plusYears(10)));
                cardProgressRepository.deleteAll(cardProgressRepository.findByUserAndItemTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        testLearner, "RADICAL", LocalDateTime.now(mutableClock).plusYears(10)));
                userSrsSettingRepository.findByUser(testLearner).ifPresent(userSrsSettingRepository::delete);
                userProfileRepository.delete(testLearner);
                accountRepository.delete(testLearner.getAccount());
            }

            for (Vocabulary v : testVocabs) {
                vocabularyRepository.findById(v.getVocabId()).ifPresent(vocabularyRepository::delete);
            }
            testVocabs.clear();

            for (Radical r : testRadicals) {
                radicalRepository.findById(r.getRadicalId()).ifPresent(radicalRepository::delete);
            }
            testRadicals.clear();
            return null;
        });
    }

    @Test
    @DisplayName("CASE A: New -> Good -> Good -> Good (Interval: 1 -> 6 -> 15, Reps: 1 -> 2 -> 3, EF: 2.50)")
    void testCaseA_NewGoodGoodGood() {
        Vocabulary v = createApprovedVocabulary("学A", "xué", "xue_a", "Học");

        // Review 1 on Day 0: Good (rating 3)
        DueCardResponse r1 = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 5));
        assertThat(r1.getIntervalDays()).isEqualTo(1);
        assertThat(r1.getRepetitions()).isEqualTo(1);
        assertThat(r1.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.50"));

        // Advance 1 day + 1 minute -> Day 1: card becomes due
        mutableClock.advanceDays(1);
        mutableClock.advanceMinutes(1);

        // Review 2 on Day 1: Good (rating 3)
        DueCardResponse r2 = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 4));
        assertThat(r2.getIntervalDays()).isEqualTo(6);
        assertThat(r2.getRepetitions()).isEqualTo(2);
        assertThat(r2.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.50"));

        // Advance 6 days + 1 minute -> Day 7: card becomes due
        mutableClock.advanceDays(6);
        mutableClock.advanceMinutes(1);

        // Review 3 on Day 7: Good (rating 3)
        DueCardResponse r3 = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));
        assertThat(r3.getIntervalDays()).isEqualTo(15);
        assertThat(r3.getRepetitions()).isEqualTo(3);
        assertThat(r3.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.50"));

        // Direct DB verification
        CardProgress cp = cardProgressRepository.findByUserAndItemTypeAndItemId(testLearner, "VOCABULARY", v.getVocabId()).orElseThrow();
        assertThat(cp.getIntervalDays()).isEqualTo(15);
        assertThat(cp.getRepetitions()).isEqualTo(3);
        assertThat(cp.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.50"));

        List<ReviewLog> logs = reviewLogRepository.findByUserAndItemTypeAndItemIdOrderByReviewedAtDesc(testLearner, "VOCABULARY", v.getVocabId());
        assertThat(logs).hasSize(3);
        assertThat(logs.get(0).getIntervalAfter()).isEqualTo(15);
        assertThat(logs.get(1).getIntervalAfter()).isEqualTo(6);
        assertThat(logs.get(2).getIntervalAfter()).isEqualTo(1);
    }

    @Test
    @DisplayName("CASE B: Good -> Good -> Good -> Hard (EF: 2.36, Interval: 36, Reps: 4)")
    void testCaseB_GoodGoodGoodHard() {
        Vocabulary v = createApprovedVocabulary("学B", "xué", "xue_b", "Học");

        // Review 1 (Day 0): Good -> I=1, R=1, EF=2.50
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Review 2 (Day 1): Good -> I=6, R=2, EF=2.50
        mutableClock.advanceDays(1);
        mutableClock.advanceMinutes(1);
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Review 3 (Day 7): Good -> I=15, R=3, EF=2.50
        mutableClock.advanceDays(6);
        mutableClock.advanceMinutes(1);
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Advance 15 days + 1 minute -> Day 22: card becomes due
        mutableClock.advanceDays(15);
        mutableClock.advanceMinutes(1);

        // Review 4 (Day 22): Hard (rating 2)
        // q=3 -> delta = -0.14 -> EF' = 2.36
        // I' = ceil(15 * 2.36) = ceil(35.40) = 36
        DueCardResponse r4 = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 2, 6));
        assertThat(r4.getIntervalDays()).isEqualTo(36);
        assertThat(r4.getRepetitions()).isEqualTo(4);
        assertThat(r4.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.36"));

        CardProgress cp = cardProgressRepository.findByUserAndItemTypeAndItemId(testLearner, "VOCABULARY", v.getVocabId()).orElseThrow();
        assertThat(cp.getIntervalDays()).isEqualTo(36);
        assertThat(cp.getRepetitions()).isEqualTo(4);
        assertThat(cp.getEaseFactor()).isEqualByComparingTo(new BigDecimal("2.36"));
    }

    @Test
    @DisplayName("CASE C: Good -> Good -> Again (Repetitions & Interval reset to 0, EF drops to 1.70, due immediately)")
    void testCaseC_GoodGoodAgain() {
        Vocabulary v = createApprovedVocabulary("学C", "xué", "xue_c", "Học");

        // Review 1 (Day 0): Good -> I=1, R=1, EF=2.50
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Review 2 (Day 1): Good -> I=6, R=2, EF=2.50
        mutableClock.advanceDays(1);
        mutableClock.advanceMinutes(1);
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Advance 6 days -> Day 7: card becomes due
        mutableClock.advanceDays(6);
        mutableClock.advanceMinutes(1);

        // Review 3 (Day 7): Again (rating 1)
        // q=0 -> delta = -0.80 -> EF' = 1.70
        // repetitions = 0, interval = 0 (due immediately today for relearning)
        DueCardResponse r3 = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 1, 8));
        assertThat(r3.getIntervalDays()).isEqualTo(0);
        assertThat(r3.getRepetitions()).isEqualTo(0);
        assertThat(r3.getEaseFactor()).isEqualByComparingTo(new BigDecimal("1.70"));

        // Verify card is immediately due today for relearning in /srs/due
        List<DueCardResponse> dueCards = getDueCards("VOCABULARY", 10);
        assertThat(dueCards).extracting(DueCardResponse::getItemId).contains(v.getVocabId());

        // Relearning review on the same day is accepted (not blocked as early)
        DueCardResponse relearnResponse = reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));
        assertThat(relearnResponse.getIntervalDays()).isEqualTo(1);
        assertThat(relearnResponse.getRepetitions()).isEqualTo(1);
    }

    @Test
    @DisplayName("CASE D: Early review before nextReviewAt is rejected with 409 CONFLICT; progress is unchanged")
    void testCaseD_EarlyReviewRejected() {
        Vocabulary v = createApprovedVocabulary("学D", "xué", "xue_d", "Học");

        // Review 1 (Day 0): Good -> nextReviewAt is Day 1
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Advance only 2 hours (card is not due yet)
        mutableClock.advanceHours(2);

        // Attempting to review now must fail with CONFLICT
        assertThatThrownBy(() -> reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3)))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
                    assertThat(be.getMessage()).contains("Thẻ chưa đến hạn ôn tập");
                });

        // Ensure DB state was NOT mutated
        CardProgress cp = cardProgressRepository.findByUserAndItemTypeAndItemId(testLearner, "VOCABULARY", v.getVocabId()).orElseThrow();
        assertThat(cp.getIntervalDays()).isEqualTo(1);
        assertThat(cp.getRepetitions()).isEqualTo(1);

        List<ReviewLog> logs = reviewLogRepository.findByUserAndItemTypeAndItemIdOrderByReviewedAtDesc(testLearner, "VOCABULARY", v.getVocabId());
        assertThat(logs).hasSize(1); // Still exactly 1 log from the initial review
    }

    @Test
    @DisplayName("CASE E: Advance clock to nextReviewAt: card appears in /srs/due strictly when clock >= nextReviewAt")
    void testCaseE_TimeSimulationDueQuery() {
        Vocabulary v = createApprovedVocabulary("学E", "xué", "xue_e", "Học");

        // Review on Day 0: Good -> nextReviewAt = Day 0 + 1 day (e.g. Day 1 08:00:00)
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        // Advance 23 hours -> Day 0 + 23h (before nextReviewAt)
        mutableClock.advanceHours(23);
        List<DueCardResponse> dueBefore = getDueCards("VOCABULARY", 10);
        assertThat(dueBefore).extracting(DueCardResponse::getItemId).doesNotContain(v.getVocabId());

        // Advance 1 hour and 1 second -> now past nextReviewAt
        mutableClock.advanceHours(1);
        mutableClock.advanceSeconds(1);

        List<DueCardResponse> dueAfter = getDueCards("VOCABULARY", 10);
        assertThat(dueAfter).extracting(DueCardResponse::getItemId).contains(v.getVocabId());
    }

    @Test
    @DisplayName("CASE F: SRS DUE strictly returns VOCABULARY and filters out RADICAL; stats count only VOCABULARY")
    void testCaseF_SrsDueVocabularyOnly() {
        Vocabulary v = createApprovedVocabulary("学F", "xué", "xue_f", "Học");
        Radical r = radicalRepository.findAll().stream().findFirst().orElseGet(() ->
                radicalRepository.save(new Radical(10, "木", "mù", "Mộc", "Cây cối")));

        // Simulate existing due progress for both VOCABULARY and legacy RADICAL
        LocalDateTime now = LocalDateTime.now(mutableClock);
        CardProgress cpVocab = new CardProgress(testLearner, "VOCABULARY", v.getVocabId(), new BigDecimal("2.50"), 1, 1, now.minusMinutes(10));
        CardProgress cpRadical = new CardProgress(testLearner, "RADICAL", r.getRadicalId().longValue(), new BigDecimal("2.50"), 1, 1, now.minusMinutes(10));

        txTemplate.execute(status -> {
            cardProgressRepository.save(cpVocab);
            cardProgressRepository.save(cpRadical);
            return null;
        });

        // 1. Calling getDueCards("VOCABULARY", 10) returns only the vocabulary card
        List<DueCardResponse> dueCards = getDueCards("VOCABULARY", 10);
        assertThat(dueCards).hasSize(1);
        assertThat(dueCards.get(0).getItemType()).isEqualTo("VOCABULARY");
        assertThat(dueCards.get(0).getItemId()).isEqualTo(v.getVocabId());

        // 2. getStudyStats().getCardsDue() strictly reflects VOCABULARY cards due (1, not 2)
        StudyStatsResponse stats = getStudyStats();
        assertThat(stats.getCardsDue()).isEqualTo(1L);
    }

    @Test
    @DisplayName("CASE G: New Card Eligibility strictly requires Approved Lesson; Draft lesson rejected")
    void testCaseG_NewCardEligibilityEnforced() {
        Vocabulary approvedVocab = createApprovedVocabulary("学G1", "xué", "xue_g1", "Học");
        Vocabulary draftVocab = createDraftVocabulary("学G2", "xué", "xue_g2", "Nháp");

        // 1. Candidate query for approved lesson returns approvedVocab with isNew=true
        List<DueCardResponse> candidates = getNewCardCandidates(approvedLesson.getLessonId(), 10);
        assertThat(candidates).extracting(DueCardResponse::getItemId).contains(approvedVocab.getVocabId());
        assertThat(candidates.stream().filter(c -> c.getItemId().equals(approvedVocab.getVocabId())).findFirst().get().getIsNew()).isTrue();

        // 2. Candidate query for draft lesson throws NOT_FOUND to hide unapproved lesson
        assertThatThrownBy(() -> getNewCardCandidates(draftLesson.getLessonId(), 10))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));

        // 3. First review on approvedVocab succeeds
        DueCardResponse approvedReview = reviewCard(new ReviewCardRequest("VOCABULARY", approvedVocab.getVocabId(), 3, 4));
        assertThat(approvedReview).isNotNull();

        // 4. First review on draftVocab is rejected with UNPROCESSABLE_ENTITY
        assertThatThrownBy(() -> reviewCard(new ReviewCardRequest("VOCABULARY", draftVocab.getVocabId(), 3, 4)))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.UNPROCESSABLE_ENTITY);
                    assertThat(be.getMessage()).contains("Từ vựng chưa thuộc bất kỳ bài học nào đã được phê duyệt");
                });

        // 5. Draft vocab has NO CardProgress created
        assertThat(cardProgressRepository.findByUserAndItemTypeAndItemId(testLearner, "VOCABULARY", draftVocab.getVocabId())).isEmpty();
    }

    @Test
    @DisplayName("Daily Quota: Distinguishes newCardsToday vs reviewsToday; re-reviews don't count as new cards")
    void testDailyQuota_NewCardVsReviewDistinction() {
        Vocabulary v1 = createApprovedVocabulary("字1", "zì", "zi_1", "Chữ 1");
        Vocabulary v2 = createApprovedVocabulary("字2", "zì", "zi_2", "Chữ 2");

        // Configure strict limits: 1 new card per day, 10 reviews per day
        txTemplate.execute(status -> {
            UserSrsSetting s = userSrsSettingRepository.findByUser(testLearner).orElseThrow();
            s.setNewCardsPerDay(1);
            s.setMaxReviewPerDay(10);
            userSrsSettingRepository.save(s);
            return null;
        });

        // Review v1 as new card on Day 0
        reviewCard(new ReviewCardRequest("VOCABULARY", v1.getVocabId(), 3, 3));

        StudyStatsResponse stats1 = getStudyStats();
        assertThat(stats1.getNewCardsToday()).isEqualTo(1L);
        assertThat(stats1.getReviewsToday()).isEqualTo(1L);

        // Attempt to review v2 as another new card on Day 0 -> rejected by new-card limit (1/1)
        assertThatThrownBy(() -> reviewCard(new ReviewCardRequest("VOCABULARY", v2.getVocabId(), 3, 3)))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.CONFLICT);
                    assertThat(be.getMessage()).contains("Bạn đã đạt giới hạn học từ mới tối đa trong ngày");
                });

        // Advance to Day 1: v1 is due for repetition review
        mutableClock.advanceDays(1);
        mutableClock.advanceMinutes(1);

        StudyStatsResponse statsDay1Before = getStudyStats();
        assertThat(statsDay1Before.getNewCardsToday()).isEqualTo(0L); // Reset on new day
        assertThat(statsDay1Before.getReviewsToday()).isEqualTo(0L);  // Reset on new day

        // Re-review v1 on Day 1
        reviewCard(new ReviewCardRequest("VOCABULARY", v1.getVocabId(), 3, 3));

        StudyStatsResponse statsDay1After = getStudyStats();
        assertThat(statsDay1After.getReviewsToday()).isEqualTo(1L);
        // CRUCIAL: v1 was already introduced on Day 0, so reviewing it today does NOT count as a new card today!
        assertThat(statsDay1After.getNewCardsToday()).isEqualTo(0L);

        // And since newCardsToday is still 0 on Day 1, v2 CAN now be introduced as a new card!
        DueCardResponse v2Review = reviewCard(new ReviewCardRequest("VOCABULARY", v2.getVocabId(), 3, 3));
        assertThat(v2Review).isNotNull();

        StudyStatsResponse statsDay1Final = getStudyStats();
        assertThat(statsDay1Final.getNewCardsToday()).isEqualTo(1L);
        assertThat(statsDay1Final.getReviewsToday()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Idempotency: Multiple reviews update the same CardProgress record, never create duplicates")
    void testIdempotency_SingleCardProgressRecord() {
        Vocabulary v = createApprovedVocabulary("恒", "héng", "heng", "Hằng");

        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        mutableClock.advanceDays(1);
        mutableClock.advanceMinutes(1);
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        mutableClock.advanceDays(6);
        mutableClock.advanceMinutes(1);
        reviewCard(new ReviewCardRequest("VOCABULARY", v.getVocabId(), 3, 3));

        List<CardProgress> allProgress = cardProgressRepository.findAll().stream()
                .filter(p -> p.getUser().getUserId().equals(testLearner.getUserId()) && p.getItemId().equals(v.getVocabId()))
                .toList();

        assertThat(allProgress).hasSize(1);
        assertThat(allProgress.get(0).getRepetitions()).isEqualTo(3);
    }
}
