---
name: project-orientation
description: Orient Codex in this repository before implementation, review, debugging, or verification.
---

# Project Orientation

Use this skill at the start of work when repository location, ownership, or current behavior is unclear.

1. Confirm the repository root with `git status --short --branch` and `rg --files`.
2. Read `.agents/SOURCE_OF_TRUTH.md`, applicable rules, `README.md`, `package.json`, and `backend/pom.xml`.
3. Inspect relevant source, tests, and migrations. Treat old `.agents` notes as historical unless source confirms them.
4. Identify impact across frontend, backend, API, database, authentication, and tests.
5. Do not edit application code merely to complete orientation.

The application is a Chinese Kangxi radical/vocabulary learning platform with lessons, moderation, four RBAC roles, personal notes, and an SM-2-style SRS. The backend is Spring Boot; the frontend is static HTML/CSS and native modules.

Do not trust counts or PASS claims in historical handoff documents. Confirm them with current commands. Do not access or alter secrets, dumps, caches, browser binaries, or generated artifacts.
