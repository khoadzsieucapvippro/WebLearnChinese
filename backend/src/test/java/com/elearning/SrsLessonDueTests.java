package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.entity.Account;
import com.elearning.entity.CardProgress;
import com.elearning.entity.Lesson;
import com.elearning.entity.UserProfile;
import com.elearning.entity.UserSrsSetting;
import com.elearning.entity.Vocabulary;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit: SRS Due Cards by Lesson & READING CardType Regression Tests")
public class SrsLessonDueTests {

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
    private Clock businessClock = Clock.fixed(Instant.parse("2026-10-13T10:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    private SrsServiceImpl srsService;

    private UserProfile testLearner;
    private Account learnerAccount;
    private Lesson approvedLesson;
    private Lesson draftLesson;
    private Account creatorAccount;

    @BeforeEach
    void setUp() {
        srsService = new SrsServiceImpl(
                cardProgressRepository,
                reviewLogRepository,
                userSrsSettingRepository,
                vocabularyRepository,
                radicalRepository,
                userProfileRepository,
                lessonRepository,
                lessonVocabularyRepository,
                srsCalculator,
                businessClock
        );

        learnerAccount = new Account();
        learnerAccount.setAccountId(10L);
        learnerAccount.setEmailOrPhone("learner@domain.com");

        testLearner = new UserProfile();
        testLearner.setUserId(100L);
        testLearner.setAccount(learnerAccount);
        testLearner.setFullName("Learner One");

        creatorAccount = new Account();
        creatorAccount.setAccountId(20L);
        creatorAccount.setEmailOrPhone("creator@domain.com");

        approvedLesson = new Lesson("Bài 1: Chào hỏi", creatorAccount);
        approvedLesson.setLessonId(1L);
        approvedLesson.setStatus("Approved");

        draftLesson = new Lesson("Bài 2: Gia đình", creatorAccount);
        draftLesson.setLessonId(2L);
        draftLesson.setStatus("Draft");

        setupAuth("learner@domain.com", "ROLE_LEARNER");

        org.mockito.Mockito.lenient().when(userProfileRepository.findByAccountEmailOrPhone("learner@domain.com"))
                .thenReturn(Optional.of(testLearner));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setupAuth(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        email, null, List.of(new SimpleGrantedAuthority(role)))
        );
    }

    @Test
    @DisplayName("GIVEN approved lessonId WHEN getDueCards without cardType THEN queries findDueCardsByLesson")
    void testGetDueCards_withLessonId_returnsDueCards() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(approvedLesson));

        CardProgress cp1 = new CardProgress(testLearner, "VOCABULARY", 501L, "READING",
                new BigDecimal("2.50"), 1, 1, LocalDateTime.now(businessClock).minusHours(1));
        when(cardProgressRepository.findDueCardsByLesson(eq(testLearner), eq(1L), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(cp1));

        Vocabulary vocab = new Vocabulary("你好", "nǐhǎo", "nihao", "Nghê Hảo", "Xin chào");
        vocab.setVocabId(501L);
        when(vocabularyRepository.findAllById(any())).thenReturn(List.of(vocab));

        List<DueCardResponse> result = srsService.getDueCards(null, null, 1L, 10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemId()).isEqualTo(501L);
        assertThat(result.get(0).getHanzi()).isEqualTo("你好");
        assertThat(result.get(0).getCardType()).isEqualTo("READING");

        verify(cardProgressRepository).findDueCardsByLesson(eq(testLearner), eq(1L), any(LocalDateTime.class), any(Pageable.class));
    }

