package com.elearning;

import com.elearning.entity.Vocabulary;
import com.elearning.repository.VocabularyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("HSK 1 Data Integrity, Unicode Accuracy & Strict HSK Filter Tests")
class VocabularyHskAndUnicodeIntegrityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("1. Database Level Unicode & Data Integrity Verification")
    class DatabaseDataIntegrityTests {

        @Test
        @DisplayName("GIVEN seeded database WHEN querying HSK 1 count THEN exactly 500 records exist with zero corruption")
        void testHsk1ExactCountAndZeroCorruption() throws Exception {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {

                // 1. Verify HSK 1 count in test database
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` = 1")) {
                    assertThat(rs.next()).isTrue();
                    int hsk1Count = rs.getInt(1);
                    assertThat(hsk1Count).isEqualTo(500);
                }

                // 2. Verify NO record contains literal ASCII '?' corruption in hanzi or pinyin
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT COUNT(*) FROM `vocabulary` WHERE `hanzi` LIKE '%?%' OR `pinyin` LIKE '%?%'")) {
                    assertThat(rs.next()).isTrue();
                    int corruptedCount = rs.getInt(1);
                    assertThat(corruptedCount).isZero();
                }

                // 3. Verify specific sample records for authentic UTF-8 Chinese characters and tonal Pinyin
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT `hanzi`, HEX(`hanzi`), `pinyin`, `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '爱'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("hanzi")).isEqualTo("爱");
                    assertThat(rs.getString(2)).isEqualTo("E788B1");
                    assertThat(rs.getString("pinyin")).isEqualTo("ài");
                    assertThat(rs.getString("meaning_vi")).contains("Yêu");
                }

                try (ResultSet rs = stmt.executeQuery(
                        "SELECT `hanzi`, HEX(`hanzi`), `pinyin`, `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '爸爸'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("hanzi")).isEqualTo("爸爸");
                    assertThat(rs.getString(2)).isEqualTo("E788B8E788B8");
                    assertThat(rs.getString("pinyin")).isEqualTo("bàba");
                    assertThat(rs.getString("meaning_vi")).isEqualTo("Cha, ba");
                }

                try (ResultSet rs = stmt.executeQuery(
                        "SELECT `hanzi`, HEX(`hanzi`), `pinyin` FROM `vocabulary` WHERE `hanzi` = '书'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("hanzi")).isEqualTo("书");
                    assertThat(rs.getString(2)).isEqualTo("E4B9A6");
                    assertThat(rs.getString("pinyin")).isEqualTo("shū");
                }
            }
        }
    }

    @Nested
    @DisplayName("2. API Endpoint Unicode & Strict HSK Filter Semantics")
    class ApiFilterAndUnicodeTests {

        @Test
        @DisplayName("GIVEN GET /api/v1/vocabulary?hsk=1 WHEN requested THEN returns 200 OK with exactly 500 totalElements and authentic UTF-8")
        void testHsk1EndpointReturnsCorrectTotalAndUnicode() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/v1/vocabulary")
                            .param("page", "0")
                            .param("size", "20")
                            .param("hsk", "1")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.totalElements").value(500))
                    .andExpect(jsonPath("$.data.items").isArray())
                    .andReturn();

            String responseBody = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode items = rootNode.path("data").path("items");

            assertThat(items.size()).isEqualTo(20);
            for (JsonNode item : items) {
                // Assert each item strictly has hskLevel == 1
                assertThat(item.path("hskLevel").asInt()).isEqualTo(1);
                // Assert no literal '?' corruption
                assertThat(item.path("hanzi").asText()).doesNotContain("?");
                assertThat(item.path("pinyin").asText()).doesNotContain("?");
            }

            // Verify first item contains authentic '爱'
            JsonNode firstItem = items.get(0);
            assertThat(firstItem.path("hanzi").asText()).isEqualTo("爱");
            assertThat(firstItem.path("pinyin").asText()).isEqualTo("ài");
            assertThat(firstItem.path("meaningVi").asText()).contains("Yêu");
        }

        @Test
        @DisplayName("GIVEN records with hsk_level IS NULL WHEN filtering by hsk=1 THEN NULL records are STRICTLY EXCLUDED")
        void testHskFilterStrictSemanticsExcludesNullHskLevel() throws Exception {
            // Create a temporary vocabulary with hsk_level = null
            Vocabulary legacyNullVocab = new Vocabulary("测试词", "cè shì cí", "ce shi ci", "Trắc Thí Từ", "Từ thử nghiệm không có HSK");
            legacyNullVocab.setHskLevel(null);
            legacyNullVocab = vocabularyRepository.save(legacyNullVocab);

            try {
                // When querying HSK 1, totalElements must remain 500 and must NOT include the null record
                MvcResult result = mockMvc.perform(get("/api/v1/vocabulary")
                                .param("hsk", "1")
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.data.totalElements").value(500))
                        .andReturn();

                String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
                assertThat(json).doesNotContain("测试词");
            } finally {
                vocabularyRepository.delete(legacyNullVocab);
            }
        }
    }

    @Nested
    @DisplayName("3. Database Isolation Safety Check")
    class DatabaseIsolationSafetyVerification {

        @Test
        @DisplayName("GIVEN active test DataSource WHEN inspected THEN URL does not contain elearning_db")
        void testActiveDataSourceIsNotDevelopmentDb() throws Exception {
            try (Connection conn = dataSource.getConnection()) {
                DatabaseMetaData metaData = conn.getMetaData();
                String url = metaData.getURL();

                assertThat(url).doesNotContain("/elearning_db");
                assertThat(url).contains("elearning_test");
            }
        }
    }
}
