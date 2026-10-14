---
name: database-flyway-mysql
description: Change or review MySQL schema and persistence safely through the repository's Flyway and JPA boundaries.
---

# Database And Flyway

Read the current migrations, affected entity, repository, and persistence tests before changing data behavior.

- `backend/src/main/resources/db/migration/` is ordered history. Do not edit or renumber an applied migration.
- Add one new versioned migration for a schema change; keep DDL explicit and compatible with MySQL 8.4/utf8mb4.
- Keep `spring.jpa.hibernate.ddl-auto: none`; Hibernate must not create or update schema.
- Separate schema/seed history from runtime CRUD. Do not put user/content mutations in migrations.
- Check indexes, foreign keys, nullability, uniqueness, transaction behavior, and entity mappings together.
- Never commit database dumps, credentials, generated `target/` output, or local data.

Run focused persistence tests, Flyway startup/integration coverage, and relevant API tests when available. If MySQL/Testcontainers is unavailable, report the exact unverified layer.
