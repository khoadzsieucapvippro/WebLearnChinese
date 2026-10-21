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
        @DisplayName("GIVEN seeded database WHEN querying HSK 1-3 counts THEN exactly 300 L1, 200 L2, 500 L3, 68 supplementary exist with zero corruption")
        void testHsk1ExactCountAndZeroCorruption() throws Exception {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {

                // 1. Verify HSK 1 count: exactly 300
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` = 1")) {
                    assertThat(rs.next()).isTrue();
                    int hsk1Count = rs.getInt(1);
                    assertThat(hsk1Count).isEqualTo(300);
                }

                // 2. Verify HSK 2 count: exactly 200
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` = 2")) {
                    assertThat(rs.next()).isTrue();
                    int hsk2Count = rs.getInt(1);
                    assertThat(hsk2Count).isEqualTo(200);
                }

                // 3. Verify HSK 3 count: exactly 500
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` = 3")) {
                    assertThat(rs.next()).isTrue();
                    int hsk3Count = rs.getInt(1);
                    assertThat(hsk3Count).isEqualTo(500);
                }

                // 4. Verify Total Official HSK 1-3: exactly 1000
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` IN (1, 2, 3)")) {
                    assertThat(rs.next()).isTrue();
                    int officialCount = rs.getInt(1);
                    assertThat(officialCount).isEqualTo(1000);
                }

                // 5. Verify Curriculum Supplementary: exactly 68
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_level` = 0 AND `hsk_standard` = 'Curriculum Supplementary'")) {
                    assertThat(rs.next()).isTrue();
                    int suppCount = rs.getInt(1);
                    assertThat(suppCount).isEqualTo(68);
                }

                // 6. Verify Total Database Records: exactly 1068
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary`")) {
                    assertThat(rs.next()).isTrue();
                    int totalCount = rs.getInt(1);
                    assertThat(totalCount).isEqualTo(1068);
                }

                // 7. Verify NO record contains literal ASCII '?' corruption in hanzi or pinyin
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT COUNT(*) FROM `vocabulary` WHERE `hanzi` LIKE '%?%' OR `pinyin` LIKE '%?%'")) {
                    assertThat(rs.next()).isTrue();
                    int corruptedCount = rs.getInt(1);
                    assertThat(corruptedCount).isZero();
                }

                // 8. Verify ALL 1,000 official source IDs exist with ZERO missing or orphaned
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_source_id` IS NOT NULL")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("Total records with official hsk_source_id must be exactly 1,000").isEqualTo(1000);
                }

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(DISTINCT `hsk_source_id`) FROM `vocabulary` WHERE `hsk_source_id` IS NOT NULL")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("Distinct official hsk_source_id count must be exactly 1,000").isEqualTo(1000);
                }

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_source_id` BETWEEN 1 AND 300 AND `hsk_level` = 1")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("HSK 1 source IDs 1..300 must match hsk_level = 1").isEqualTo(300);
                }

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_source_id` BETWEEN 301 AND 500 AND `hsk_level` = 2")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("HSK 2 source IDs 301..500 must match hsk_level = 2").isEqualTo(200);
                }

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_source_id` BETWEEN 501 AND 1000 AND `hsk_level` = 3")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("HSK 3 source IDs 501..1000 must match hsk_level = 3").isEqualTo(500);
                }

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM `vocabulary` WHERE `hsk_source_id` IS NULL AND `hsk_level` > 0")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("No non-supplementary records should have NULL hsk_source_id").isZero();
                }

                // 9. Verify specific required word standardizations
                // 女儿: source ID 153, Han-Viet Nữ Nhi, pinyin_raw nuer
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT `hanzi`, `pinyin`, `pinyin_raw`, `meaning_han_viet`, `meaning_vi`, `hsk_source_id`, `hsk_level` FROM `vocabulary` WHERE `hanzi` = '女儿'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("pinyin_raw")).isEqualTo("nuer");
                    assertThat(rs.getString("meaning_han_viet")).isEqualTo("Nữ Nhi");
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(153);
                    assertThat(rs.getInt("hsk_level")).isEqualTo(1);
                }

                // 爱好: HSK 2, source ID 302
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_level`, `hsk_source_id` FROM `vocabulary` WHERE `hanzi` = '爱好'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_level")).isEqualTo(2);
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(302);
                }

                // 班: HSK 2, source ID 304
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_level`, `hsk_source_id` FROM `vocabulary` WHERE `hanzi` = '班'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_level")).isEqualTo(2);
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(304);
                }

                // 本子: HSK 2, source ID 308, natural meaning
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_level`, `hsk_source_id`, `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '本子'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_level")).isEqualTo(2);
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(308);
                    assertThat(rs.getString("meaning_vi")).contains("Vở");
                }

                // 白: preserved as Curriculum Supplementary (hsk_level = 0, hsk_source_id IS NULL)
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_level`, `hsk_standard`, `hsk_source_id` FROM `vocabulary` WHERE `hanzi` = '白'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_level")).isZero();
                    assertThat(rs.getString("hsk_standard")).isEqualTo("Curriculum Supplementary");
                    assertThat(rs.getObject("hsk_source_id")).isNull();
                }

                // 别的, 别人, 病人: HSK 3
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_level` FROM `vocabulary` WHERE `hanzi` IN ('别的', '别人', '病人')")) {
                    int count = 0;
                    while (rs.next()) {
                        assertThat(rs.getInt("hsk_level")).isEqualTo(3);
                        count++;
                    }
                    assertThat(count).isEqualTo(3);
                }

                // 10. Verify clean Vietnamese definitions (zero dictionary scraping artifacts)
                try (ResultSet rs = stmt.executeQuery("SELECT `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '东西' AND `pinyin_raw` = 'dongxi'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("meaning_vi")).doesNotContain("Đông và tây").contains("Đồ vật");
                }

                try (ResultSet rs = stmt.executeQuery("SELECT `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '大学'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("meaning_vi")).doesNotContain("Tứ thư").contains("đại học");
                }

                try (ResultSet rs = stmt.executeQuery("SELECT `meaning_vi` FROM `vocabulary` WHERE `hanzi` = '从'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("meaning_vi")).doesNotContain("Biến thể").contains("Từ");
                }

                // 11. Verify homographs coexisting safely with distinct hsk_source_id
                // 过: 347 (level 2, verb) vs 351 (level 2, particle)
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_source_id`, `hsk_level`, `part_of_speech` FROM `vocabulary` WHERE `hanzi` = '过' ORDER BY `hsk_source_id`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(347);
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(351);
                }

                // 会: 82 (level 1, verb) vs 683 (level 3, noun)
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_source_id`, `hsk_level` FROM `vocabulary` WHERE `hanzi` = '会' ORDER BY `hsk_source_id`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(82);
                    assertThat(rs.getInt("hsk_level")).isEqualTo(1);
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(683);
                    assertThat(rs.getInt("hsk_level")).isEqualTo(3);
                }

                // 花: 357 (level 2, verb) vs 358 (level 2, noun)
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_source_id` FROM `vocabulary` WHERE `hanzi` = '花' ORDER BY `hsk_source_id`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(357);
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(358);
                }

                // 站: 486 (level 2, noun) vs 966 (level 3, verb)
                try (ResultSet rs = stmt.executeQuery("SELECT `hsk_source_id`, `hsk_level` FROM `vocabulary` WHERE `hanzi` = '站' ORDER BY `hsk_source_id`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(486);
                    assertThat(rs.getInt("hsk_level")).isEqualTo(2);
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("hsk_source_id")).isEqualTo(966);
                    assertThat(rs.getInt("hsk_level")).isEqualTo(3);
                }
            }
        }
    }

    @Nested
    @DisplayName("2. API Endpoint Unicode & Strict HSK Filter Semantics")
    class ApiFilterAndUnicodeTests {

        @Test
        @DisplayName("GIVEN GET /api/v1/vocabulary?hsk=1 WHEN requested THEN returns 200 OK with exactly 300 totalElements and authentic UTF-8")
        void testHsk1EndpointReturnsCorrectTotalAndUnicode() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/v1/vocabulary")
                            .param("page", "0")
                            .param("size", "20")
                            .param("hsk", "1")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.totalElements").value(300))
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
        @DisplayName("GIVEN GET /api/v1/vocabulary?hsk=2 WHEN requested THEN returns 200 OK with exactly 200 totalElements")
        void testHsk2EndpointReturnsCorrectTotal() throws Exception {
            mockMvc.perform(get("/api/v1/vocabulary")
                            .param("page", "0")
                            .param("size", "20")
                            .param("hsk", "2")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.totalElements").value(200));
        }

        @Test
        @DisplayName("GIVEN GET /api/v1/vocabulary?hsk=3 WHEN requested THEN returns 200 OK with exactly 500 totalElements")
        void testHsk3EndpointReturnsCorrectTotal() throws Exception {
            mockMvc.perform(get("/api/v1/vocabulary")
                            .param("page", "0")
                            .param("size", "20")
                            .param("hsk", "3")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("SUCCESS"))
                    .andExpect(jsonPath("$.data.totalElements").value(500));
        }

        @Test
        @DisplayName("GIVEN records with hsk_level IS NULL WHEN filtering by hsk=1 THEN NULL records are STRICTLY EXCLUDED")
        void testHskFilterStrictSemanticsExcludesNullHskLevel() throws Exception {
            // Create a temporary vocabulary with hsk_level = null
            Vocabulary legacyNullVocab = new Vocabulary("测试词", "cè shì cí", "ce shi ci", "Trắc Thí Từ", "Từ thử nghiệm không có HSK");
            legacyNullVocab.setHskLevel(null);
            legacyNullVocab = vocabularyRepository.save(legacyNullVocab);

            try {
                // When querying HSK 1, totalElements must remain 300 and must NOT include the null record
                MvcResult result = mockMvc.perform(get("/api/v1/vocabulary")
                                .param("hsk", "1")
                                .param("page", "0")
                                .param("size", "10")
                                .accept(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.data.totalElements").value(300))
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
