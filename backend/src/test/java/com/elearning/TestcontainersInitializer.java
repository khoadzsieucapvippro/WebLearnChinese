package com.elearning;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.testcontainers.containers.MySQLContainer;

import java.util.Map;

/**
 * Global Testcontainers ApplicationContextInitializer.
 * <p>
 * Starts a singleton MySQL 8.4 container once for all Spring Boot integration tests
 * and dynamically injects connection parameters into the Spring Environment.
 */
public class TestcontainersInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    public static final MySQLContainer<?> MYSQL_CONTAINER;
    public static final boolean DOCKER_AVAILABLE;

    static {
        MySQLContainer<?> container = null;
        boolean dockerOk = false;
        try {
            if ("false".equalsIgnoreCase(System.getProperty("testcontainers.enabled"))
                    || "false".equalsIgnoreCase(System.getenv("TESTCONTAINERS_ENABLED"))) {
                throw new IllegalStateException("Testcontainers explicitly disabled by property or environment variable");
            }
            // Ensure Docker API version compatibility with modern Docker Engine (26+, 28+, 29+) on Windows
            if (System.getProperty("api.version") == null) {
                System.setProperty("api.version", "1.44");
            }
            if (System.getProperty("DOCKER_API_VERSION") == null) {
                System.setProperty("DOCKER_API_VERSION", "1.44");
            }

            container = new MySQLContainer<>("mysql:8.4.0")
                    .withDatabaseName("elearning_test")
                    .withUsername("test")
                    .withPassword("test")
                    .withCommand("--lower-case-table-names=1")
                    .withReuse(true);

            container.start();
            dockerOk = true;
        } catch (Throwable t) {
            dockerOk = false;
            container = null;
        }
        MYSQL_CONTAINER = container;
        DOCKER_AVAILABLE = dockerOk;
    }

    public static final String FORBIDDEN_DEV_DB = "elearning_db";
    public static final String SAFE_TEST_DB = "elearning_test";

    /**
     * Fail-fast safety guard: Integration tests must NEVER target the development/runtime database 'elearning_db'.
     * Any attempt to do so immediately throws an IllegalStateException before Flyway or any bean can run.
     *
     * @param jdbcUrl The target JDBC URL
     * @throws IllegalStateException if the database is unsafe
     */
    public static void validateTestDatabaseSafety(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            throw new IllegalStateException("CRITICAL SAFETY GUARD VIOLATION: Test database JDBC URL is empty or null!");
        }

        String cleanUrl = jdbcUrl.toLowerCase();
        int queryParamIndex = cleanUrl.indexOf('?');
        if (queryParamIndex != -1) {
            cleanUrl = cleanUrl.substring(0, queryParamIndex);
        }

        if (cleanUrl.endsWith("/" + FORBIDDEN_DEV_DB) || cleanUrl.contains("/" + FORBIDDEN_DEV_DB + "/")) {
            throw new IllegalStateException(
                    "CRITICAL SAFETY GUARD VIOLATION: Integration tests MUST NOT target development/runtime database '"
                            + FORBIDDEN_DEV_DB + "'! Target URL was: " + jdbcUrl
            );
        }

        String dbName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1).trim();
        if (!dbName.contains("test")) {
            throw new IllegalStateException(
                    "CRITICAL SAFETY GUARD VIOLATION: Integration tests must target an isolated test database containing 'test' (e.g., '"
                            + SAFE_TEST_DB + "'). Target database was: '" + dbName + "' in URL: " + jdbcUrl
            );
        }
    }

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        if (DOCKER_AVAILABLE && MYSQL_CONTAINER != null && MYSQL_CONTAINER.isRunning()) {
            String containerUrl = MYSQL_CONTAINER.getJdbcUrl();
            validateTestDatabaseSafety(containerUrl);

            Map<String, Object> properties = Map.of(
                    "spring.datasource.url", containerUrl,
                    "spring.datasource.username", MYSQL_CONTAINER.getUsername(),
                    "spring.datasource.password", MYSQL_CONTAINER.getPassword(),
                    "spring.datasource.driver-class-name", MYSQL_CONTAINER.getDriverClassName()
            );
            applicationContext.getEnvironment().getPropertySources()
                    .addFirst(new MapPropertySource("testcontainers-properties", properties));
        } else {
            // Graceful fallback to local running MySQL Community Server (port 3306)
            String fallbackUrl = System.getenv("SPRING_DATASOURCE_URL");
            if (fallbackUrl == null || fallbackUrl.isBlank()) {
                fallbackUrl = "jdbc:mysql://localhost:3306/" + SAFE_TEST_DB + "?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            }

            // CRITICAL: Fail-fast guard against development database targeting
            validateTestDatabaseSafety(fallbackUrl);

            String fallbackUser = System.getenv("SPRING_DATASOURCE_USERNAME");
            if (fallbackUser == null || fallbackUser.isBlank()) {
                fallbackUser = "root";
            }
            String fallbackPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
            if (fallbackPass == null) {
                fallbackPass = "";
            }

            ensureTestDatabasePrerequisites(fallbackUrl, fallbackUser, fallbackPass);

            Map<String, Object> properties = Map.of(
                    "spring.datasource.url", fallbackUrl,
                    "spring.datasource.username", fallbackUser,
                    "spring.datasource.password", fallbackPass,
                    "spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver"
            );
            applicationContext.getEnvironment().getPropertySources()
                    .addFirst(new MapPropertySource("local-mysql-fallback-properties", properties));
        }
    }

    private static void ensureTestDatabasePrerequisites(String url, String user, String pass) {
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, user, pass);
             java.sql.Statement stmt = conn.createStatement()) {
            // Ensure creator account exists in elearning_test so V14 doesn't fail on fresh test schema
            stmt.execute("CREATE TABLE IF NOT EXISTS `account` (" +
                    "`account_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                    "`email_or_phone` VARCHAR(100) NOT NULL UNIQUE," +
                    "`password_hash` VARCHAR(255) NOT NULL," +
                    "`status` VARCHAR(20) NOT NULL DEFAULT 'Active'," +
                    "`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," +
                    "`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                    "`authorization_version` BIGINT NOT NULL DEFAULT 1" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            stmt.execute("INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `created_at`, `updated_at`, `authorization_version`) " +
                    "SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', NOW(), NOW(), 1 " +
                    "WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'creator@test.com');");
        } catch (Throwable ignored) {
            // If tables are not ready or handled by Flyway, continue
        }
    }

    public static MySQLContainer<?> getContainer() {
        return MYSQL_CONTAINER;
    }
}
