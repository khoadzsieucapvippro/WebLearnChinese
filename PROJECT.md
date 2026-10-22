# Project: WebLearnChinese Management Decoupling, Settings Completion & Production Security

## Architecture
WebLearnChinese is a full-stack Chinese learning platform with:
- **Backend**: Spring Boot 3.3.5 (Java 17/21), Spring Security (stateless JWT RBAC with Learner, Creator, Moderator, Admin), Spring Data JPA, Flyway migrations (baseline V1..V28 -> V29).
- **Frontend**: Modular Vanilla JS (ES Modules, Zero-Build), semantic HTML5, CSS custom properties, strict CSP, and SRI hash checking.
- **Data Flow**:
  - Learners use public & study endpoints (`/api/v1/lessons`, `/api/v1/srs`, `/api/v1/auth`, etc.).
  - Creators use studio endpoints (`/api/v1/creator/*`).
  - Moderators review lessons (`/api/v1/moderation/*`).
  - Admins manage users, roles, system resources, and audit logs (`/api/v1/admin/*`).
- **Management Area Decoupling**: Central hub `frontend/management.html` aggregates management tasks per role; profile settings remain focused purely on learner preferences.
- **Production Security**: Strict fail-fast on insecure JWT secrets, demo accounts disabled by default in production configurations, and explicit demo fallback simulation indicators.
- **Audit Logging**: Comprehensive, non-destructive audit log table (`MANAGEMENT_AUDIT_LOG`) recording all administrative and moderation actions with actor attribution and sanitized payloads.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Disable Demo Seed in Prod | Set `APP_DEMO_SEED_ACCOUNTS=false` in Dockerfile, backend/Dockerfile, render.yaml & add profile guard in `DemoAccountSeeder` | M1 | ORIGINAL_REQUEST §R2 |
| F2 | JWT Secret Fail-Fast | Enforce >=32-byte non-blank JWT secret; fail startup if missing on production/non-dev profiles; allow fallback only on local/dev | M1 | ORIGINAL_REQUEST §R2 |
| F3 | Demo Fallback Simulation Alert | Render prominent `🟡 Dữ liệu mô phỏng` badge when demo mode active; forbid silent downgrade from real backend errors to simulated auth | M1 | ORIGINAL_REQUEST §R2 |
| F4 | Prevent Moderation Self-Review | In `ModerationServiceImpl`, reject approval/rejection if creator ID equals moderator ID (HTTP 403 / FORBIDDEN) | M2 | ORIGINAL_REQUEST §R4 |
| F5 | Enforce Last Active Admin Invariant | In `AdminRoleServiceImpl` / `AdminAccountServiceImpl`, prevent removing Admin role or deactivating/locking last active admin with pessimistic locking | M2 | ORIGINAL_REQUEST §R4 |
| F6 | SRS Card Limit Bounds | Add `@Max(100)` validation on `newCardsPerDay` in DTO, enforce bounds in service and frontend with validation message | M2 | ORIGINAL_REQUEST §R4 |
| F7 | SRS Button Standardization | Standardize "Khôi phục" button to "Hoàn tác thay đổi" and update status text/revert behavior | M2 | ORIGINAL_REQUEST §R4 |
| F8 | Audit Log Flyway Migration | Create `V29__create_management_audit_log.sql` non-destructive table with indexes for actor, action, resource, timestamp | M3 | ORIGINAL_REQUEST §R5 |
| F9 | Audit Log JPA Entity & Repository | Implement `ManagementAuditLog`, enums (`AuditActionType`, `AuditResourceType`, `AuditStatus`), and Spring Data JPA repository | M3 | ORIGINAL_REQUEST §R5 |
| F10 | Audit Service & Data Sanitizer | Implement `ManagementAuditService` with `AuditDataSanitizer` redacting passwords, JWT, tokens, and secrets from JSON details | M3 | ORIGINAL_REQUEST §R5 |
| F11 | Audit Logging Hooks | Instrument role change, lock/unlock, lesson/vocab/radical updates, and moderation actions with audit log calls | M3 | ORIGINAL_REQUEST §R5 |
| F12 | Admin Audit Log REST API | Implement `GET /api/v1/admin/audit-logs` (Admin-only, paginated, filtered) and detail endpoint | M3 | ORIGINAL_REQUEST §R5 |
| F13 | Admin Audit Log UI | Implement `frontend/admin-audit-logs.html` and `admin-audit-logs-page.js` with filter bar, table, pagination, detail modal | M3 | ORIGINAL_REQUEST §R5 |
| F14 | Management Central Hub | Create `frontend/management.html` & `management-page.js` with role-based card sections (Creator, Moderator, Admin) and "Quay lại học" | M4 | ORIGINAL_REQUEST §R1 |
| F15 | Unified Navigation Entry | Update `frontend/js/ui/nav.js` to replace scattered links with single "Khu vực quản lý" for Creator/Moderator/Admin; hide from Learner | M4 | ORIGINAL_REQUEST §R1 |
| F16 | Profile Decoupling | Remove `profileRoleWorkspacesSection` and admin nav buttons from `frontend/profile.html` and `profile-page.js` | M4 | ORIGINAL_REQUEST §R1 |
| F17 | Consistent Management Sub-nav | Add consistent management navigation bar with "Quay lại học" across `creator-*.html`, `moderator-*.html`, `admin-*.html` | M4 | ORIGINAL_REQUEST §R1 |
| F18 | Audio/Writing Settings Integration | Wire supported settings to speech/writing/srs modules; add explicit `localStorage` disclaimer banner on profile | M4 | ORIGINAL_REQUEST §R3 |
| F19 | Password Change UI | Build Account Security form in Profile calling `POST /api/v1/auth/change-password` with validation & feedback (zero Web Storage exposure) | M4 | ORIGINAL_REQUEST §R3 |
| F20 | Regression & Contract Test Suite Updates | Update `authenticated-links-regression.test.mjs` and add unit/integration tests for management nav and security contracts | M4 | ORIGINAL_REQUEST §R1, R3 |
| F21 | E2E & Adversarial Verification | Execute full test suites (`mvn test`, `npm run verify:frontend:fast`), verify 100% pass across all tiers, and perform forensic integrity audit | M5 | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Configuration & Production Security Hardening | F1, F2, F3 (Dockerfile, render.yaml, JWT fail-fast, demo fallback alert) | none | DONE |
| M2 | Management Business Invariants & SRS Constraints | F4, F5, F6, F7 (Self-review check, last admin invariant, SRS card limits, SRS button standardization) | none | DONE |
| M3 | Centralized Management Audit Log System | F8, F9, F10, F11, F12, F13 (V29 Flyway migration, JPA entity/repo, AuditService, hooks, API & UI) | M2 | DONE |
| M4 | Management Area Decoupling, Navigation & Settings Completion | F14, F15, F16, F17, F18, F19, F20 (management.html, nav.js, profile decoupling, sub-nav, audio/writing settings, password change UI) | M1, M3 | DONE |
| M5 | E2E Integration Verification & Hardening | F21 (Full backend mvn test, frontend verify:frontend:fast, adversarial coverage hardening & audit clean) | M1, M2, M3, M4 | DONE |

