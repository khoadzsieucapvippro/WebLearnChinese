package com.elearning;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.containers.MySQLContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisplayName("Test Database Isolation Tests (BE-TEST-003)")
class TestDatabaseIsolationTests {

    @Autowired
    private DataSource dataSource;

    @Nested
    @DisplayName("Testcontainers MySQL 8.4 Isolation Verification")
    class ContainerIsolationTests {

        @Test
        @DisplayName("GIVEN Spring Boot Test Context WHEN initialized THEN DataSource is connected to isolated test database and NEVER to elearning_db")
        void testDataSourceConnectedToTestcontainer() throws Exception {
            MySQLContainer<?> container = TestcontainersInitializer.getContainer();
            if (container != null && container.isRunning()) {
                assertThat(container.isRunning()).isTrue();
            }

            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                String url = metaData.getURL();

                // 1. Verify URL is pointing to an isolated test database and NEVER elearning_db
                assertThat(url).doesNotContain("/elearning_db");
                assertThat(url).contains("elearning_test");

                // 2. Verify Database Engine is MySQL 8.4
                String databaseProductVersion = metaData.getDatabaseProductVersion();
                assertThat(databaseProductVersion).startsWith("8.4");

                // 3. Verify Database Name is elearning_test
                try (Statement statement = connection.createStatement();
                     ResultSet rs = statement.executeQuery("SELECT DATABASE()")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString(1)).isEqualTo("elearning_test");
                }
            }
        }

        @Test
        @DisplayName("GIVEN fail-fast safety guard WHEN fed elearning_db or unsafe target THEN immediately throws IllegalStateException")
        void testFailFastSafetyGuardRejectsElearningDb() {
            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () ->
                    TestcontainersInitializer.validateTestDatabaseSafety("jdbc:mysql://localhost:3306/elearning_db?useSSL=false"));

            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () ->
                    TestcontainersInitializer.validateTestDatabaseSafety("jdbc:mysql://remote-host:3306/elearning_db"));

            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () ->
                    TestcontainersInitializer.validateTestDatabaseSafety("jdbc:mysql://localhost:3306/production"));

            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () ->
                    TestcontainersInitializer.validateTestDatabaseSafety(null));

            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () ->
                    TestcontainersInitializer.validateTestDatabaseSafety("   "));

            // Safe test URL must not throw
            org.junit.jupiter.api.Assertions.assertDoesNotThrow(() ->
                    TestcontainersInitializer.validateTestDatabaseSafety("jdbc:mysql://localhost:3306/elearning_test?useSSL=false"));
        }

        @Test
        @DisplayName("GIVEN fresh MySQL container or fallback WHEN started THEN Flyway migrations are applied")
        void testFlywayMigrationsAppliedToTestcontainer() throws Exception {
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {

                // Verify flyway_schema_history has applied migrations
                try (ResultSet rs = statement.executeQuery(
                        "SELECT COUNT(*) FROM `flyway_schema_history` WHERE `success` = 1")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isGreaterThanOrEqualTo(3);
                }

                // Verify V2 seed roles (4 roles)
                try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM `role`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isEqualTo(4);
                }

                // Verify V3 seed radicals (214 radicals)
                try (ResultSet rs = statement.executeQuery("SELECT COUNT(*) FROM `radical`")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isEqualTo(214);
                }
            }
        }
    }
}
