package com.elearning;

import com.elearning.common.ErrorCode;
import com.elearning.controller.SrsController;
import com.elearning.dto.request.ReviewCardRequest;
import com.elearning.dto.response.CurriculumProgressResponse;
import com.elearning.dto.response.DueCardResponse;
import com.elearning.dto.response.LessonSrsStatsResponse;
import com.elearning.dto.response.StudyStatsResponse;
import com.elearning.exception.BusinessException;
import com.elearning.exception.GlobalExceptionHandler;
import com.elearning.service.SrsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Task 7B.2: SrsController Unit Contract Tests")
class SrsControllerTests {

    @Mock
    private SrsService srsService;

    @InjectMocks
    private SrsController srsController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(srsController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Nested
    @DisplayName("GET /api/v1/srs/due Tests")
    class GetDueCardsEndpointTests {

        @Test
        @DisplayName("GET /api/v1/srs/due with parameters delegates to SrsService and returns ApiResponse")
        void testGetDueCards_withParams_success() throws Exception {
            DueCardResponse card1 = new DueCardResponse();
            card1.setItemType("VOCABULARY");
            card1.setItemId(101L);
            card1.setHanzi("水");
            card1.setPinyin("shuǐ");
            card1.setMeaningVi("Nước");
            card1.setEaseFactor(new BigDecimal("2.50"));
            card1.setIntervalDays(1);
            card1.setRepetitions(1);

            when(srsService.getDueCards(eq("VOCABULARY"), eq(10)))
                    .thenReturn(List.of(card1));

            mockMvc.perform(get("/api/v1/srs/due")
                            .param("itemType", "VOCABULARY")
                            .param("limit", "10")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.message", is("Thao tác thành công")))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].itemType", is("VOCABULARY")))
                    .andExpect(jsonPath("$.data[0].itemId", is(101)))
                    .andExpect(jsonPath("$.data[0].hanzi", is("水")));

            verify(srsService).getDueCards(eq("VOCABULARY"), eq(10));
        }

        @Test
        @DisplayName("GET /api/v1/srs/due with no parameters delegates with nulls")
        void testGetDueCards_noParams_success() throws Exception {
            when(srsService.getDueCards(null, null)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/srs/due")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data", hasSize(0)));

            verify(srsService).getDueCards(null, null);
        }

        @Test
        @DisplayName("GET /api/v1/srs/due with lessonId delegates to 4-arg SrsService method")
        void testGetDueCards_withLessonId_delegatesToService() throws Exception {
            DueCardResponse card1 = new DueCardResponse();
            card1.setItemType("VOCABULARY");
            card1.setItemId(105L);
            card1.setHanzi("学");

            when(srsService.getDueCards(eq("VOCABULARY"), eq("READING"), eq(5L), eq(20)))
                    .thenReturn(List.of(card1));

            mockMvc.perform(get("/api/v1/srs/due")
                            .param("itemType", "VOCABULARY")
                            .param("cardType", "READING")
                            .param("lessonId", "5")
                            .param("limit", "20")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].itemId", is(105)));

            verify(srsService).getDueCards(eq("VOCABULARY"), eq("READING"), eq(5L), eq(20));
        }

