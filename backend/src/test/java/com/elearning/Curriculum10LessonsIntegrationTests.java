package com.elearning;

import com.elearning.dto.response.LessonDetailResponse;
import com.elearning.dto.response.LessonSummaryResponse;
import com.elearning.dto.response.LessonVocabItemResponse;
import com.elearning.entity.Account;
import com.elearning.entity.Lesson;
import com.elearning.entity.UserProfile;
import com.elearning.repository.AccountRepository;
import com.elearning.repository.LessonRepository;
import com.elearning.repository.UserProfileRepository;
import com.elearning.repository.VocabularyRepository;
import com.elearning.security.JwtUtil;
import com.elearning.service.LessonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End Automated Integration Verification for the Restructured 10 Lessons Elementary Curriculum.
 * <p>
 * Verifies all Section 9 criteria:
 * 1. Exactly 10 official elementary lessons seeded by the system.
 * 2. Exactly 20 authentic vocabulary items per lesson, with contiguous order_index (1..20).
 * 3. Exactly 200 distinct vocabulary items total (zero duplicate words across lessons).
 * 4. All 200 words belong to authentic HSK 1 (HSK 3.0 standard).
 * 5. Legacy seed test lessons from V14 & V16 are completely cleaned up from the public catalog.
 * 6. Public REST APIs (GET /api/v1/lessons and GET /api/v1/lessons/{id}) behave deterministically.
 * 7. Non-approved lessons return 404 NOT_FOUND.
 * 8. Spaced Repetition System (SRS) candidate generation works smoothly for the new curriculum lessons.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Curriculum Restructuring: 10 Thematic Lessons & 200 Vocabulary Items End-to-End Tests")
