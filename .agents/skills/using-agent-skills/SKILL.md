---
name: using-agent-skills
description: Route repository tasks to the smallest applicable project skill and keep source evidence authoritative.
---

# Skill Routing

Load `project-orientation` first when the repository or authority is unclear. Otherwise load only the smallest applicable skill.

| Task | Skill |
| --- | --- |
| Repository discovery or handoff | `project-orientation` |
| HTML/CSS/Vanilla JS/DOM/accessibility | `frontend-vanilla` |
| Frontend tests or browser verification | `frontend-verification` |
| Controller, DTO, API, auth contract | `backend-contract-verification` |
| MySQL, JPA mapping, schema, migration | `database-flyway-mysql` |
| SRS calculation, progress, review, settings | `srs-domain` |
| Security-sensitive change or audit | `security-review` |

## Precedence

1. Current user request.
2. Executable source, tests, and applied migrations.
3. `.agents/SOURCE_OF_TRUTH.md` and rules.
4. The selected project skill.
5. External official documentation for version-sensitive tools.

If a skill conflicts with source, report the conflict and correct the skill rather than bending the code to stale guidance. Do not load every skill for every task.
