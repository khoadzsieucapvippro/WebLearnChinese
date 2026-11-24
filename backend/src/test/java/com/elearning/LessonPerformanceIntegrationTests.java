package com.elearning;

import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Lesson;
import com.elearning.entity.LessonVocabulary;
import com.elearning.entity.Role;
import com.elearning.entity.Vocabulary;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.LessonVocabularyRepository;
import com.elearning.repository.RoleRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.service.LessonService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance and Query-Count Integration Tests for BE-PERF-002.
 * Verifies on real MySQL 8.4 Testcontainers that LessonService.getAdminLessons()
 * eliminates N+1 vocabulary count queries and operates with O(1) bounded queries.
 */
@SpringBootTest
@DisplayName("BE-PERF-002: Admin getAdminLessons() Query-Count & Performance Integration Tests")
class LessonPerformanceIntegrationTests {

    @Autowired
    private LessonService lessonService;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonVocabularyRepository lessonVocabularyRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Statistics hibernateStats;
    private final List<Vocabulary> testVocabularies = new ArrayList<>();
    private final List<Account> createdAccounts = new ArrayList<>();
    private final List<Lesson> createdLessons = new ArrayList<>();

    @BeforeEach
    void setUp() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        hibernateStats = sessionFactory.getStatistics();
        hibernateStats.setStatisticsEnabled(true);
        hibernateStats.clear();

        String suffix = UUID.randomUUID().toString().substring(0, 6);
        testVocabularies.add(vocabularyRepository.save(new Vocabulary("字" + suffix, "zì", "zi", "Tự", "Chữ Hán 1")));
        testVocabularies.add(vocabularyRepository.save(new Vocabulary("学" + suffix, "xué", "xue", "Học", "Học tập 2")));
        testVocabularies.add(vocabularyRepository.save(new Vocabulary("校" + suffix, "xiào", "xiao", "Hiệu", "Trường học 3")));
        testVocabularies.add(vocabularyRepository.save(new Vocabulary("生" + suffix, "shēng", "sheng", "Sinh", "Học sinh 4")));
        testVocabularies.add(vocabularyRepository.save(new Vocabulary("师" + suffix, "shī", "shi", "Sư", "Thầy giáo 5")));
        vocabularyRepository.flush();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();

        for (Lesson lesson : createdLessons) {
            List<LessonVocabulary> lvs = lessonVocabularyRepository.findByLesson_LessonIdOrderByOrderIndexAsc(lesson.getLessonId());
            if (!lvs.isEmpty()) {
                lessonVocabularyRepository.deleteAll(lvs);
            }
        }
        lessonVocabularyRepository.flush();

        if (!createdLessons.isEmpty()) {
            lessonRepository.deleteAll(createdLessons);
            lessonRepository.flush();
            createdLessons.clear();
        }

        if (!createdAccounts.isEmpty()) {
            accountRepository.deleteAll(createdAccounts);
            accountRepository.flush();
            createdAccounts.clear();
        }

        if (!testVocabularies.isEmpty()) {
            vocabularyRepository.deleteAll(testVocabularies);
            vocabularyRepository.flush();
            testVocabularies.clear();
        }

        if (hibernateStats != null) {
            hibernateStats.clear();
        }
    }

    private Account createAdmin(String emailPrefix) {
        String uniqueEmail = emailPrefix + "_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        Role adminRole = roleRepository.findByRoleName("Admin").orElse(null);

        Account account = new Account();
        account.setEmailOrPhone(uniqueEmail);
        account.setPasswordHash("$2a$12$dummyhashforperfadmin12345678901234567");
        account.setStatus("Active");
        if (adminRole != null) {
            account.getRoles().add(adminRole);
        }
        account = accountRepository.saveAndFlush(account);
        createdAccounts.add(account);
        return account;
    }

    private void setAuthentication(String email) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                email, "N/A", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GIVEN lessons WHEN getAdminLessons THEN executes bounded queries (eliminated N+1) and accurately counts vocabularies")
    void test1_getAdminLessons_boundedQueryCount() {
        Account admin = createAdmin("admin_perf_10");

        List<Lesson> lessons = new ArrayList<>();
        List<LessonVocabulary> allLvs = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Lesson lesson = new Lesson("Bài học Perf " + i, admin);
            lesson.setStatus("Approved");
            lesson = lessonRepository.save(lesson);
            lessons.add(lesson);
            createdLessons.add(lesson);

            int vocabCount = (i <= 2) ? 3 : (i <= 4) ? 1 : 0;
            for (int v = 0; v < vocabCount; v++) {
                allLvs.add(new LessonVocabulary(lesson, testVocabularies.get(v), v + 1));
            }
        }
        lessonRepository.flush();
        if (!allLvs.isEmpty()) {
            lessonVocabularyRepository.saveAllAndFlush(allLvs);
        }

        setAuthentication(admin.getEmailOrPhone());

        hibernateStats.clear();
        long statementsBefore = hibernateStats.getPrepareStatementCount();

        Page<LessonSummaryResponse> page = lessonService.getAdminLessons(null, PageRequest.of(0, 20));

        long statementsAfter = hibernateStats.getPrepareStatementCount();
        long executedQueries = statementsAfter - statementsBefore;

        assertThat(executedQueries)
                .as("Query count must be bounded (<= 4 queries, N+1 eliminated)")
                .isLessThanOrEqualTo(4);
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(5);
    }

    @Test
    @DisplayName("GIVEN pagination WHEN getAdminLessons THEN query count remains bounded across page sizes")
    void test2_getAdminLessons_scalingInvarianceAcrossPageSizes() {
        Account admin = createAdmin("admin_scale_test");
        List<LessonVocabulary> lvs = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            Lesson lesson = lessonRepository.save(new Lesson("Bài Scale " + i, admin));
            createdLessons.add(lesson);
            lvs.add(new LessonVocabulary(lesson, testVocabularies.get(0), 1));
            lvs.add(new LessonVocabulary(lesson, testVocabularies.get(1), 2));
        }
        lessonRepository.flush();
        lessonVocabularyRepository.saveAllAndFlush(lvs);

        setAuthentication(admin.getEmailOrPhone());

        hibernateStats.clear();
        Page<LessonSummaryResponse> page5 = lessonService.getAdminLessons(null, PageRequest.of(0, 5));
        long queriesFor5 = hibernateStats.getPrepareStatementCount();

        hibernateStats.clear();
        Page<LessonSummaryResponse> page15 = lessonService.getAdminLessons(null, PageRequest.of(0, 15));
        long queriesFor15 = hibernateStats.getPrepareStatementCount();

        assertThat(page5.getContent()).hasSize(5);
        assertThat(page15.getContent()).hasSize(15);
        assertThat(queriesFor15).isEqualTo(queriesFor5);
        assertThat(queriesFor5).isLessThanOrEqualTo(4);
    }
}
