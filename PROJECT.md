# Project: WebLearnChinese Audit & Full-Stack Remediation

## Architecture
WebLearnChinese is a full-stack Chinese learning platform comprising:
- **Frontend**: Modular Vanilla JS (ES Modules, Zero-Build), semantic HTML5 (25 pages), CSS custom properties, strict CSP, and SRI hash checking.
  - SRS Hub (`srs-review.html` & `srs-review-page.js`): 4 dedicated study rooms: Flashcard (🎴), Writing (✍️ - HanziWriter), Listening (🎧 - Web Speech API/Audio URL), Reading (📖 - Chao 5-scale Tone Sandhi Engine).
  - 5 Curriculum Shelves: 50 Radicals, 214 Radicals, HSK 1 (300 words), HSK 2 (200 words), HSK 3 (500 words).
- **Backend**: Spring Boot 3.3.5 (Java 17/21), Spring Security (stateless JWT RBAC with Learner, Creator, Moderator, Admin), Spring Data JPA, Flyway migrations (V1..V29).
  - Reading Assessment Service (`ReadingAssessmentServiceImpl`): Connects to local/hosted Python FastAPI speech service via HTTP with `X-Internal-Token` and cold-start fallback handling.
- **Speech Service Microservice**: Python 3.11 FastAPI running Uvicorn with Praat/PyWorld/Librosa-based Chao 5-scale acoustic pitch tracking (F0) and tone sandhi assessment (`/evaluate-reading`). 100% offline acoustic engine, zero cloud AI calls.
- **Reliability & Keep-Alive**: UptimeRobot 24/7 dual HTTP monitoring for backend (`/actuator/health`) and speech-service (`/health`) to maintain warm instances on Render Free Tier.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Purge AI/Gemini Branding from Frontend UI | Purge all obsolete "Gemini", "GEMINI_API_KEY", and cloud AI quota warnings in `srs-review-page.js`, `style.css`, and templates; replace with truthful "Hệ thống Phân tích Phát âm & Thanh điệu" (Chao 5-scale Tone Sandhi Engine). Keep #746 `发展` pedagogical sentence intact. | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Purge Gemini Fallback & Cloud SDK from Backend | Remove Google GenAI SDK from `pom.xml`, delete cloud fallback logic from `ReadingAssessmentServiceImpl`, clean `application.yml`, update `PronunciationAssessmentResponse` DTO and `LocalSpeechServiceClient` messages to truthful open-source terminology. | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Standardize Speech Service Evaluator Copy | Update `evaluator.py` line 185 limitations string to "Hệ thống Phân tích Phát âm & Thanh điệu (Chao 5-scale Tone Sandhi Engine)". | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Synchronize Test Assertions for Tone Assessment | Update `srs-skill-reading.test.mjs`, `srs-reading.browser.mjs`, `ReadingAssessmentControllerTests.java`, and `ReadingAssessmentServiceTests.java` to assert new open-source terminology in lockstep. | M1 | ORIGINAL_REQUEST §R1, Acceptance Criteria |
| F5 | Reading Room Cold-Start Resilience & State Controls | Tune backend timeouts to keep total retry duration < 50s; return `coldStartWakingUp` status with encouraging feedback; verify "Bỏ qua →" and "Thử đọc lại" controls never freeze. | M2 | ORIGINAL_REQUEST §R2 |
| F6 | UptimeRobot 24/7 Keep-Alive Setup & Documentation | Document setup of 2 independent 5-minute HTTP monitors on UptimeRobot for `/actuator/health` and `/health` in `DEPLOYMENT_FREE_TIER.md` and `README.md`. | M2 | ORIGINAL_REQUEST §R2 |
| F7 | Web-Wide Defect Remediation: Restore Lesson Vocab Note Button | Restore `.lesson-vocab-note-btn` in `frontend/js/pages/lesson-detail-page.js` to unblock 9 failing tests across accessibility and browser suites. | M3 | ORIGINAL_REQUEST §R3 |
| F8 | Browser Test Suite Flake & Mock Hardening | Harden browser tests (`auth-flow`, `srs-dashboard`, `verification-center`, `vocabulary-srs-navigation`) against unmocked route console errors; expand `ALL_22_PAGES` to all 25 pages in `responsive-layout.browser.mjs`. | M3 | ORIGINAL_REQUEST §R3 |
| F9 | Full-Stack Verification & Adversarial Forensic Audit | Execute full fast unit test suite (937+ tests), browser tests, backend maven tests, verify zero horizontal overflow on 375px mobile, and pass independent forensic audit. | M4 | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Purge Obsolete AI/Gemini Terminology & Code across Full Stack | F1, F2, F3, F4 (Frontend UI, backend services/DTOs, speech service, test assertions) | none | COMPLETED |
| M2 | Reading Room & Speech Service Resilience & Keep-Alive Documentation | F5, F6 (Cold-start retry tuning, encouraging guidance, UptimeRobot 24/7 doc) | M1 | COMPLETED |
| M3 | Web-Wide Defect Remediation & Test Hardening | F7, F8 (Restore `.lesson-vocab-note-btn`, browser test mocks & 25-page layout coverage) | M1 | COMPLETED |
| M4 | Final Milestone: 100% Automated Test Pass & Forensic Audit Gate | F9 (937+ fast tests pass, browser tests pass, maven tests pass, mobile 375px zero overflow, forensic audit clean) | M1, M2, M3 | COMPLETED |

