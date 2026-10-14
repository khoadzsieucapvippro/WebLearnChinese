---
name: srs-domain
description: Implement or review the project's spaced-repetition behavior, card progress, review logs, and study settings.
---

# SRS Domain

Read `SrsController`, `SrsService`, `service/srs`, the SRS entities/repositories, migrations, frontend SRS page modules, and matching tests before changing behavior.

- Ratings are the backend-defined values 1 through 4; do not infer alternative scales.
- Card identity is scoped to the authenticated user and item type/id (`VOCABULARY` or `RADICAL`).
- Do not accept user identity from client payloads or query parameters.
- Preserve transaction, concurrency, timezone, due-card, new-card, review-log, and daily-limit behavior proven by tests.
- Do not fabricate statistics or cards in the frontend when the backend returns no data.

Use focused SRS unit/integration/concurrency/timezone tests plus frontend SRS unit/browser tests for UI changes. Treat historical test totals as non-authoritative until rerun.
