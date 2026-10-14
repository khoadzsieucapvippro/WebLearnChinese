# Project Agent Guidance

This directory contains only project-specific guidance for Codex. Executable source, tests, migrations, and current runtime behavior take precedence over these notes.

## Start Here

1. Read [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md).
2. Load the skill matching the task from `.agents/skills/`.
3. Inspect the relevant Java controller/DTO, frontend module, test, or migration before making claims.
4. Verify with the narrowest meaningful command, then report exact evidence.

## Skills

- `project-orientation`: repository map, authority order, and safe discovery.
- `frontend-vanilla`: HTML/CSS/Vanilla JS, DOM safety, accessibility, and page lifecycle.
- `frontend-verification`: the existing test tiers plus official Playwright CLI usage.
- `backend-contract-verification`: Spring controllers, DTOs, response envelopes, and frontend contract checks.
- `database-flyway-mysql`: Flyway and MySQL schema change boundaries.
- `srs-domain`: SRS/SM-2 behavior and persistence invariants.
- `security-review`: focused security review and optional Strix integration.
- `using-agent-skills`: routing and precedence for the skills above.

External tools are documented in [TOOLING.md](TOOLING.md). Their documentation is not copied into this repository.
