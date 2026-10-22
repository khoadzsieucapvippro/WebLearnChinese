package com.elearning;

import com.elearning.config.FlywayConfig;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the V24 rebuild against the two states that matter in production:
 * a clean V23 schema and a schema where an older V24 failed after adding some
 * columns (the TiDB clustered-primary-key failure path).
 */
@DisplayName("Flyway V24 TiDB recovery tests")
class FlywayV24RecoveryIntegrationTests {

    private static final String SCHEMA = "v24_recovery_test";

    private MySQLContainer<?> container;
    private String serverUrl;
    private String schemaUrl;

    @BeforeEach
    void setUp() throws Exception {
        Assumptions.assumeTrue(TestcontainersInitializer.DOCKER_AVAILABLE,
                "Docker/Testcontainers is not available");
        container = TestcontainersInitializer.getContainer();
        Assumptions.assumeTrue(container != null && container.isRunning(),
                "MySQL test container is not running");

        String jdbcUrl = container.getJdbcUrl();
        int queryIndex = jdbcUrl.indexOf('?');
        String query = queryIndex >= 0 ? jdbcUrl.substring(queryIndex) : "";
        serverUrl = jdbcUrl.substring(0, jdbcUrl.lastIndexOf('/')) + "/" + query;
        // Force MySQL 8's default collation (utf8mb4_0900_ai_ci) for this
        // connection. The schema is utf8mb4_unicode_ci, so without the explicit
        // COLLATE in V24 this reproduces the production "Illegal mix of
        // collations" (error 1267) on text-literal joins.
        schemaUrl = withCollation(
                jdbcUrl.substring(0, jdbcUrl.lastIndexOf('/')) + "/" + SCHEMA + query,
                "utf8mb4_0900_ai_ci");

        recreateSchema();
        createV23BaselineTables();
        seedV23Data();
    }