        @Test
        @DisplayName("GET /api/v1/srs/lessons/{lessonId}/due path variable delegates to SrsService")
        void testGetDueCardsForLesson_pathVariable_delegatesToService() throws Exception {
            DueCardResponse card1 = new DueCardResponse();
            card1.setItemType("VOCABULARY");
            card1.setItemId(106L);
            card1.setCardType("READING");

            when(srsService.getDueCards(eq("VOCABULARY"), eq("READING"), eq(7L), eq(15)))
                    .thenReturn(List.of(card1));

            mockMvc.perform(get("/api/v1/srs/lessons/7/due")
                            .param("itemType", "VOCABULARY")
                            .param("cardType", "READING")
                            .param("limit", "15")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].itemId", is(106)));

            verify(srsService).getDueCards(eq("VOCABULARY"), eq("READING"), eq(7L), eq(15));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/srs/review Tests")
    class ReviewCardEndpointTests {

        @Test
        @DisplayName("POST /api/v1/srs/review with valid body delegates to SrsService and returns ApiResponse")
        void testReviewCard_validRequest_success() throws Exception {
            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 200L, 3, 4);

            DueCardResponse updatedResponse = new DueCardResponse();
            updatedResponse.setItemType("VOCABULARY");
            updatedResponse.setItemId(200L);
            updatedResponse.setHanzi("火");
            updatedResponse.setPinyin("huǒ");
            updatedResponse.setMeaningVi("Lửa");
            updatedResponse.setEaseFactor(new BigDecimal("2.50"));
            updatedResponse.setIntervalDays(1);
            updatedResponse.setRepetitions(1);

            when(srsService.reviewCard(any(ReviewCardRequest.class))).thenReturn(updatedResponse);

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data.itemType", is("VOCABULARY")))
                    .andExpect(jsonPath("$.data.itemId", is(200)))
                    .andExpect(jsonPath("$.data.intervalDays", is(1)))
                    .andExpect(jsonPath("$.data.repetitions", is(1)));

            verify(srsService).reviewCard(any(ReviewCardRequest.class));
        }

        @Test
        @DisplayName("POST /api/v1/srs/review with invalid rating returns 400 Bad Request and does not call service")
        void testReviewCard_invalidRating_returns400() throws Exception {
            ReviewCardRequest invalidRequest = new ReviewCardRequest("VOCABULARY", 200L, 5, 4); // rating 5 is out of bounds

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

            verify(srsService, never()).reviewCard(any());
        }

        @Test
        @DisplayName("POST /api/v1/srs/review with invalid itemType returns 400 Bad Request")
        void testReviewCard_invalidItemType_returns400() throws Exception {
            ReviewCardRequest invalidRequest = new ReviewCardRequest("LESSON", 200L, 3, 4);

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

            verify(srsService, never()).reviewCard(any());
        }

        @Test
        @DisplayName("POST /api/v1/srs/review with negative reviewTimeSeconds returns 400 Bad Request")
        void testReviewCard_negativeTime_returns400() throws Exception {
            ReviewCardRequest invalidRequest = new ReviewCardRequest("VOCABULARY", 200L, 3, -1);

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));

