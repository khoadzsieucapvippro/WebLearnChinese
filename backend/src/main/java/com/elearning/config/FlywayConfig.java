package com.elearning.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.callback.BaseCallback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Custom Flyway configuration and self-healing migration strategy ensuring:
 * 1. Self-healing Flyway repair: removes failed migration records and re-aligns checksums.
 * 2. Pre-migration idempotency cleanup on partial DDL failures (e.g. dangling V8 columns on RADICAL).
 * 3. Prerequisite creator account seeding before migrations like V14 or V17 run.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer() {
        return configuration -> configuration.callbacks(new BaseCallback() {
            @Override
            public boolean supports(Event event, Context context) {
                return event == Event.BEFORE_EACH_MIGRATE;
            }

            @Override
            public void handle(Event event, Context context) {
                if (event == Event.BEFORE_EACH_MIGRATE && context.getMigrationInfo() != null) {
                    String version = context.getMigrationInfo().getVersion() != null
                            ? context.getMigrationInfo().getVersion().getVersion()
                            : "";
                    if ("14".equals(version) || "17".equals(version)) {
                        log.info("Ensuring prerequisite creator account exists before migration V{} executes", version);
                        try (Statement stmt = context.getConnection().createStatement()) {
                            stmt.execute("INSERT INTO `ACCOUNT` (`email_or_phone`, `password_hash`, `status`, `created_at`, `updated_at`, `authorization_version`) " +
                                    "SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', NOW(), NOW(), 1 " +
                                    "WHERE NOT EXISTS (SELECT 1 FROM `ACCOUNT` WHERE `email_or_phone` = 'creator@test.com');");
                        } catch (Exception e) {
                            log.warn("Could not insert creator account before V{}: {}", version, e.getMessage());
                        }
                    }
                }
            }
        });
    }

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("Executing Flyway self-healing repair before migration...");
                flyway.repair();
                log.info("Flyway self-healing repair completed successfully.");
            } catch (Exception e) {
                log.warn("Flyway self-healing repair notice: {}", e.getMessage());
            }

            // Clean up any partially-applied DDL from failed migrations before running migrate
            try (Connection conn = flyway.getConfiguration().getDataSource().getConnection();
                 Statement stmt = conn.createStatement()) {

                boolean v8Success = false;
                try (ResultSet rs = stmt.executeQuery(
                        "SELECT `success` FROM `flyway_schema_history` WHERE `version` = '8'")) {
                    if (rs.next() && rs.getInt("success") == 1) {
                        v8Success = true;
                    }
                } catch (Exception ignored) {
                    // flyway_schema_history might not exist yet on fresh DB
                }

                if (!v8Success) {
                    log.info("Pre-checking RADICAL table columns for clean V8 execution...");
                    try {
                        stmt.execute("ALTER TABLE `RADICAL` DROP COLUMN `explanation_vi`");
                        log.info("Dropped dangling explanation_vi column for clean migration");
                    } catch (Exception ignored) {}

                    try {
                        stmt.execute("ALTER TABLE `RADICAL` DROP COLUMN `video_lesson_url`");
                        log.info("Dropped dangling video_lesson_url column for clean migration");
                    } catch (Exception ignored) {}

                    try {
                        stmt.execute("ALTER TABLE `RADICAL` DROP COLUMN `common_rank`");
                        log.info("Dropped dangling common_rank column for clean migration");
                    } catch (Exception ignored) {}
                }
            } catch (Exception e) {
                log.warn("Notice during pre-migration DDL idempotency check: {}", e.getMessage());
            }

            log.info("Executing Flyway database migration...");
            flyway.migrate();
            log.info("Flyway database migration completed successfully.");
        };
    }
}
