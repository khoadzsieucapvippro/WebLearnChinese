# Source Of Truth

## Authority Order

1. The current user request.
2. Executable Java, JavaScript, HTML, CSS, and configuration in the repository.
3. Tests and test fixtures that exercise the current behavior.
4. Applied Flyway migrations and their current order.
5. These `.agents` instructions.
6. Historical project notes.

When documentation conflicts with source, preserve the source behavior, report the discrepancy, and update only the relevant guidance.

## Repository Map

- `backend/`: Java 21 Spring Boot 3.3.5 REST API, Spring Security/JWT, JPA/Hibernate, MySQL, Flyway, Apache POI.
- `frontend/`: zero-build semantic HTML, CSS, and native ES modules. `frontend/js/api/api.js` is the HTTP boundary; `frontend/js/auth/auth-state.js` owns client session state.
- `tests/frontend/`: static, unit, browser, accessibility, and integration verification orchestrated by `runner.mjs`.
- `tests/fullstack/`: backend plus browser scenarios.
- `tests/postman/`: Postman Collection v2.1 (comprehensive 11-module suite), environment, fixtures, and Newman runner.
- `backend/src/main/resources/db/migration/`: ordered schema and seed history. Current repository baseline is V1 through V19; never rewrite an applied migration.

## Hard Invariants

- Keep the current Vanilla JS and Spring Boot stack; do not introduce a frontend framework or production npm runtime dependency.
- `spring.jpa.hibernate.ddl-auto` remains `none`; schema changes go through a new Flyway migration.
- Do not expose JPA entities as public API DTOs.
- Backend identity comes from the authenticated security context, never from a client-supplied user/account id.
- Frontend role checks are UX only. Backend authorization is authoritative. JSON roles are `Admin`, `Creator`, `Moderator`, and `Learner` without the Spring `ROLE_` prefix.
- Page modules call `apiClient`; do not add direct `window.fetch()` calls to page controllers.
- Dynamic data is rendered with safe DOM APIs and text content. Do not interpolate untrusted values into `innerHTML`, `outerHTML`, or inline handlers.
- Do not log secrets, passwords, or raw JWTs.
- Treat `localStorage` as untrusted convenience storage. The backend validates JWT issuer, expiry, and `auth_ver` authorization version.

## Verification Baseline

Use the commands in `package.json`, `tests/frontend/README.md`, and `backend/pom.xml`. Do not repeat historical PASS counts from old `.agents` documents as current evidence; run the relevant command and report its result.
