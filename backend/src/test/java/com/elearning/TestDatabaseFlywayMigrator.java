package com.elearning;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

/**
 * Utility test to initialize or migrate the dedicated elearning_test_db schema to current Flyway baseline.
 */
public class TestDatabaseFlywayMigrator {

    @Test
    public void migrateTestDatabase() {
        String dbUrl = System.getProperty("test.datasource.url",
                "jdbc:mysql://localhost:3306/elearning_test_db?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        String dbUser = System.getProperty("test.datasource.username", "root");
        String dbPassword = System.getProperty("test.datasource.password", "");

        System.out.println("Migrating test database: " + dbUrl);
        Flyway flyway = Flyway.configure()
                .dataSource(dbUrl, dbUser, dbPassword)
                .locations("classpath:db/migration")
                .baselineOnMigrate(false)
                .load();

        var result = flyway.migrate();
        System.out.println("Flyway migration complete on elearning_test_db. Migrations applied: " + result.migrationsExecuted);
    }
}
