package com.elearning.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Flyway migration strategy.
 *
 * <p>This configuration deliberately does <strong>not</strong> run
 * {@code flyway.repair()} on every startup. Repair only updates
 * {@code flyway_schema_history}; it cannot roll back DDL that was already
 * applied. Running repair unconditionally after a failed migration therefore
 * makes the next startup rerun the same migration from the beginning, which
 * commonly fails with "duplicate column" or "duplicate table" errors.</p>
 *
 * <p>Repair is invoked only when Flyway reports a FAILED migration and the
 * partial schema state has a known, idempotent recovery path:</p>
 * <ul>
 *   <li><b>V8</b>: drop the nullable learning columns that may have been added
 *       before the failure, so V8 can run again.</li>
 *   <li><b>V24</b>: the migration copies data into new tables and swaps them
 *       atomically, so it can safely run from a clean V23 schema or from any
 *       partially applied V24 state.</li>
 * </ul>
 * <p>Any other failed migration aborts startup with an explicit message
 * instead of silently mutating production schema.</p>
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            List<MigrationInfo> failed = failedMigrations(flyway);

            if (!failed.isEmpty()) {
                for (MigrationInfo info : failed) {
                    String version = versionOf(info);
                    log.error("Flyway found FAILED migration V{} ({}). "
                                    + "Partially applied DDL may already exist in the database.",
                            version, info.getDescription());

                    if ("8".equals(version)) {
                        cleanupPartialV8(flyway);
                    } else if ("24".equals(version)) {
                        logV24State(flyway);
                    } else if (isRestartableDmlMigration(version)) {
                        log.info("V{} consists of deterministic UPDATE/DELETE and INSERT IGNORE statements; "
                                + "rerunning it from the beginning is safe.", version);
                    } else {
                        throw new IllegalStateException(
                                "Flyway migration V" + version + " failed and has no automatic recovery path. "
                                        + "Take a database backup, inspect the schema and "
                                        + "flyway_schema_history, then run 'flyway repair' manually. "
                                        + "Refusing to modify the production schema automatically.");
                    }
                }

                log.warn("Repairing flyway_schema_history for known failed migration(s): {}. "
                                + "The affected migrations are idempotent and will rebuild their schema.",
                        failed.stream().map(FlywayConfig::versionOf).toList());
                flyway.repair();
                log.info("Flyway repair completed. Resuming migrations from the failed version.");
            }

            log.info("Executing Flyway database migration...");
            flyway.migrate();
            log.info("Flyway database migration completed successfully.");
        };
    }

    private static List<MigrationInfo> failedMigrations(Flyway flyway) {
        List<MigrationInfo> failed = new ArrayList<>();
        for (MigrationInfo info : flyway.info().all()) {
            if (info.getState() == MigrationState.FAILED) {
                failed.add(info);
            }
        }
        return failed;
    }

    private static String versionOf(MigrationInfo info) {
        return info.getVersion() != null ? info.getVersion().getVersion() : "?";
    }

    /**
     * V25..V28 only apply deterministic UPDATE/DELETE statements and
     * INSERT IGNORE statements. Rerunning them after a failure is therefore
     * safe and converges on the same data.
     */
    private static boolean isRestartableDmlMigration(String version) {
        return "25".equals(version) || "26".equals(version)
                || "27".equals(version) || "28".equals(version);
    }

    /**
     * V8 adds nullable columns and two constraints. If it failed halfway, those
     * objects must be removed before the version can run again. The columns are
     * nullable learning metadata and are not populated until V9, which never ran
     * after a failed V8.
     */
    private void cleanupPartialV8(Flyway flyway) {
        log.warn("V8 failed previously; removing its partially applied columns before rerunning V8.");
        try (Connection connection = flyway.getConfiguration().getDataSource().getConnection();
             Statement statement = connection.createStatement()) {

            executeIgnoringFailure(statement,
                    "ALTER TABLE `RADICAL` DROP CHECK `chk_radical_common_rank`",
                    "check constraint chk_radical_common_rank");
            executeIgnoringFailure(statement,
                    "ALTER TABLE `RADICAL` DROP INDEX `uk_radical_common_rank`",
                    "unique index uk_radical_common_rank");
            executeIgnoringFailure(statement,
                    "ALTER TABLE `RADICAL` DROP COLUMN `common_rank`",
                    "column common_rank");
            executeIgnoringFailure(statement,
                    "ALTER TABLE `RADICAL` DROP COLUMN `video_lesson_url`",
                    "column video_lesson_url");
            executeIgnoringFailure(statement,
                    "ALTER TABLE `RADICAL` DROP COLUMN `explanation_vi`",
                    "column explanation_vi");
        } catch (SQLException e) {
            throw new IllegalStateException("Could not clean up the partial V8 schema safely", e);
        }
    }

    private void executeIgnoringFailure(Statement statement, String sql, String label) {
        try {
            statement.execute(sql);
            log.info("V8 recovery: removed {}", label);
        } catch (SQLException e) {
            // The object was never created, or was already removed by an earlier
            // recovery attempt. This is expected for a fresh/clean partial state.
            log.debug("V8 recovery: {} is not present ({})", label, e.getMessage());
        }
    }

    /**
     * Logs the real V24 schema state before repair. This is intentionally
     * read-only; the rebuilt V24 migration handles both clean and partial
     * schemas. The log is evidence for operators and for future incidents.
     */
    private void logV24State(Flyway flyway) {
        try (Connection connection = flyway.getConfiguration().getDataSource().getConnection()) {
            log.warn("V24 recovery state: RADICAL.stroke_count={}, "
                            + "VOCAB_RADICAL.component_type={}, VOCAB_RADICAL.verification_status={}, "
                            + "VOCAB_RADICAL primary key={}",
                    columnExists(connection, "RADICAL", "stroke_count"),
                    columnExists(connection, "VOCAB_RADICAL", "component_type"),
                    columnExists(connection, "VOCAB_RADICAL", "verification_status"),
                    primaryKeyColumns(connection, "VOCAB_RADICAL"));
            log.warn("V24 is a restartable CREATE + atomic RENAME rebuild; both the clean V23 "
                    + "schema and the partially applied V24 schema are supported.");
        } catch (SQLException e) {
            log.warn("V24 recovery: could not inspect the current schema ({})", e.getMessage());
        }
    }

    private boolean columnExists(Connection connection, String tableName, String columnName)
            throws SQLException {
        String sql = "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, tableName);
            statement.setString(2, columnName);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next() && resultSet.getInt(1) > 0;
            }
        }
    }

    private List<String> primaryKeyColumns(Connection connection, String tableName)
            throws SQLException {
        String sql = "SELECT column_name FROM information_schema.statistics "
                + "WHERE table_schema = DATABASE() AND table_name = ? AND index_name = 'PRIMARY' "
                + "ORDER BY seq_in_index";
        List<String> columns = new ArrayList<>();
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, tableName);
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    columns.add(resultSet.getString(1));
                }
            }
        }
        return columns;
    }
}