    @Test
    @DisplayName("GIVEN approved lessonId and cardType=READING WHEN getDueCards THEN queries findDueCardsByLessonAndCardType with READING")
    void testGetDueCards_withLessonId_andCardTypeReading() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(approvedLesson));

        CardProgress readingCp = new CardProgress(testLearner, "VOCABULARY", 502L, "READING",
                new BigDecimal("2.60"), 2, 6, LocalDateTime.now(businessClock).minusDays(1));
        when(cardProgressRepository.findDueCardsByLessonAndCardType(eq(testLearner), eq(1L), eq("READING"), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(readingCp));

        Vocabulary vocab = new Vocabulary("谢谢", "xièxie", "xiexie", "Tạ tạ", "Cảm ơn");
        vocab.setVocabId(502L);
        when(vocabularyRepository.findAllById(any())).thenReturn(List.of(vocab));

        List<DueCardResponse> result = srsService.getDueCards("VOCABULARY", "READING", 1L, 20);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemId()).isEqualTo(502L);
        assertThat(result.get(0).getCardType()).isEqualTo("READING");

        verify(cardProgressRepository).findDueCardsByLessonAndCardType(eq(testLearner), eq(1L), eq("READING"), any(LocalDateTime.class), any(Pageable.class));
    }

    @Test
    @DisplayName("GIVEN lessonId and itemType=RADICAL WHEN getDueCards THEN returns empty list because lessons contain only VOCABULARY")
    void testGetDueCards_withLessonId_andRadicalItemType_returnsEmpty() {
        List<DueCardResponse> result = srsService.getDueCards("RADICAL", null, 1L, 10);

        assertThat(result).isEmpty();
        verify(lessonRepository, never()).findById(any());
        verify(cardProgressRepository, never()).findDueCardsByLesson(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GIVEN nonexistent lessonId WHEN getDueCards THEN throws NOT_FOUND 404")
    void testGetDueCards_nonexistentLesson_throwsNotFound() {
        when(lessonRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> srsService.getDueCards(null, null, 999L, 10))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));

        verify(cardProgressRepository, never()).findDueCardsByLesson(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GIVEN draft lesson and caller is regular learner WHEN getDueCards THEN throws NOT_FOUND 404")
    void testGetDueCards_draftLesson_asLearner_throwsNotFound() {
        when(lessonRepository.findById(2L)).thenReturn(Optional.of(draftLesson));

        assertThatThrownBy(() -> srsService.getDueCards(null, null, 2L, 10))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));

        verify(cardProgressRepository, never()).findDueCardsByLesson(any(), any(), any(), any());
    }

    @Test
    @DisplayName("GIVEN draft lesson and caller is lesson creator WHEN getDueCards THEN access is permitted")
    void testGetDueCards_draftLesson_asCreator_permitted() {
        // Authenticate as creator
        UserProfile creatorProfile = new UserProfile();
        creatorProfile.setUserId(200L);
        creatorProfile.setAccount(creatorAccount);
        creatorProfile.setFullName("Creator Account");

        setupAuth("creator@domain.com", "ROLE_CREATOR");
        when(userProfileRepository.findByAccountEmailOrPhone("creator@domain.com"))
                .thenReturn(Optional.of(creatorProfile));
        when(lessonRepository.findById(2L)).thenReturn(Optional.of(draftLesson));

        when(cardProgressRepository.findDueCardsByLesson(eq(creatorProfile), eq(2L), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        List<DueCardResponse> result = srsService.getDueCards(null, null, 2L, 10);

        assertThat(result).isEmpty();
        verify(cardProgressRepository).findDueCardsByLesson(eq(creatorProfile), eq(2L), any(LocalDateTime.class), any(Pageable.class));
    }

    @Test
    @DisplayName("GIVEN draft lesson and caller is Admin WHEN getDueCards THEN access is permitted")
    void testGetDueCards_draftLesson_asAdmin_permitted() {
        setupAuth("admin@domain.com", "ROLE_ADMIN");
        UserProfile adminProfile = new UserProfile();
        adminProfile.setUserId(1L);
        Account adminAcc = new Account();
        adminAcc.setAccountId(1L);
        adminProfile.setAccount(adminAcc);

        when(userProfileRepository.findByAccountEmailOrPhone("admin@domain.com"))
                .thenReturn(Optional.of(adminProfile));
        when(lessonRepository.findById(2L)).thenReturn(Optional.of(draftLesson));

        when(cardProgressRepository.findDueCardsByLesson(eq(adminProfile), eq(2L), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        List<DueCardResponse> result = srsService.getDueCards(null, null, 2L, 10);

        assertThat(result).isEmpty();
        verify(cardProgressRepository).findDueCardsByLesson(eq(adminProfile), eq(2L), any(LocalDateTime.class), any(Pageable.class));
    }

    @Test
    @DisplayName("GIVEN approved lesson WHEN getLessonSrsStats THEN returns aggregated counts including reading")
    void testGetLessonSrsStats_success() {
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(approvedLesson));
        when(lessonVocabularyRepository.countByLesson_LessonId(1L)).thenReturn(20L);
        when(lessonVocabularyRepository.countNewCardCandidates(1L, testLearner)).thenReturn(8L);
        when(cardProgressRepository.countDueCardsByLesson(eq(testLearner), eq(1L), any(LocalDateTime.class))).thenReturn(6L);
        when(cardProgressRepository.countDueCardsByLessonAndCardType(eq(testLearner), eq(1L), eq("LISTENING"), any(LocalDateTime.class))).thenReturn(2L);
        when(cardProgressRepository.countDueCardsByLessonAndCardType(eq(testLearner), eq(1L), eq("WRITING"), any(LocalDateTime.class))).thenReturn(1L);
        when(cardProgressRepository.countDueCardsByLessonAndCardType(eq(testLearner), eq(1L), eq("READING"), any(LocalDateTime.class))).thenReturn(3L);

        LessonSrsStatsResponse stats = srsService.getLessonSrsStats(1L);

        assertThat(stats.getLessonId()).isEqualTo(1L);
        assertThat(stats.getTotalVocabularies()).isEqualTo(20);
        assertThat(stats.getNewWordsCount()).isEqualTo(8L);
        assertThat(stats.getDueCardsCount()).isEqualTo(6L);
        assertThat(stats.getDueCardsListening()).isEqualTo(2L);
        assertThat(stats.getDueCardsWriting()).isEqualTo(1L);
        assertThat(stats.getDueCardsReading()).isEqualTo(3L);
    }

    @Test
    @DisplayName("GIVEN draft lesson and learner WHEN getLessonSrsStats THEN throws NOT_FOUND 404")
    void testGetLessonSrsStats_draftLesson_asLearner_throwsNotFound() {
        when(lessonRepository.findById(2L)).thenReturn(Optional.of(draftLesson));

        assertThatThrownBy(() -> srsService.getLessonSrsStats(2L))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }
}
