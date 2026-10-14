package com.elearning;

import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.entity.CardProgress;
import com.elearning.entity.ReviewLog;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
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
import com.elearning.service.srs.SrsCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit: Multi-Skill SRS Service Logic (Listening & Writing Separation)")
public class SrsMultiSkillServiceTests {

    @Mock
    private CardProgressRepository cardProgressRepository;

    @Mock
    private ReviewLogRepository reviewLogRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserSrsSettingRepository userSrsSettingRepository;

    @Mock
    private VocabularyRepository vocabularyRepository;

    @Mock
    private RadicalRepository radicalRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private LessonVocabularyRepository lessonVocabularyRepository;

    @Spy
    private SrsCalculator srsCalculator = new SrsCalculator();

    @Spy
    private Clock businessClock = Clock.fixed(Instant.parse("2026-10-12T12:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    @InjectMocks
    private SrsServiceImpl srsService;

    private UserProfile testUserProfile;

    @BeforeEach
    void setUp() {
        testUserProfile = new UserProfile();
        testUserProfile.setUserId(42L);
        testUserProfile.setFullName("Learner Nguyen");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("learner@test.com");
        SecurityContext securityContext = org.mockito.Mockito.mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        org.mockito.Mockito.lenient().when(userProfileRepository.findByAccountEmailOrPhoneWithLock("learner@test.com"))
                .thenReturn(Optional.of(testUserProfile));
        org.mockito.Mockito.lenient().when(userProfileRepository.findByAccountEmailOrPhone("learner@test.com"))
                .thenReturn(Optional.of(testUserProfile));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Reviewing WRITING skill card creates CardProgress with card_type='WRITING' and independent interval")
    void testReviewCard_writingSkill_createsIndependentProgress() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 101L, "WRITING", 3, 7);

        Vocabulary vocab = new Vocabulary("学", "xué", "xue", "Học", "Học tập");
        vocab.setVocabId(101L);
        when(vocabularyRepository.findByIdWithLock(101L)).thenReturn(Optional.of(vocab));

        when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(101L)).thenReturn(true);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.empty());
        when(reviewLogRepository.findTodayReviewLogsWithLock(eq(testUserProfile), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        // No writing card exists yet
        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 101L, "WRITING"))
                .thenReturn(Optional.empty());

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemType()).isEqualTo("VOCABULARY");
        assertThat(response.getItemId()).isEqualTo(101L);
        assertThat(response.getIntervalDays()).isEqualTo(1);
        assertThat(response.getRepetitions()).isEqualTo(1);

        // Verify CardProgress saved with WRITING
        ArgumentCaptor<CardProgress> cpCaptor = ArgumentCaptor.forClass(CardProgress.class);
        verify(cardProgressRepository).save(cpCaptor.capture());
        CardProgress savedCp = cpCaptor.getValue();
        assertThat(savedCp.getCardType()).isEqualTo("WRITING");
        assertThat(savedCp.getItemId()).isEqualTo(101L);

        // Verify ReviewLog saved with WRITING
        ArgumentCaptor<ReviewLog> logCaptor = ArgumentCaptor.forClass(ReviewLog.class);
        verify(reviewLogRepository).save(logCaptor.capture());
        ReviewLog savedLog = logCaptor.getValue();
        assertThat(savedLog.getCardType()).isEqualTo("WRITING");
        assertThat(savedLog.getRating()).isEqualTo((byte) 3);
    }

    @Test
    @DisplayName("Reviewing LISTENING skill card creates CardProgress with card_type='LISTENING'")
    void testReviewCard_listeningSkill_createsIndependentProgress() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 102L, "LISTENING", 4, 3);

        Vocabulary vocab = new Vocabulary("生", "shēng", "sheng", "Sinh", "Sinh sống");
        vocab.setVocabId(102L);
        when(vocabularyRepository.findByIdWithLock(102L)).thenReturn(Optional.of(vocab));

        when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(102L)).thenReturn(true);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.empty());
        when(reviewLogRepository.findTodayReviewLogsWithLock(eq(testUserProfile), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 102L, "LISTENING"))
                .thenReturn(Optional.empty());

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemId()).isEqualTo(102L);
        assertThat(response.getIntervalDays()).isEqualTo(1);

        ArgumentCaptor<CardProgress> cpCaptor = ArgumentCaptor.forClass(CardProgress.class);
        verify(cardProgressRepository).save(cpCaptor.capture());
        assertThat(cpCaptor.getValue().getCardType()).isEqualTo("LISTENING");
    }

    @Test
    @DisplayName("getDueCards with cardType='WRITING' queries repository with skill filter")
    void testGetDueCards_withCardTypeFilter() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@test.com"))
                .thenReturn(Optional.of(testUserProfile));

        CardProgress writingCp = new CardProgress(testUserProfile, "VOCABULARY", 101L, "WRITING", new BigDecimal("2.50"), 1, 1, LocalDateTime.now().minusDays(1));
        when(cardProgressRepository.findByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                eq(testUserProfile), eq("VOCABULARY"), eq("WRITING"), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(writingCp));

        Vocabulary vocab = new Vocabulary("学", "xué", "xue", "Học", "Học tập");
        vocab.setVocabId(101L);
        when(vocabularyRepository.findAllById(any())).thenReturn(List.of(vocab));

        List<DueCardResponse> result = srsService.getDueCards("VOCABULARY", "WRITING", 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemId()).isEqualTo(101L);
        assertThat(result.get(0).getCardType()).isEqualTo("WRITING");
    }

    @Test
    @DisplayName("Reviewing READING skill card creates CardProgress with card_type='READING'")
    void testReviewCard_readingSkill_createsIndependentProgress() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 103L, "READING", 3, 5);

        Vocabulary vocab = new Vocabulary("书", "shū", "shu", "Thư", "Sách");
        vocab.setVocabId(103L);
        when(vocabularyRepository.findByIdWithLock(103L)).thenReturn(Optional.of(vocab));

        when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(103L)).thenReturn(true);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.empty());
        when(reviewLogRepository.findTodayReviewLogsWithLock(eq(testUserProfile), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 103L, "READING"))
                .thenReturn(Optional.empty());

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemId()).isEqualTo(103L);
        assertThat(response.getIntervalDays()).isEqualTo(1);

        ArgumentCaptor<CardProgress> cpCaptor = ArgumentCaptor.forClass(CardProgress.class);
        verify(cardProgressRepository).save(cpCaptor.capture());
        assertThat(cpCaptor.getValue().getCardType()).isEqualTo("READING");

        ArgumentCaptor<ReviewLog> logCaptor = ArgumentCaptor.forClass(ReviewLog.class);
        verify(reviewLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getCardType()).isEqualTo("READING");
    }

    @Test
    @DisplayName("getDueCards with cardType='READING' queries repository with skill filter")
    void testGetDueCards_withCardTypeReadingFilter() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@test.com"))
                .thenReturn(Optional.of(testUserProfile));

        CardProgress readingCp = new CardProgress(testUserProfile, "VOCABULARY", 103L, "READING", new BigDecimal("2.50"), 2, 6, LocalDateTime.now().minusDays(1));
        when(cardProgressRepository.findByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                eq(testUserProfile), eq("VOCABULARY"), eq("READING"), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(readingCp));

        Vocabulary vocab = new Vocabulary("书", "shū", "shu", "Thư", "Sách");
        vocab.setVocabId(103L);
        when(vocabularyRepository.findAllById(any())).thenReturn(List.of(vocab));

        List<DueCardResponse> result = srsService.getDueCards("VOCABULARY", "READING", 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemId()).isEqualTo(103L);
        assertThat(result.get(0).getCardType()).isEqualTo("READING");
    }

    @Test
    @DisplayName("getStudyStats includes cardsDueReading alongside listening and writing counts")
    void testGetStudyStats_includesCardsDueReading() {
        when(userProfileRepository.findByAccountEmailOrPhone("learner@test.com"))
                .thenReturn(Optional.of(testUserProfile));

        UserSrsSetting setting = new UserSrsSetting(testUserProfile, 20, 100);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.of(setting));

        when(cardProgressRepository.countByUserAndItemTypeAndNextReviewAtLessThanEqual(eq(testUserProfile), eq("VOCABULARY"), any(LocalDateTime.class)))
                .thenReturn(15L);
        when(cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(eq(testUserProfile), eq("VOCABULARY"), eq("LISTENING"), any(LocalDateTime.class)))
                .thenReturn(5L);
        when(cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(eq(testUserProfile), eq("VOCABULARY"), eq("WRITING"), any(LocalDateTime.class)))
                .thenReturn(4L);
        when(cardProgressRepository.countByUserAndItemTypeAndCardTypeAndNextReviewAtLessThanEqual(eq(testUserProfile), eq("VOCABULARY"), eq("READING"), any(LocalDateTime.class)))
                .thenReturn(6L);

        when(reviewLogRepository.countByUserAndReviewedAtGreaterThanEqual(eq(testUserProfile), any(LocalDateTime.class)))
                .thenReturn(10L);
        when(reviewLogRepository.countNewItemsIntroducedToday(eq(testUserProfile), eq("VOCABULARY"), any(LocalDateTime.class)))
                .thenReturn(2L);

        StudyStatsResponse stats = srsService.getStudyStats();

        assertThat(stats.getCardsDue()).isEqualTo(15L);
        assertThat(stats.getCardsDueListening()).isEqualTo(5L);
        assertThat(stats.getCardsDueWriting()).isEqualTo(4L);
        assertThat(stats.getCardsDueReading()).isEqualTo(6L);
        assertThat(stats.getReviewsToday()).isEqualTo(10L);
        assertThat(stats.getNewCardsLimit()).isEqualTo(20);
        assertThat(stats.getMaxReviewLimit()).isEqualTo(100);
        assertThat(stats.getNewCardsToday()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Reviewing card without cardType defaults to READING for new card")
    void testReviewCard_omittedCardType_defaultsToReadingSkill() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 104L, 3, 4);

        Vocabulary vocab = new Vocabulary("水", "shuǐ", "shui", "Thủy", "Nước");
        vocab.setVocabId(104L);
        when(vocabularyRepository.findByIdWithLock(104L)).thenReturn(Optional.of(vocab));
        when(lessonVocabularyRepository.existsApprovedLessonForVocabulary(104L)).thenReturn(true);
        when(userSrsSettingRepository.findByUser(testUserProfile)).thenReturn(Optional.empty());
        when(reviewLogRepository.findTodayReviewLogsWithLock(eq(testUserProfile), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 104L, "READING"))
                .thenReturn(Optional.empty());
        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 104L, "LISTENING"))
                .thenReturn(Optional.empty());
        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 104L, "WRITING"))
                .thenReturn(Optional.empty());
        when(cardProgressRepository.findByUserAndItemTypeAndItemId(testUserProfile, "VOCABULARY", 104L))
                .thenReturn(Optional.empty());

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemId()).isEqualTo(104L);
        assertThat(response.getCardType()).isEqualTo("READING");

        ArgumentCaptor<CardProgress> cpCaptor = ArgumentCaptor.forClass(CardProgress.class);
        verify(cardProgressRepository).save(cpCaptor.capture());
        assertThat(cpCaptor.getValue().getCardType()).isEqualTo("READING");

        ArgumentCaptor<ReviewLog> logCaptor = ArgumentCaptor.forClass(ReviewLog.class);
        verify(reviewLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getCardType()).isEqualTo("READING");
    }

    @Test
    @DisplayName("Reviewing card without cardType safely queries READING card first, avoiding NonUniqueResultException")
    void testReviewCard_omittedCardType_safelyQueriesReadingCardFirst() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 105L, 3, 5);

        Vocabulary vocab = new Vocabulary("门", "mén", "men", "Môn", "Cửa");
        vocab.setVocabId(105L);
        when(vocabularyRepository.findByIdWithLock(105L)).thenReturn(Optional.of(vocab));

        CardProgress existingReading = new CardProgress(testUserProfile, "VOCABULARY", 105L, "READING", new BigDecimal("2.50"), 1, 1, LocalDateTime.now(businessClock).minusHours(1));
        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 105L, "READING"))
                .thenReturn(Optional.of(existingReading));

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemId()).isEqualTo(105L);
        assertThat(response.getCardType()).isEqualTo("READING");

        verify(cardProgressRepository).findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 105L, "READING");
        verify(cardProgressRepository, never()).findByUserAndItemTypeAndItemId(any(), any(), any());
    }

    @Test
    @DisplayName("Reviewing card without cardType falls back to LISTENING if READING not found")
    void testReviewCard_omittedCardType_fallsBackToListeningIfReadingNotFound() {
        ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 106L, 3, 5);

        Vocabulary vocab = new Vocabulary("车", "chē", "che", "Xa", "Xe");
        vocab.setVocabId(106L);
        when(vocabularyRepository.findByIdWithLock(106L)).thenReturn(Optional.of(vocab));

        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 106L, "READING"))
                .thenReturn(Optional.empty());

        CardProgress existingListening = new CardProgress(testUserProfile, "VOCABULARY", 106L, "LISTENING", new BigDecimal("2.50"), 1, 1, LocalDateTime.now(businessClock).minusHours(1));
        when(cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(testUserProfile, "VOCABULARY", 106L, "LISTENING"))
                .thenReturn(Optional.of(existingListening));

        when(cardProgressRepository.save(any(CardProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        DueCardResponse response = srsService.reviewCard(request);

        assertThat(response.getItemId()).isEqualTo(106L);
        assertThat(response.getCardType()).isEqualTo("LISTENING");

        ArgumentCaptor<ReviewLog> logCaptor = ArgumentCaptor.forClass(ReviewLog.class);
        verify(reviewLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getCardType()).isEqualTo("LISTENING");

        verify(cardProgressRepository, never()).findByUserAndItemTypeAndItemId(any(), any(), any());
    }
}
