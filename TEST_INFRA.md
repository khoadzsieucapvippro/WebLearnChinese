# E2E Test Infra: WebLearnChinese Management Decoupling, Settings Completion & Security

## Test Philosophy
- Opaque-box, requirement-driven. Derived from ORIGINAL_REQUEST.md specifications, independent of implementation internals.
- Verification covers all 4 RBAC roles (Learner, Creator, Moderator, Admin), authorization rules, configuration fail-fast, business invariants, and audit logging integrity.
- Zero-tolerance for false passes, simulation leakage, or unverified claims.

## Feature Inventory & Test Coverage Goals
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Disable Demo Seed in Prod | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 2 | JWT Secret Fail-Fast | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | Demo Fallback Simulation Alert | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Prevent Moderation Self-Review | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 5 | Enforce Last Active Admin Invariant | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 6 | SRS Card Limit Bounds | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 7 | SRS Button Standardization | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 8 | Audit Log Flyway Migration | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 9 | Audit Log JPA Entity & Repository | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 10 | Audit Service & Data Sanitizer | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 11 | Audit Logging Hooks | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 12 | Admin Audit Log REST API | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 13 | Admin Audit Log UI | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 14 | Management Central Hub | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 15 | Unified Navigation Entry | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 16 | Profile Decoupling | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 17 | Consistent Management Sub-nav | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 18 | Audio/Writing Settings Integration | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 19 | Password Change UI | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 20 | Test Suite Regression Updates | ORIGINAL_REQUEST §R1, R3 | 5 | 5 | ✓ |

## Test Architecture
- Backend verification: `mvn test` running Spring Boot test slices and unit tests.
- Frontend verification: `npm run verify:frontend:fast`, `npm run verify:frontend:static`, `npm run verify:frontend:unit`.
- Integration and invariant tests: JUnit integration tests with MockMvc and SecurityContext, verifying RBAC matrix, self-review block, concurrent admin lock, and sanitized audit log recording.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Dual-Role Creator-Moderator Workflow | F4, F11, F14, F15 | High |
| 2 | Concurrent Last Admin Demotion Prevention | F5, F11, F12 | High |
| 3 | Learner vs Management Navigation & Profile Decoupling | F14, F15, F16, F17 | Medium |
| 4 | Password Change & Profile Audio/Writing Settings Flow | F18, F19 | Medium |
| 5 | Full Audit Trail Verification for Admin Resource Edits | F8, F9, F10, F11, F12, F13 | High |
| 6 | Production Security Bootstrap & Fail-Fast Validation | F1, F2, F3 | Medium |

## Coverage Thresholds
- Tier 1: Feature Coverage (>=5 per feature)
- Tier 2: Boundary & Corner Cases (>=5 per feature)
- Tier 3: Cross-Feature Interactions & Combinations (pairwise)
- Tier 4: Real-World Multi-Role Application Scenarios (>=6 realistic scenarios)
- Tier 5: Adversarial Coverage Hardening (white-box gap analysis)
