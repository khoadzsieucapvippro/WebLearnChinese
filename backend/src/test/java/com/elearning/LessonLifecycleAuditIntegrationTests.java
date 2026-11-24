package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.entity.Account;
import com.elearning.entity.CardProgress;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.PersonalNote;
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
import com.elearning.repository.ModerationLogRepository;
import com.elearning.repository.PersonalNoteRepository;
import com.elearning.repository.ReviewLogRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.UserSrsSettingRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.security.JwtUtil;
import com.elearning.service.LessonService;
import com.elearning.service.SrsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authoritative Verification Suite for Lesson Lifecycle & SRS Preservation (Single-Admin model).
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Task R3.2: Admin Lesson Lifecycle & Learning History Integrity Integration Tests")
class LessonLifecycleAuditIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private SrsService srsService;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonVocabularyRepository lessonVocabularyRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private ModerationLogRepository moderationLogRepository;

    @Autowired
    private CardProgressRepository cardProgressRepository;

    @Autowired
    private ReviewLogRepository reviewLogRepository;

    @Autowired
    private PersonalNoteRepository personalNoteRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserSrsSettingRepository userSrsSettingRepository;

    @Autowired
    private TransactionTemplate txTemplate;

    private Account admin;
    private Account learner;
    private UserProfile learnerProfile;
    private String adminToken;

    private Vocabulary vocab1;
    private Vocabulary vocab2;
    private Vocabulary vocab3;

    @BeforeEach
    void setUp() {
        txTemplate.executeWithoutResult(status -> {
            Role adminRole = roleRepository.findByRoleName("Admin").orElse(null);
            Role learnerRole = roleRepository.findByRoleName("Learner").orElse(null);

            String suffix = UUID.randomUUID().toString().substring(0, 6);
            admin = createAccountWithProfile("admin_" + suffix + "@test.com", "Admin User " + suffix, adminRole);
            learner = createAccountWithProfile("learner_" + suffix + "@test.com", "Learner User " + suffix, learnerRole);
            learnerProfile = userProfileRepository.findByAccount(learner).orElseThrow();

            vocab1 = vocabularyRepository.save(new Vocabulary("学_" + suffix, "xué", "xue", "Học", "Học tập"));
            vocab2 = vocabularyRepository.save(new Vocabulary("生_" + suffix, "shēng", "sheng", "Sinh", "Học sinh"));
            vocab3 = vocabularyRepository.save(new Vocabulary("校_" + suffix, "xiào", "xiao", "Hiệu", "Trường học"));
        });

        adminToken = jwtUtil.generateToken(admin.getEmailOrPhone(), List.of("Admin"));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        txTemplate.executeWithoutResult(status -> {
            reviewLogRepository.deleteAllInBatch();
            cardProgressRepository.deleteAllInBatch();
            personalNoteRepository.deleteAllInBatch();
            moderationLogRepository.deleteAllInBatch();
            List<Lesson> testLessons = lessonRepository.findAll().stream()
                    .filter(l -> l.getTitle() == null || (!l.getTitle().startsWith("Bài 0") && !l.getTitle().startsWith("Bài 10")))
                    .toList();
            for (Lesson tl : testLessons) {
                lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findByLessonIdWithVocabularyOrderAsc(tl.getLessonId()));
                lessonRepository.delete(tl);
            }
            lessonVocabularyRepository.deleteAll(lessonVocabularyRepository.findAll().stream()
                    .filter(lv -> lv.getVocabulary() != null && lv.getVocabulary().getHskLevel() == null)
                    .toList());
            vocabularyRepository.deleteByHskLevelIsNull();
        });
    }

    private Account createAccountWithProfile(String email, String fullName, Role role) {
        Account acc = new Account();
        acc.setEmailOrPhone(email);
        acc.setPasswordHash("$2a$12$dummyhash12345678901234567890123456789012345678901234");
        acc.setStatus("Active");
        if (role != null) {
            acc.getRoles().add(role);
        }
        Account savedAcc = accountRepository.save(acc);

        UserProfile profile = new UserProfile();
        profile.setAccount(savedAcc);
        profile.setFullName(fullName);
        UserProfile savedProfile = userProfileRepository.save(profile);

        userSrsSettingRepository.save(new UserSrsSetting(savedProfile, 20, 100));

        return savedAcc;
    }

    private void setAuth(Account account, String role) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                account.getEmailOrPhone(), "N/A", List.of(new SimpleGrantedAuthority(role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("1. Admin Deletion & Shared Vocabulary Isolation Tests")
    class AdminDeletionAndIsolationTests {

        @Test
        @DisplayName("GIVEN lesson WITH vocabularies WHEN Admin deletes via HTTP THEN deletes Lesson & associations but preserves Vocabulary entities")
        void testAdminDeleteLesson_preservesMasterVocab() throws Exception {
            Lesson lesson = txTemplate.execute(status -> {
                Lesson l = new Lesson("Admin Lesson with Vocabs", admin);
                l.setStatus("Approved");
                l = lessonRepository.save(l);
                lessonVocabularyRepository.save(new LessonVocabulary(l, vocab1, 1));
                lessonVocabularyRepository.save(new LessonVocabulary(l, vocab2, 2));
                return l;
            });
            Long lessonId = lesson.getLessonId();

            mockMvc.perform(delete("/api/v1/admin/lessons/" + lessonId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            assertThat(lessonRepository.existsById(lessonId)).isFalse();
            assertThat(lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonId)).isEmpty();
            assertThat(vocabularyRepository.existsById(vocab1.getVocabId())).isTrue();
            assertThat(vocabularyRepository.existsById(vocab2.getVocabId())).isTrue();
        }

        @Test
        @DisplayName("GIVEN Vocab1 shared between Lesson A and Lesson B WHEN Lesson A is deleted THEN Lesson B and Vocab1 remain intact")
        void testSharedVocabularyIsolation_deleteLessonA_preservesLessonBAndVocab() {
            List<Lesson> lessons = txTemplate.execute(status -> {
                Lesson lessonA = new Lesson("Lesson A", admin);
                lessonA.setStatus("Draft");
                lessonA = lessonRepository.save(lessonA);
                lessonVocabularyRepository.save(new LessonVocabulary(lessonA, vocab1, 1));

                Lesson lessonB = new Lesson("Lesson B (Approved)", admin);
                lessonB.setStatus("Approved");
                lessonB = lessonRepository.save(lessonB);
                lessonVocabularyRepository.save(new LessonVocabulary(lessonB, vocab1, 1));

                return List.of(lessonA, lessonB);
            });

            Long lessonAId = lessons.get(0).getLessonId();
            Long lessonBId = lessons.get(1).getLessonId();

            setAuth(admin, "ROLE_ADMIN");
            lessonService.deleteAdminLesson(lessonAId);

            assertThat(lessonRepository.existsById(lessonAId)).isFalse();
            assertThat(lessonRepository.existsById(lessonBId)).isTrue();
            List<LessonVocabulary> bLinks = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lessonBId);
            assertThat(bLinks).hasSize(1);
            assertThat(bLinks.get(0).getVocabulary().getVocabId()).isEqualTo(vocab1.getVocabId());
            assertThat(vocabularyRepository.existsById(vocab1.getVocabId())).isTrue();
        }

        @Test
        @DisplayName("GIVEN lesson containing Vocab1 with existing CardProgress, ReviewLog & PersonalNote WHEN lesson is deleted THEN learner learning state is intact")
        void testDeleteLesson_preservesLearnerSrsAndNotes() {
            Lesson lessonA = txTemplate.execute(status -> {
                Lesson approvedLesson = new Lesson("Approved Lesson", admin);
                approvedLesson.setStatus("Approved");
                approvedLesson = lessonRepository.save(approvedLesson);
                lessonVocabularyRepository.save(new LessonVocabulary(approvedLesson, vocab1, 1));

                CardProgress cp = new CardProgress();
                cp.setUser(learnerProfile);
                cp.setItemType("VOCABULARY");
                cp.setItemId(vocab1.getVocabId());
                cp.setEaseFactor(new BigDecimal("2.50"));
                cp.setIntervalDays(1);
                cp.setRepetitions(1);
                cp.setNextReviewAt(LocalDateTime.now().plusDays(1));
                cardProgressRepository.save(cp);

                reviewLogRepository.save(new ReviewLog(learnerProfile, "VOCABULARY", vocab1.getVocabId(), (byte) 3, 0, 1, 5));
                personalNoteRepository.save(new PersonalNote(learnerProfile, vocab1, "Ghi chú quan trọng"));

                Lesson draftLesson = new Lesson("Admin Draft", admin);
                draftLesson.setStatus("Draft");
                draftLesson = lessonRepository.save(draftLesson);
                lessonVocabularyRepository.save(new LessonVocabulary(draftLesson, vocab1, 1));
                return draftLesson;
            });

            setAuth(admin, "ROLE_ADMIN");
            lessonService.deleteAdminLesson(lessonA.getLessonId());

            assertThat(lessonRepository.existsById(lessonA.getLessonId())).isFalse();
            CardProgress cpAfter = cardProgressRepository.findByUserAndItemTypeAndItemId(learnerProfile, "VOCABULARY", vocab1.getVocabId()).orElse(null);
            assertThat(cpAfter).isNotNull();
            assertThat(cpAfter.getRepetitions()).isEqualTo(1);
            assertThat(reviewLogRepository.findByUserAndItemTypeAndItemIdOrderByReviewedAtDesc(learnerProfile, "VOCABULARY", vocab1.getVocabId())).hasSize(1);
            assertThat(personalNoteRepository.findByUserAndVocabularyOrderByCreatedAtDesc(learnerProfile, vocab1)).hasSize(1);
        }
    }

    @Nested
    @DisplayName("2. SRS Learning Preservation & New Card Eligibility Tests")
    class SrsPreservationAndEligibilityTests {

        @Test
        @DisplayName("Existing SRS CardProgress is 100% reviewable even if Lesson status changes")
        void testSRSReviewPreservation_afterLessonStatusChanges() {
            Lesson approvedLesson = txTemplate.execute(status -> {
                Lesson l = new Lesson("Approved Lesson for SRS Review", admin);
                l.setStatus("Approved");
                l = lessonRepository.save(l);
                lessonVocabularyRepository.save(new LessonVocabulary(l, vocab1, 1));
                return l;
            });

            setAuth(learner, "ROLE_LEARNER");
            srsService.reviewCard(new ReviewCardRequest("VOCABULARY", vocab1.getVocabId(), 3, 5));

            txTemplate.executeWithoutResult(status -> {
                Lesson l = lessonRepository.findById(approvedLesson.getLessonId()).orElseThrow();
                l.setStatus("Rejected");
                lessonRepository.save(l);
                CardProgress cp = cardProgressRepository.findByUserAndItemTypeAndItemId(learnerProfile, "VOCABULARY", vocab1.getVocabId()).orElseThrow();
                cp.setNextReviewAt(LocalDateTime.now().minusMinutes(1));
                cardProgressRepository.save(cp);
            });

            setAuth(learner, "ROLE_LEARNER");
            var reviewRes = srsService.reviewCard(new ReviewCardRequest("VOCABULARY", vocab1.getVocabId(), 4, 3));
            assertThat(reviewRes.getRepetitions()).isEqualTo(2);
        }

        @Test
        @DisplayName("New Vocabulary Card introduction is strictly blocked (422) if vocabulary only belongs to Draft/Rejected lesson")
        void testNewCardEligibilityBoundary_onlyApprovedLessonsCanIntroduceNewVocab() {
            txTemplate.executeWithoutResult(status -> {
                Lesson draftLesson = new Lesson("Draft Lesson for Eligibility Test", admin);
                draftLesson.setStatus("Draft");
                draftLesson = lessonRepository.save(draftLesson);
                lessonVocabularyRepository.save(new LessonVocabulary(draftLesson, vocab3, 1));
            });

            setAuth(learner, "ROLE_LEARNER");
            ReviewCardRequest reviewReq = new ReviewCardRequest("VOCABULARY", vocab3.getVocabId(), 3, 5);

            assertThatThrownBy(() -> srsService.reviewCard(reviewReq))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException be = (BusinessException) ex;
                        assertThat(be.getErrorCode()).isEqualTo(ErrorCode.UNPROCESSABLE_ENTITY);
                        assertThat(be.getMessage()).contains("Từ vựng chưa thuộc bất kỳ bài học nào đã được phê duyệt");
                    });
        }
    }
}