---

## Interface Contracts

### 1. Password Change API
- Endpoint: `POST /api/v1/auth/change-password`
- Headers: `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- Request Body (`ChangePasswordRequest`):
  ```json
  {
    "currentPassword": "...",
    "newPassword": "..."
  }
  ```
- Responses:
  - `200 OK`: `{"status": 200, "message": "Đổi mật khẩu thành công", "data": null}`
  - `400 BAD REQUEST`: validation failure (e.g. blank, length < 6, current equals new)
  - `401 UNAUTHORIZED`: invalid current password

### 2. Admin Audit Log API
- Endpoint: `GET /api/v1/admin/audit-logs`
- Headers: `Authorization: Bearer <jwt>` (Requires `ROLE_ADMIN`)
- Query Parameters:
  - `page`: integer (0-based, default 0)
  - `size`: integer (default 20, max 100)
  - `sort`: string (default "timestamp,desc")
  - `actionType`: optional string (enum `AuditActionType`)
  - `resourceType`: optional string (enum `AuditResourceType`)
  - `actor`: optional string (username search)
  - `startDate`: optional ISO-8601 string
  - `endDate`: optional ISO-8601 string
  - `status`: optional string (`SUCCESS`, `FAILURE`)
- Response: Page of `AuditLogResponse` (id, actorId, actorUsername, actionType, resourceType, resourceId, timestamp, status, detailsSummary, ipAddress)
- Endpoint: `GET /api/v1/admin/audit-logs/{id}`
  - Returns full `AuditLogDetailResponse` with formatted before/after payloads (sanitized).

### 3. Navigation Contract (`nav.js`)
- Learner: shows standard learning items; "Khu vực quản lý" hidden.
- Creator / Moderator / Admin: shows "Khu vực quản lý" (`#navManagementBtn`) pointing to `management.html`.
- Demo Mode: When active, persistent badge `<span class="badge badge-warning">🟡 Dữ liệu mô phỏng</span>` displayed in top navigation.

