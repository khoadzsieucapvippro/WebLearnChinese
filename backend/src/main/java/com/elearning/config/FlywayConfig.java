package com.elearning.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Custom Flyway migration strategy to ensure zero-downtime self-healing
 * on cloud databases (such as TiDB Cloud Serverless Starter).
 * 
 * Automatically runs flyway.repair() prior to flyway.migrate() to remove
 * any transient failed migration records from flyway_schema_history table
 * and re-align checksums without requiring manual SQL console interventions.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            try {
                log.info("Executing Flyway self-healing repair before migration...");
                flyway.repair();
                log.info("Flyway self-healing repair completed successfully.");
            } catch (Exception e) {
                log.warn("Flyway self-healing repair encountered non-fatal notice: {}", e.getMessage());
            }
            log.info("Executing Flyway database migration...");
            flyway.migrate();
            log.info("Flyway database migration completed successfully.");
        };
    }
}
