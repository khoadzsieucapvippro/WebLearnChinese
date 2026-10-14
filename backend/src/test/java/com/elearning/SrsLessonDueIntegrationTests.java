package com.elearning;

import com.elearning.config.TimeConfig;
import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.entity.Account;
import com.elearning.entity.CardProgress;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.Role;
import com.elearning.entity.UserProfile;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.CardProgressRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.SrsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisplayName("Integration: SRS Due Cards by Lesson & READING Skill Compatibility")
class SrsLessonDueIntegrationTests {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of(TimeConfig.DEFAULT_BUSINESS_TIMEZONE);

    @Autowired
    private SrsService srsService;

    @Autowired
    private CardProgressRepository cardProgressRepository;

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonVocabularyRepository lessonVocabularyRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private TransactionTemplate txTemplate;

    private UserProfile testLearner;
    private Account learnerAccount;
    private Lesson lesson1;
    private Lesson lesson2;
    private Vocabulary vocabA;
    private Vocabulary vocabB;

    @BeforeEach
    void setUp() {
        txTemplate = new TransactionTemplate(transactionManager);

        List<Lesson> leftover = lessonRepository.findAll().stream()
                .filter(l -> l.getTitle() != null && (l.getTitle().startsWith("Lesson 1 ") || l.getTitle().startsWith("Lesson 2 ")))
                .toList();
        for (Lesson l : leftover) {
            lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(l.getLessonId()));
            lessonRepository.delete(l);
        }

        Role learnerRole = roleRepository.findByRoleName("Learner").orElse(null);
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        learnerAccount = new Account();
        learnerAccount.setEmailOrPhone("srs_due_learner_" + suffix + "@test.com");
        learnerAccount.setPasswordHash("hash123");
        learnerAccount.setStatus("Active");
        if (learnerRole != null) {
            learnerAccount.getRoles().add(learnerRole);
        }
        learnerAccount = accountRepository.save(learnerAccount);

        testLearner = new UserProfile();
        testLearner.setAccount(learnerAccount);
        testLearner.setFullName("SRS Learner " + suffix);
        testLearner = userProfileRepository.save(testLearner);

        // Lesson 1 (Approved)
        lesson1 = new Lesson("Lesson 1 " + suffix, learnerAccount);
        lesson1.setStatus("Approved");
        lesson1 = lessonRepository.save(lesson1);

        // Lesson 2 (Approved)
        lesson2 = new Lesson("Lesson 2 " + suffix, learnerAccount);
        lesson2.setStatus("Approved");
        lesson2 = lessonRepository.save(lesson2);

        // Vocabulary A
        vocabA = new Vocabulary("书" + suffix.substring(0, 2), "shū", "shu" + suffix.substring(0, 2), "Thư", "Sách");
        vocabA = vocabularyRepository.save(vocabA);

        // Vocabulary B
        vocabB = new Vocabulary("笔" + suffix.substring(0, 2), "bǐ", "bi" + suffix.substring(0, 2), "Bút", "Bút viết");
        vocabB = vocabularyRepository.save(vocabB);

        // Link vocabA to lesson1, vocabB to lesson2
        lessonVocabularyRepository.save(new LessonVocabulary(lesson1, vocabA, 1));
        lessonVocabularyRepository.save(new LessonVocabulary(lesson2, vocabB, 1));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(learnerAccount.getEmailOrPhone(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_LEARNER")))
        );
    }