### 4. Self-Review Invariant (`ModerationServiceImpl`)
- When `lesson.getCreatedBy().getAccountId().equals(currentModerator.getAccountId())`:
  - Throws `AppException(ErrorCode.FORBIDDEN, "Bạn không thể tự kiểm duyệt nội dung do chính mình tạo ra")`.

### 5. Last Admin Invariant (`AdminRoleServiceImpl` & `AdminAccountServiceImpl`)
- Before modifying or revoking `ROLE_ADMIN` or locking an Admin account:
  - Obtain pessimistic lock on Admin role record (`SELECT ... FOR UPDATE`).
  - Count active Admin users (`WHERE role = 'ROLE_ADMIN' AND status = 'ACTIVE'`).
  - If count <= 1 and target is an active admin: throw `AppException(ErrorCode.BAD_REQUEST, "Không thể hạ quyền hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng của hệ thống")`.

---

## Code Layout
- `backend/src/main/resources/db/migration/V29__create_management_audit_log.sql`
- `backend/src/main/java/com/weblearnchinese/model/`
  - `ManagementAuditLog.java`, `enums/AuditActionType.java`, `enums/AuditResourceType.java`, `enums/AuditStatus.java`
- `backend/src/main/java/com/weblearnchinese/repository/ManagementAuditLogRepository.java`
- `backend/src/main/java/com/weblearnchinese/service/`
  - `ManagementAuditService.java`, `impl/ManagementAuditServiceImpl.java`
  - `impl/ModerationServiceImpl.java` (self-review check & audit log)
  - `impl/AdminRoleServiceImpl.java` & `impl/AdminAccountServiceImpl.java` (last admin lock & audit log)
- `backend/src/main/java/com/weblearnchinese/controller/AdminAuditLogController.java`
- `backend/src/main/java/com/weblearnchinese/util/JwtUtil.java` & `config/SecurityConfig.java` (fail-fast validation)
- `frontend/management.html` & `frontend/js/pages/management-page.js`
- `frontend/admin-audit-logs.html` & `frontend/js/pages/admin-audit-logs-page.js`
- `frontend/profile.html` & `frontend/js/pages/profile-page.js`
- `frontend/js/ui/nav.js`
- `frontend/js/api/demo-fallback-engine.js` & `frontend/js/api/api.js`
- `tests/frontend/unit/auth/authenticated-links-regression.test.mjs`
- `Dockerfile`, `backend/Dockerfile`, `render.yaml`