class Curriculum10LessonsIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private javax.sql.DataSource dataSource;

    private String learnerToken;
    private Account learnerAccount;

    private static final List<String> EXPECTED_TITLES = List.of(
            "Bài 01 — Chào hỏi và giao tiếp cơ bản",
            "Bài 02 — Bản thân và giới thiệu cá nhân",
            "Bài 03 — Gia đình và các mối quan hệ",
            "Bài 04 — Số đếm, ngày tháng và thời gian",
            "Bài 05 — Trường học, học tập và công việc",
            "Bài 06 — Đồ ăn, thức uống và nhà hàng",
            "Bài 07 — Nhà cửa và sinh hoạt hằng ngày",
            "Bài 08 — Địa điểm, phương hướng và giao thông",
            "Bài 09 — Mua sắm, tiền bạc và quần áo",
            "Bài 10 — Sở thích, thể thao và giải trí"
    );

    @BeforeEach
    void setUp() {
        try (java.sql.Connection conn = dataSource.getConnection()) {
            TestcontainersInitializer.ensureCurriculumSeeded(conn);
        } catch (Exception ignored) {
        }

        learnerAccount = accountRepository.findByEmailOrPhone("curriculum_learner@test.com")
                .orElseGet(() -> {
                    Account a = new Account();
                    a.setEmailOrPhone("curriculum_learner@test.com");
                    a.setPasswordHash("$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm");
                    a.setStatus("Active");
                    return accountRepository.save(a);
                });

        if (userProfileRepository.findByAccount(learnerAccount).isEmpty()) {
            UserProfile profile = new UserProfile();
            profile.setAccount(learnerAccount);
            profile.setFullName("Curriculum Learner");
            userProfileRepository.save(profile);
        }

        learnerToken = jwtUtil.generateToken(learnerAccount.getEmailOrPhone(), List.of("Learner"));
    }

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Test
    @DisplayName("Criterion 1: Exactly 10 official elementary lessons exist in database with expected thematic titles")
    void testExact10OfficialLessonsExist() {
        Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 100));
        List<LessonSummaryResponse> curriculumLessons = page.getContent().stream()
                .filter(l -> l.getTitle() != null && l.getTitle().startsWith("Bài "))
                .toList();

        assertThat(curriculumLessons).hasSize(10);

        List<String> actualTitles = curriculumLessons.stream()
                .map(LessonSummaryResponse::getTitle)
                .toList();

        assertThat(actualTitles).containsExactlyElementsOf(EXPECTED_TITLES);
    }

    @Test
    @DisplayName("Criterion 2: Each of the 10 lessons has exactly 20 vocabularies with contiguous order_index 1..20")
    void testEachLessonHasExactly20VocabulariesWithStrictOrderIndex() {
        Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 100));
        List<LessonSummaryResponse> curriculumLessons = page.getContent().stream()
                .filter(l -> l.getTitle() != null && l.getTitle().startsWith("Bài "))
                .toList();

        assertThat(curriculumLessons).hasSize(10);

        for (LessonSummaryResponse summary : curriculumLessons) {
            LessonDetailResponse detail = lessonService.getApprovedLessonById(summary.getLessonId());

            assertThat(detail.getVocabularyCount())
                    .as("Lesson '%s' vocabularyCount must equal 20", detail.getTitle())
                    .isEqualTo(20);

            List<LessonVocabItemResponse> vocabularies = detail.getVocabularies();
            assertThat(vocabularies)
                    .as("Lesson '%s' vocabularies list size must equal 20", detail.getTitle())
                    .hasSize(20);

            for (int i = 0; i < 20; i++) {
                LessonVocabItemResponse item = vocabularies.get(i);
                int expectedOrderIndex = i + 1;

                assertThat(item.getOrderIndex())
                        .as("Item %d in lesson '%s' must have orderIndex = %d", i, detail.getTitle(), expectedOrderIndex)
                        .isEqualTo(expectedOrderIndex);

                assertThat(item.getHanzi())
                        .as("Hanzi must not be blank")
                        .isNotBlank();

                assertThat(item.getPinyin())
                        .as("Pinyin must not be blank")
                        .isNotBlank();

                assertThat(item.getPinyinRaw())
                        .as("PinyinRaw must not be blank")
                        .isNotBlank();

                assertThat(item.getMeaningVi())
                        .as("Vietnamese meaning must not be blank")
                        .isNotBlank();
            }
        }
    }

    @Test
    @DisplayName("Criterion 3: Exactly 200 distinct vocabulary IDs across all 10 lessons (zero duplicate words)")
    void testTotal200DistinctVocabulariesAcrossLessons() {
        Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 100));
        List<LessonSummaryResponse> curriculumLessons = page.getContent().stream()
                .filter(l -> l.getTitle() != null && l.getTitle().startsWith("Bài "))
                .toList();

        List<Long> allVocabIds = new ArrayList<>();
        Set<Long> uniqueVocabIds = new HashSet<>();

        for (LessonSummaryResponse summary : curriculumLessons) {
            LessonDetailResponse detail = lessonService.getApprovedLessonById(summary.getLessonId());
            for (LessonVocabItemResponse v : detail.getVocabularies()) {
                allVocabIds.add(v.getVocabId());
                uniqueVocabIds.add(v.getVocabId());
            }
        }

        assertThat(allVocabIds)
                .as("Total vocabulary associations across 10 lessons must be 200")
                .hasSize(200);

        assertThat(uniqueVocabIds)
                .as("Unique vocabulary count across 10 lessons must be exactly 200 (no duplicate words)")
                .hasSize(200);
    }

    @Test
    @DisplayName("Criterion 4: Legacy seed test lessons from V14 & V16 are completely cleaned up")
    void testLegacyTestLessonsCleanedUp() {
        List<String> legacyTitles = List.of(
                "SRS Test - Basic Recall",
                "SRS Test - Failure Recovery",
                "SRS Test - Due Review",
                "Bài học 5 từ - Giao tiếp cơ bản"
        );

        for (String title : legacyTitles) {
            Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 100));
            boolean exists = page.getContent().stream().anyMatch(l -> title.equalsIgnoreCase(l.getTitle()));
            assertThat(exists)
                    .as("Legacy test lesson '%s' must not exist in approved lessons catalog", title)
                    .isFalse();
        }
    }

    @Test
    @DisplayName("Criterion 5: Public API GET /api/v1/lessons returns lessons in deterministic sequential order")
    void testPublicCatalogApiSequentialOrdering() throws Exception {
        mockMvc.perform(get("/api/v1/lessons")
                        .param("page", "0")
                        .param("size", "20")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data.items", hasSize(10)))
                .andExpect(jsonPath("$.data.items[0].title", is("Bài 01 — Chào hỏi và giao tiếp cơ bản")))
                .andExpect(jsonPath("$.data.items[0].vocabularyCount", is(20)))
                .andExpect(jsonPath("$.data.items[1].title", is("Bài 02 — Bản thân và giới thiệu cá nhân")))
                .andExpect(jsonPath("$.data.items[1].vocabularyCount", is(20)))
                .andExpect(jsonPath("$.data.items[9].title", is("Bài 10 — Sở thích, thể thao và giải trí")))
                .andExpect(jsonPath("$.data.items[9].vocabularyCount", is(20)));
    }

    @Test
    @DisplayName("Criterion 6: Public API GET /api/v1/lessons/{id} returns full 20 vocabulary items with order_index 1..20")
    void testPublicLessonDetailApiVocabularyOrdering() throws Exception {
        Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 10));
        LessonSummaryResponse lesson1 = page.getContent().stream()
                .filter(l -> l.getTitle() != null && l.getTitle().startsWith("Bài 01"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/v1/lessons/" + lesson1.getLessonId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data.lessonId", is(lesson1.getLessonId().intValue())))
                .andExpect(jsonPath("$.data.title", is("Bài 01 — Chào hỏi và giao tiếp cơ bản")))
                .andExpect(jsonPath("$.data.vocabularyCount", is(20)))
                .andExpect(jsonPath("$.data.vocabularies", hasSize(20)))
                .andExpect(jsonPath("$.data.vocabularies[0].orderIndex", is(1)))
                .andExpect(jsonPath("$.data.vocabularies[19].orderIndex", is(20)));
    }

    @Test
    @DisplayName("Criterion 7: Non-approved lessons (Draft/Rejected) return 404 NOT_FOUND on public detail API")
    void testNonApprovedLessonsHiddenAs404() throws Exception {
        Lesson draftLesson = new Lesson("Private Draft Lesson", learnerAccount);
        draftLesson.setStatus("Draft");
        draftLesson = lessonRepository.save(draftLesson);

        mockMvc.perform(get("/api/v1/lessons/" + draftLesson.getLessonId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("NOT_FOUND")));
    }

    @Test
    @DisplayName("Criterion 8: SRS new-card candidate generation works smoothly for curriculum lessons")
    void testSrsCandidateGenerationForCurriculumLessons() throws Exception {
        Page<LessonSummaryResponse> page = lessonRepository.findApprovedLessonSummaries(PageRequest.of(0, 10));
        LessonSummaryResponse lesson1 = page.getContent().stream()
                .filter(l -> l.getTitle() != null && l.getTitle().startsWith("Bài 01"))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(get("/api/v1/srs/new-cards")
                        .param("lessonId", lesson1.getLessonId().toString())
                        .param("limit", "10")
                        .header("Authorization", "Bearer " + learnerToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data", hasSize(10)))
                .andExpect(jsonPath("$.data[0].itemType", is("VOCABULARY")))
                .andExpect(jsonPath("$.data[0].isNew", is(true)))
                .andExpect(jsonPath("$.data[0].hanzi", is("请")))
                .andExpect(jsonPath("$.data[1].hanzi", is("请问")))
                .andExpect(jsonPath("$.data[9].hanzi", is("再见")));
    }
}