---

## Interface Contracts

### 1. Reading Assessment DTO Contract (`PronunciationAssessmentResponse`)
- Status codes:
  - `assessed`: Successful tone and pronunciation evaluation from local speech service.
  - `not_scorable`: Low audio quality, silence, or excessive background noise (advises user clearly).
  - `cold_start`: Render free tier speech service spinning up (30-50s), advising user encouragingly.
  - `engine_unavailable`: Speech service unreachable (provides fallback skip option).
  - `error`: Internal evaluation error.
- Fields: `status`, `overallScore`, `toneScore`, `pinyinTarget`, `summaryVi`, `retryAdvice`, `limitations`, `details`.
- Provider metadata: `"provider": "speech-service-local"`, `"model": "Chao-5-Scale Tone Sandhi Engine"`, `"tier": "open-source-offline"`.

### 2. Frontend Reading Room State Machine (`#srsReadingRoom`)
- State A (`#readingStateReady`): Prompts target Hanzi, sample audio, toggle Pinyin preview.
- State B (`#readingStateRecording`): Active audio recording with duration timer, Stop & Cancel buttons.
- State C (`#readingStateAnalyzing`): Displays spinner with "Đang phân tích đường cao độ F0 và đánh giá thanh điệu theo thang chuẩn Chao".
- State D (`#readingStateResult`): Renders Chao 5-scale tone breakdown and practice tips.
- State E (`#readingStateError`): Displays error card with "Thử đọc lại" (`#btnReadingTryAgain`) and "Bỏ qua →" (`#btnReadingSkipOnError`).
- Keyboard isolation: SRS shortcuts [1]-[4] are completely ignored in reading mode.

### 3. Keep-Alive Endpoints Contract
- Backend: `GET /actuator/health` -> HTTP 200 `{"status":"UP"}`. Publicly accessible without auth.
- Speech Service: `GET /health` -> HTTP 200 `{"status":"READY","engine":"local-acoustic-f0-tone","model":"Chao-5-Scale Tone Sandhi Engine"}`. Publicly accessible without auth.

---

## Code Layout
- `frontend/js/pages/srs-review-page.js` (SRS reading controller & state machine)
- `frontend/js/pages/lesson-detail-page.js` (Lesson detail view & personal note button)
- `frontend/css/style.css` (SRS styling & responsive mobile breakpoints)
- `backend/src/main/java/com/elearning/dto/response/PronunciationAssessmentResponse.java`
- `backend/src/main/java/com/elearning/service/impl/ReadingAssessmentServiceImpl.java`
- `backend/src/main/java/com/elearning/service/LocalSpeechServiceClient.java`
- `backend/src/main/java/com/elearning/controller/ReadingAssessmentController.java`
- `speech-service/app/core/evaluator.py`
- `tests/frontend/unit/srs/srs-skill-reading.test.mjs`
- `tests/frontend/e2e/srs-reading.browser.mjs`
- `tests/frontend/accessibility/a11y.browser.mjs`
- `tests/frontend/e2e/personal-notes.browser.mjs`
- `DEPLOYMENT_FREE_TIER.md` & `README.md`