            verify(srsService, never()).reviewCard(any());
        }

        @Test
        @DisplayName("POST /api/v1/srs/review with missing item in service propagates NOT_FOUND 404")
        void testReviewCard_serviceThrowsNotFound_propagates404() throws Exception {
            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 999999L, 3, 2);

            when(srsService.reviewCard(any(ReviewCardRequest.class)))
                    .thenThrow(new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy từ vựng với ID: 999999"));

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code", is("NOT_FOUND")))
                    .andExpect(jsonPath("$.message", is("Không tìm thấy từ vựng với ID: 999999")));
        }

        @Test
        @DisplayName("POST /api/v1/srs/review with concurrent conflict returns 409 CONFLICT (BE-CONC-001)")
        void testReviewCard_concurrentConflict_returns409() throws Exception {
            ReviewCardRequest request = new ReviewCardRequest("VOCABULARY", 200L, 3, 2);

            when(srsService.reviewCard(any(ReviewCardRequest.class)))
                    .thenThrow(new org.springframework.dao.OptimisticLockingFailureException("Row was updated or deleted by another transaction"));

            mockMvc.perform(post("/api/v1/srs/review")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code", is("CONFLICT")))
                    .andExpect(jsonPath("$.message", is("Dữ liệu đã bị thay đổi bởi một phiên làm việc khác, vui lòng thử lại")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/srs/stats Tests")
    class GetStudyStatsEndpointTests {

        @Test
        @DisplayName("GET /api/v1/srs/stats delegates to SrsService and returns ApiResponse")
        void testGetStudyStats_success() throws Exception {
            StudyStatsResponse stats = new StudyStatsResponse(12L, 28L, 20, 100);

            when(srsService.getStudyStats()).thenReturn(stats);

            mockMvc.perform(get("/api/v1/srs/stats")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data.cardsDue", is(12)))
                    .andExpect(jsonPath("$.data.reviewsToday", is(28)))
                    .andExpect(jsonPath("$.data.newCardsLimit", is(20)))
                    .andExpect(jsonPath("$.data.maxReviewLimit", is(100)));

            verify(srsService).getStudyStats();
        }

        @Test
        @DisplayName("GET /api/v1/srs/lessons/{lessonId}/stats delegates to SrsService and returns LessonSrsStatsResponse")
        void testGetLessonSrsStats_success() throws Exception {
            LessonSrsStatsResponse stats = new LessonSrsStatsResponse(10L, 25, 5L, 8L, 3L, 2L, 3L);

            when(srsService.getLessonSrsStats(10L)).thenReturn(stats);

            mockMvc.perform(get("/api/v1/srs/lessons/10/stats")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data.lessonId", is(10)))
                    .andExpect(jsonPath("$.data.totalVocabularies", is(25)))
                    .andExpect(jsonPath("$.data.newWordsCount", is(5)))
                    .andExpect(jsonPath("$.data.dueCardsCount", is(8)))
                    .andExpect(jsonPath("$.data.dueCardsListening", is(3)))
                    .andExpect(jsonPath("$.data.dueCardsWriting", is(2)))
                    .andExpect(jsonPath("$.data.dueCardsReading", is(3)));

            verify(srsService).getLessonSrsStats(10L);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/srs/new-cards and /api/v1/srs/lessons/{id}/new-cards Tests")
    class GetNewCardCandidatesEndpointTests {

        @Test
        @DisplayName("GET /api/v1/srs/new-cards with lessonId delegates to SrsService and returns candidates")
        void testGetNewCardCandidates_queryParam_success() throws Exception {
            DueCardResponse card1 = new DueCardResponse();
            card1.setItemType("VOCABULARY");
            card1.setItemId(10L);
            card1.setHanzi("学");
            card1.setIsNew(true);

            when(srsService.getNewCardCandidates(1L, 10)).thenReturn(List.of(card1));

            mockMvc.perform(get("/api/v1/srs/new-cards")
                            .param("lessonId", "1")
                            .param("limit", "10")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].itemId", is(10)))
                    .andExpect(jsonPath("$.data[0].hanzi", is("学")))
                    .andExpect(jsonPath("$.data[0].isNew", is(true)));

            verify(srsService).getNewCardCandidates(1L, 10);
        }

        @Test
        @DisplayName("GET /api/v1/srs/lessons/{lessonId}/new-cards path variable delegates to SrsService")
        void testGetNewCardCandidates_pathVariable_success() throws Exception {
            DueCardResponse card1 = new DueCardResponse();
            card1.setItemType("VOCABULARY");
            card1.setItemId(20L);
            card1.setHanzi("习");
            card1.setIsNew(true);

            when(srsService.getNewCardCandidates(2L, null)).thenReturn(List.of(card1));

            mockMvc.perform(get("/api/v1/srs/lessons/2/new-cards")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].itemId", is(20)))
                    .andExpect(jsonPath("$.data[0].hanzi", is("习")));

            verify(srsService).getNewCardCandidates(2L, null);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/srs/curriculum-progress Tests")
    class GetCurriculumProgressEndpointTests {

        @Test
        @DisplayName("GET /api/v1/srs/curriculum-progress delegates to SrsService and returns aggregated progress")
        void testGetCurriculumProgress_success() throws Exception {
            CurriculumProgressResponse mockResponse = new CurriculumProgressResponse(
                    Map.of(1L, 20, 2L, 15),
                    Map.of("radicals50_chapter_0", 10),
                    35,
                    10,
                    List.of(101L, 102L),
                    List.of(1L, 2L)
            );

            when(srsService.getCurriculumProgress()).thenReturn(mockResponse);

            mockMvc.perform(get("/api/v1/srs/curriculum-progress")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code", is("SUCCESS")))
                    .andExpect(jsonPath("$.data.totalLearnedVocabularies", is(35)))
                    .andExpect(jsonPath("$.data.totalLearnedRadicals", is(10)))
                    .andExpect(jsonPath("$.data.lessonProgress.1", is(20)))
                    .andExpect(jsonPath("$.data.lessonProgress.2", is(15)))
                    .andExpect(jsonPath("$.data.chapterProgress.radicals50_chapter_0", is(10)));

            verify(srsService).getCurriculumProgress();
        }
    }
}
