package com.elearning;

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
 * Runs the complete V1..V29 chain on a brand-new MySQL schema.
 *
 * <p>This is the regression test for the V24 rebuild: the migration must work
 * when it is reached from a real V23 schema, not only from the synthetic schema
 * used by the focused recovery tests.</p>
 */
@DisplayName("Flyway full migration chain tests")
class FlywayFullChainIntegrationTests {

    private static final String SCHEMA = "v24_full_chain_test";

    private MySQLContainer<?> container;
    private String serverUrl;
    private String schemaUrl;

    @BeforeEach
    void setUp() {
        Assumptions.assumeTrue(TestcontainersInitializer.DOCKER_AVAILABLE,
                "Docker/Testcontainers is not available");
        container = TestcontainersInitializer.getContainer();
        Assumptions.assumeTrue(container != null && container.isRunning(),
                "MySQL test container is not running");

        String jdbcUrl = container.getJdbcUrl();
        int queryIndex = jdbcUrl.indexOf('?');
        String query = queryIndex >= 0 ? jdbcUrl.substring(queryIndex) : "";
        serverUrl = jdbcUrl.substring(0, jdbcUrl.lastIndexOf('/')) + "/" + query;
        schemaUrl = jdbcUrl.substring(0, jdbcUrl.lastIndexOf('/')) + "/" + SCHEMA + query;

        try (Connection connection = DriverManager.getConnection(serverUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS `" + SCHEMA + "`");
            statement.execute("CREATE DATABASE `" + SCHEMA + "` "
                    + "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (SQLException e) {
            throw new IllegalStateException("Could not create isolated full-chain test schema", e);
        }
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
    @DisplayName("GIVEN an empty database WHEN all migrations run THEN V24 rebuild preserves seed data and final schema")
    void appliesCompleteMigrationChain() throws SQLException {
        Flyway flyway = Flyway.configure()
                .dataSource(schemaUrl, "root", container.getPassword())
                .locations("classpath:db/migration")
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .load();

        flyway.migrate();

        try (Connection connection = DriverManager.getConnection(schemaUrl, "root", container.getPassword());
             Statement statement = connection.createStatement()) {

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM `flyway_schema_history` WHERE `success` = 1")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isGreaterThanOrEqualTo(29);
            }

            try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM `role`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(4);
            }

            try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM `radical`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(214);
            }

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM `radical` WHERE `stroke_count` BETWEEN 1 AND 17")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(214);
            }

            try (ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM `vocabulary`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isGreaterThanOrEqualTo(1000);
            }

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM `account` WHERE `email_or_phone` = 'creator@test.com'")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isEqualTo(1);
            }

            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT COUNT(*) FROM `management_audit_log`")) {
                assertThat(resultSet.next()).isTrue();
                assertThat(resultSet.getInt(1)).isZero();
            }

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
        }
    }
}