    @AfterEach
    void tearDown() {
        if (container == null || !container.isRunning()) {
            return;
        }
        try (Connection connection = DriverManager.getConnection(serverUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS `" + SCHEMA + "`");
        } catch (SQLException ignored) {
            // Best-effort cleanup for the isolated test schema.
        }
    }

    @Test
    @DisplayName("GIVEN a clean V23 schema WHEN V24 runs THEN data is preserved and the expanded PK is installed")
    void migratesFromCleanV23Schema() throws Exception {
        Flyway flyway = baselineAtV23();
        runV24(flyway);

        assertV24Applied();
        assertDataPreserved();
        assertExpandedPrimaryKey();
        assertForeignKeysAndIndexRestored();
    }

    @Test
    @DisplayName("GIVEN a partial V24 with a failed history row WHEN Flyway starts THEN repair and the rebuild recover safely")
    void recoversFromPartialV24AndFailedHistory() throws Exception {
        Flyway flyway = baselineAtV23();
        applyPartialV24();
        insertFailedV24HistoryRow();

        runV24(flyway);

        assertV24Applied();
        assertDataPreserved();
        assertExpandedPrimaryKey();
        assertForeignKeysAndIndexRestored();
    }

    private static String withCollation(String url, String collation) {
        String parameter = "connectionCollation=" + collation;
        if (url.matches(".*[?&]connectionCollation=[^&]*.*")) {
            return url.replaceAll("([?&])connectionCollation=[^&]*", "$1" + parameter);
        }
        return url + (url.contains("?") ? "&" : "?") + parameter;
    }

    private Flyway baselineAtV23() {
        Flyway flyway = Flyway.configure()
                .dataSource(schemaUrl, "root", container.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("23")
                .target("24")
                .validateOnMigrate(false)
                .cleanDisabled(true)
                .load();

        flyway.baseline();
        return flyway;
    }

    private void runV24(Flyway flyway) {
        new FlywayConfig().flywayMigrationStrategy().migrate(flyway);
    }

    private void recreateSchema() {
        try (Connection connection = DriverManager.getConnection(serverUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS `" + SCHEMA + "`");
            statement.execute("CREATE DATABASE `" + SCHEMA + "` "
                    + "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (SQLException e) {
            throw new IllegalStateException("Could not create isolated V24 test schema", e);
        }
    }

    private void createV23BaselineTables() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            statement.execute("""
                    CREATE TABLE `VOCABULARY` (
                        `vocab_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                        `hanzi` VARCHAR(50) NOT NULL,
                        `pinyin` VARCHAR(100) NOT NULL,
                        `pinyin_raw` VARCHAR(100) NOT NULL,
                        `meaning_han_viet` VARCHAR(100) NOT NULL,
                        `meaning_vi` VARCHAR(255) NOT NULL,
                        `hsk_source_id` INT NULL,
                        PRIMARY KEY (`vocab_id`),
                        UNIQUE KEY `uk_vocab_hanzi_pinyin_raw` (`hanzi`, `pinyin_raw`),
                        UNIQUE KEY `uk_vocab_hsk_source` (`hsk_source_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);

            statement.execute("""
                    CREATE TABLE `RADICAL` (
                        `radical_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                        `character` VARCHAR(10) NOT NULL,
                        `pinyin` VARCHAR(50) NOT NULL,
                        `meaning_han_viet` VARCHAR(100) NOT NULL,
                        `meaning_vi` VARCHAR(255) NOT NULL,
                        `explanation_vi` VARCHAR(1000) NULL,
                        `audio_url` VARCHAR(500) NULL,
                        `video_writing_url` VARCHAR(500) NULL,
                        `common_rank` TINYINT UNSIGNED NULL,
                        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (`radical_id`),
                        UNIQUE KEY `uk_radical_character` (`character`),
                        UNIQUE KEY `uk_radical_common_rank` (`common_rank`),
                        CONSTRAINT `chk_radical_common_rank`
                            CHECK (`common_rank` IS NULL OR (`common_rank` >= 1 AND `common_rank` <= 50))
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);

            statement.execute("""
                    CREATE TABLE `VOCAB_RADICAL` (
                        `vocab_id` BIGINT UNSIGNED NOT NULL,
                        `radical_id` INT UNSIGNED NOT NULL,
                        `hanzi_char` VARCHAR(10) NULL,
                        PRIMARY KEY (`vocab_id`, `radical_id`),
                        INDEX `idx_vocab_radical_hanzi_char` (`hanzi_char`),
                        CONSTRAINT `fk_vocab_radical_vocab` FOREIGN KEY (`vocab_id`)
                            REFERENCES `VOCABULARY` (`vocab_id`) ON DELETE CASCADE ON UPDATE CASCADE,
                        CONSTRAINT `fk_vocab_radical_radical` FOREIGN KEY (`radical_id`)
                            REFERENCES `RADICAL` (`radical_id`) ON DELETE RESTRICT ON UPDATE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """);
        }
    }

    private void seedV23Data() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            statement.execute("""
                    INSERT INTO `RADICAL`
                        (`radical_id`, `character`, `pinyin`, `meaning_han_viet`, `meaning_vi`,
                         `explanation_vi`, `common_rank`)
                    VALUES
                        (1, '一', 'yī', 'Nhất', 'Một', 'Nét ngang', 1),
                        (30, '口', 'kǒu', 'Khẩu', 'Miệng', 'Miệng', 2),
                        (85, '水', 'shuǐ', 'Thủy', 'Nước', 'Nước', 3),
                        (214, '龠', 'yuè', 'Dược', 'Sáo', 'Sáo', NULL)
                    """);

            statement.execute("""
                    INSERT INTO `VOCABULARY`
                        (`vocab_id`, `hanzi`, `pinyin`, `pinyin_raw`, `meaning_han_viet`,
                         `meaning_vi`, `hsk_source_id`)
                    VALUES
                        (1, '打', 'dǎ', 'da', 'Đả', 'Đánh', 9001),
                        (2, '爸爸', 'bàba', 'baba', 'Ba Ba', 'Bố', 9002),
                        (3, '江河', 'jiānghé', 'jianghe', 'Giang Hà', 'Sông ngòi', 9003)
                    """);

            statement.execute("""
                    INSERT INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`)
                    VALUES
                        (1, 1, '打'),
                        (2, 30, '爸'),
                        (3, 85, '江')
                    """);
        }
    }

    private void applyPartialV24() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            // These are exactly the statements an older V24 completed before it
            // hit TiDB's "Unsupported drop primary key ... clustered index".
            statement.execute("ALTER TABLE `RADICAL` "
                    + "ADD COLUMN `stroke_count` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `meaning_vi`");
            statement.execute("ALTER TABLE `VOCAB_RADICAL` "
                    + "MODIFY COLUMN `hanzi_char` VARCHAR(10) NOT NULL DEFAULT ''");
            statement.execute("ALTER TABLE `VOCAB_RADICAL` "
                    + "ADD COLUMN `component_type` VARCHAR(50) NOT NULL DEFAULT 'kangxi_radical' AFTER `hanzi_char`");
            statement.execute("ALTER TABLE `VOCAB_RADICAL` "
                    + "ADD COLUMN `verification_status` VARCHAR(50) NOT NULL DEFAULT 'verified' AFTER `component_type`");
        }
    }

    private void insertFailedV24HistoryRow() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("""
                    INSERT INTO `flyway_schema_history`
                        (`installed_rank`, `version`, `description`, `type`, `script`,
                         `checksum`, `installed_by`, `execution_time`, `success`)
                    VALUES
                        (2, '24', 'add radical stroke count and expand vocab radical pk', 'SQL',
                         'V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql',
                         NULL, 'test', 0, 0)
                    """);
        }
    }

    private void assertV24Applied() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT `success` FROM `flyway_schema_history` WHERE `version` = '24'")) {
            assertThat(resultSet.next()).isTrue();
            assertThat(resultSet.getInt(1)).isEqualTo(1);
        }
    }

    private void assertDataPreserved() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM `VOCAB_RADICAL`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(3);
            }

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT `hanzi_char` FROM `VOCAB_RADICAL` WHERE `vocab_id` = 2 AND `radical_id` = 30")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getString(1)).isEqualTo("爸");
            }

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT `stroke_count` FROM `RADICAL` WHERE `radical_id` IN (1, 30, 85, 214) "
                            + "ORDER BY `radical_id`")) {
                List<Integer> counts = new ArrayList<>();
                while (resultSet.next()) {
                    counts.add(resultSet.getInt(1));
                }
                assertThat(counts).containsExactly(1, 3, 4, 17);
            }
        }
    }

    private void assertExpandedPrimaryKey() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            List<String> primaryKeyColumns = new ArrayList<>();
            try (ResultSet resultSet = statement.executeQuery("""
                    SELECT `column_name`
                    FROM `information_schema`.`statistics`
                    WHERE `table_schema` = DATABASE()
                      AND `table_name` = 'VOCAB_RADICAL'
                      AND `index_name` = 'PRIMARY'
                    ORDER BY `seq_in_index`
                    """)) {
                while (resultSet.next()) {
                    primaryKeyColumns.add(resultSet.getString(1));
                }
            }
            assertThat(primaryKeyColumns).containsExactly("vocab_id", "radical_id", "hanzi_char");

            // Same vocab + same radical + a different hanzi_char must now be allowed.
            statement.execute("INSERT INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`, `hanzi_char`) "
                    + "VALUES (3, 85, '河')");
            try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM `VOCAB_RADICAL`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(4);
            }
        }
    }

    private void assertForeignKeysAndIndexRestored() throws SQLException {
        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            try (ResultSet resultSet = statement.executeQuery("""
                    SELECT COUNT(*)
                    FROM `information_schema`.`table_constraints`
                    WHERE `table_schema` = DATABASE()
                      AND `table_name` = 'VOCAB_RADICAL'
                      AND `constraint_type` = 'FOREIGN KEY'
                    """)) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(2);
            }

            try (ResultSet resultSet = statement.executeQuery("""
                    SELECT COUNT(*)
                    FROM `information_schema`.`statistics`
                    WHERE `table_schema` = DATABASE()
                      AND `table_name` = 'VOCAB_RADICAL'
                      AND `index_name` = 'idx_vocab_radical_hanzi_char'
                    """)) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(1);
            }
        }
    }
}
