---
name: project-constraints
description: Non-negotiable technology and data boundaries for this repository.
---

# Project Constraints

## Fixed stack

- Frontend: semantic HTML, CSS, native ES modules, zero-build Vanilla JS. Bootstrap CDN is an existing supporting dependency; do not introduce React, Vue, Angular, Next.js, or a bundler.
- Backend: Java 21, Spring Boot 3.3.5, Spring MVC, Spring Security 6, JJWT, Spring Data JPA/Hibernate, Maven.
- Data: MySQL 8.4 and Flyway. Apache POI is the existing Excel parser.

## Hard boundaries

- Keep `ddl-auto: none`; Flyway is the only schema change mechanism.
- Never edit or renumber an applied migration. Add a new versioned migration for a schema change.
- Never hardcode JWT secrets, database passwords, credentials, or machine-specific storage paths.
- Keep request/response DTO boundaries; do not expose JPA entities as public API contracts.
- Preserve existing API behavior unless the task explicitly changes the contract and all consumers are updated.
- Keep the Chinese learning domain and SRS behavior intact.

