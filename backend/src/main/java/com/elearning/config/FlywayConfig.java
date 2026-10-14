package com.elearning.config;

import org.flywaydb.core.api.callback.BaseCallback;
import org.flywaydb.core.api.callback.Context;
import org.flywaydb.core.api.callback.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Statement;

/**
 * Custom Flyway configuration ensuring required prerequisite data
 * (such as system/creator account) is seeded before migrations like V14 or V17 run.
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
                            stmt.execute("INSERT INTO `account` (`email_or_phone`, `password_hash`, `status`, `created_at`, `updated_at`, `authorization_version`) " +
                                    "SELECT 'creator@test.com', '$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm', 'Active', NOW(), NOW(), 1 " +
                                    "WHERE NOT EXISTS (SELECT 1 FROM `account` WHERE `email_or_phone` = 'creator@test.com');");
                        } catch (Exception e) {
                            log.warn("Could not insert creator account before V{}: {}", version, e.getMessage());
                        }
                    }
                }
            }
        });
    }
}
