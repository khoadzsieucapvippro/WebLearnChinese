package com.elearning;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * Utility test to initialize or migrate the dedicated elearning_test_db schema to current Flyway baseline.
 */
public class TestDatabaseFlywayMigrator {

    @Test
    public void migrateTestDatabase() {
        String dbUrl = System.getProperty("test.datasource.url",
                "jdbc:mysql://localhost:3306/elearning_test_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        String dbUser = System.getProperty("test.datasource.username", "root");
        String dbPassword = System.getProperty("test.datasource.password", "");

        boolean canConnect = false;
        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
             Statement stmt = conn.createStatement()) {
            canConnect = true;

            // Ensure creator account exists in elearning_test_db so V14 doesn't fail
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
        } catch (Throwable t) {
            canConnect = false;
        }

        Assumptions.assumeTrue(canConnect, "Skipping standalone TestDatabaseFlywayMigrator because " + dbUrl + " is not reachable");

        System.out.println("Migrating test database: " + dbUrl);
        Flyway flyway = Flyway.configure()
                .dataSource(dbUrl, dbUser, dbPassword)
                .locations("classpath:db/migration")
                .encoding(java.nio.charset.StandardCharsets.UTF_8)
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .load();

        flyway.repair();
        var result = flyway.migrate();
        System.out.println("Flyway migration complete on elearning_test_db. Migrations applied: " + result.migrationsExecuted);
    }
}