    @AfterEach
    void tearDown() {
        if (lesson1 != null) {
            lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lesson1.getLessonId()));
        }
        if (lesson2 != null) {
            lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lesson2.getLessonId()));
        }

        if (testLearner != null) {
            reviewLogRepository.deleteAll(reviewLogRepository.findByUserOrderByReviewedAtDesc(testLearner));
            cardProgressRepository.deleteAll(cardProgressRepository.findByUserAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                    testLearner, LocalDateTime.now().plusYears(10)));
            userProfileRepository.delete(testLearner);
        }

        if (lesson1 != null) {
            lessonRepository.delete(lesson1);
        }
        if (lesson2 != null) {
            lessonRepository.delete(lesson2);
        }

        if (vocabA != null) {
            vocabularyRepository.delete(vocabA);
        }
        if (vocabB != null) {
            vocabularyRepository.delete(vocabB);
        }

        if (learnerAccount != null) {
            accountRepository.delete(learnerAccount);
        }

        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Reviewing READING card and querying due cards with lessonId returns only cards for that lesson")
    void testDueCards_filteredByLessonId_andCardTypeReading() {
        // Review vocabA as READING (rating 3) -> creates CardProgress for vocabA with card_type='READING'
        ReviewCardRequest reqA = new ReviewCardRequest("VOCABULARY", vocabA.getVocabId(), "READING", 3, 5);
        DueCardResponse resA = srsService.reviewCard(reqA);
        assertThat(resA.getItemId()).isEqualTo(vocabA.getVocabId());
        assertThat(resA.getCardType()).isEqualTo("READING");

        // Review vocabB as LISTENING (rating 3) -> creates CardProgress for vocabB with card_type='LISTENING'
        ReviewCardRequest reqB = new ReviewCardRequest("VOCABULARY", vocabB.getVocabId(), "LISTENING", 3, 4);
        DueCardResponse resB = srsService.reviewCard(reqB);
        assertThat(resB.getItemId()).isEqualTo(vocabB.getVocabId());
        assertThat(resB.getCardType()).isEqualTo("LISTENING");

        // Force both cards to be due in the past
        txTemplate.executeWithoutResult(status -> {
            CardProgress cpA = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                    testLearner, "VOCABULARY", vocabA.getVocabId(), "READING").orElseThrow();
            cpA.setNextReviewAt(LocalDateTime.now().minusDays(1));
            cardProgressRepository.save(cpA);

            CardProgress cpB = cardProgressRepository.findByUserAndItemTypeAndItemIdAndCardType(
                    testLearner, "VOCABULARY", vocabB.getVocabId(), "LISTENING").orElseThrow();
            cpB.setNextReviewAt(LocalDateTime.now().minusDays(1));
            cardProgressRepository.save(cpB);
        });

        // 1. Query due cards for lesson1 without cardType filter -> returns vocabA only
        List<DueCardResponse> dueLesson1 = srsService.getDueCards(null, null, lesson1.getLessonId(), 10);
        assertThat(dueLesson1).hasSize(1);
        assertThat(dueLesson1.get(0).getItemId()).isEqualTo(vocabA.getVocabId());
        assertThat(dueLesson1.get(0).getCardType()).isEqualTo("READING");

        // 2. Query due cards for lesson1 with cardType='READING' -> returns vocabA
        List<DueCardResponse> dueLesson1Reading = srsService.getDueCards(null, "READING", lesson1.getLessonId(), 10);
        assertThat(dueLesson1Reading).hasSize(1);
        assertThat(dueLesson1Reading.get(0).getItemId()).isEqualTo(vocabA.getVocabId());

        // 3. Query due cards for lesson1 with cardType='LISTENING' -> returns empty list (vocabA is READING, vocabB is in lesson2)
        List<DueCardResponse> dueLesson1Listening = srsService.getDueCards(null, "LISTENING", lesson1.getLessonId(), 10);
        assertThat(dueLesson1Listening).isEmpty();

        // 4. Query due cards for lesson2 with cardType='LISTENING' -> returns vocabB
        List<DueCardResponse> dueLesson2Listening = srsService.getDueCards(null, "LISTENING", lesson2.getLessonId(), 10);
        assertThat(dueLesson2Listening).hasSize(1);
        assertThat(dueLesson2Listening.get(0).getItemId()).isEqualTo(vocabB.getVocabId());
        assertThat(dueLesson2Listening.get(0).getCardType()).isEqualTo("LISTENING");

        // 5. Query lesson stats for lesson1
        LessonSrsStatsResponse stats1 = srsService.getLessonSrsStats(lesson1.getLessonId());
        assertThat(stats1.getLessonId()).isEqualTo(lesson1.getLessonId());
        assertThat(stats1.getTotalVocabularies()).isEqualTo(1);
        assertThat(stats1.getDueCardsCount()).isEqualTo(1L);
        assertThat(stats1.getDueCardsReading()).isEqualTo(1L);
        assertThat(stats1.getDueCardsListening()).isEqualTo(0L);

        // 6. Query global study stats -> reflects both cards
        StudyStatsResponse globalStats = srsService.getStudyStats();
        assertThat(globalStats.getCardsDue()).isGreaterThanOrEqualTo(2L);
        assertThat(globalStats.getCardsDueReading()).isGreaterThanOrEqualTo(1L);
        assertThat(globalStats.getCardsDueListening()).isGreaterThanOrEqualTo(1L);
    }
}
