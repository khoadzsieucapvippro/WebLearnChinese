# Project: E-Learning Chinese Speech & SRS Platform

## Architecture
The system consists of 4 main tiers:
1. **Frontend (Vanilla JS SPA & Modules)**:
   - Zero-build modular architecture (`frontend/js/ui/speech.js`, `frontend/js/pages/srs-review-page.js`, `reading-room`, etc.).
   - Communicates with Backend via REST API (`/api/v1/...`).
   - Audio playback engine with 3-tier fallback (Pre-recorded static audio -> Web Speech API with voice acquisition -> Informative UI fallback).
   - Audio recording & reading evaluation controller for `#srsReadingRoom` with strict keyboard shortcut isolation.
2. **Backend (Spring Boot 3.3.5, Java 17)**:
   - REST API Controllers (`ReadingAssessmentController`, `VocabularyController`, `LessonController`, `SrsReviewController`).
   - Local AI Service Client (`LocalSpeechServiceClient`) using Spring RestClient calling local FastAPI microservice.
   - JPA/Hibernate persistence, Flyway database migration baseline.
3. **Local Speech & Tone Evaluation Service (FastAPI / Python 3.11)**:
   - Microservice running on `http://127.0.0.1:8000` (zero external/cloud API calls).
   - Physical F0 Pitch Contour analysis (Praat Parselmouth/SciPy) mapped to Chao 5-level scale (1..5).
   - Tone Sandhi Engine (3+3 -> 2+3, 不 bù, 一 yī, half 3rd tone).
   - Quality Gate: Automatic detection of silence, noise, clipping, or duration < 0.35s returning `not_scorable` (no fake scores).
4. **Database (MySQL 8.4+)**:
   - 214 Kangxi Radicals (`RADICAL`).
   - 1,068 Vocabulary records (`VOCABULARY`): 300 HSK 1, 200 HSK 2, 500 HSK 3, 68 HSK 0.
   - Relational mapping (`VOCABULARY_RADICAL`).
   - SRS Curriculum & User History: `lesson`, `lesson_words`, `user_vocabulary_progress`, `review_log`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Audio Trigger & Transient Activation | Keep user gesture token synchronously without dropping it via unneeded pre-fetch await in `playPronunciation` | M1 | Survey Audio |
| 2 | Audio Fallback & Lifecycle Management | 3-tier audio playback (Audio URL -> Web Speech with voice acquisition -> Toast alert), prevent race conditions & overlapping sounds | M1 | Survey Audio |
| 3 | Static Server Audio MIME Types | Configure `.mp3`, `.wav`, `.ogg`, `.webm` MIME headers in `scripts/serve.mjs` and test runners | M1 | Survey Audio |
| 4 | Offline Speech Microservice Scaffold | FastAPI microservice in `ai-service/` or `speech-service/` running locally on port 8000 with `/health` and `/evaluate-reading` | M2 | Survey Speech |
| 5 | Physical F0 & Tone Assessment Engine | Praat-Parselmouth/SciPy F0 pitch analysis, Chao scale mapping, tone sandhi rules (3+3, 不, 一) | M2 | Survey Speech |
| 6 | Non-Scorable Audio Quality Gate | Rejection of silence (RMS < 0.006), noise, clipping (>2%), and short audio (<0.35s) without generating fake scores | M2 | Survey Speech |
| 7 | Backend Spring Boot Speech Proxy | RestClient proxying `/api/v1/reading-assessment/evaluate` to local FastAPI service, standard DTO handling | M2 | Survey Speech |
| 8 | Frontend #srsReadingRoom Integration | Audio recording, state machine (Ready, Recording, Analyzing, Result, Error), lock SRS shortcuts [1]-[4] | M2 | Survey Speech |
| 9 | Flyway V28 Migration for Data Consistency | Correct corrupted words from V26/V27 in MySQL, restore `出租车` radical relation, align vocab IDs | M3 | Survey Data |
| 10 | Frontend Demo Seed & Export Data Sync | Align `demo-seed-data.js` and root audit files (`data_kiem_tra_all.json`, `tu_vung_1000.csv`) with exact MySQL IDs | M3 | Survey Data |
| 11 | SRS Lesson ID & Review Alignment | Fix frontend `srs-review-page.js` lesson IDs to map to real DB `lesson_id` 5..14, preserving all card progress and review logs | M3 | Survey Data |
| 12 | E2E Test Suite & Test Runner | Comprehensive test suite (Tiers 1-4) covering audio playback, speech evaluation, data consistency, and full-stack flows | E2E | Dual Track |
| 13 | Full-Stack Live Run & Browser Acceptance | Concurrent live launch of Frontend, Spring Boot, MySQL, and FastAPI service, verified via Antigravity browser testing | M4 | Survey All |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design & implement comprehensive automated test suite (Tiers 1-4) & TEST_READY.md | none | DONE (20/20 PASS) |
| M1 | Audio Playback Fix (R1) | Fix audio URL mapping, event lifecycle, transient activation, MIME types, and fallback notifications | none | DONE (1083 tests PASS, 19/19 stress PASS, Auditor CLEAN) |
| M2 | Local Speech & Tone Engine (R2) | Implement FastAPI microservice, F0 pitch & tone sandhi engine, Spring Boot proxy, #srsReadingRoom UI | none | PLANNED |
| M3 | Data Consistency & Curriculum Audit (R3) | Create Flyway V28, fix corrupted records, sync demo seed data & root files, align SRS lesson IDs | none | PLANNED |
| M4 | Full-Stack Live Run & Acceptance (R4) | Live launch of all 4 services, run 100% of E2E test suite (Tiers 1-4), execute Tier 5 hardening, produce 5-part Vietnamese report | M1, M2, M3, E2E | PLANNED |

---

## Interface Contracts

### 1. Local AI Service ↔ Spring Boot Backend
- **Endpoint**: `POST http://127.0.0.1:8000/evaluate-reading`
- **Request**: Multipart Form Data:
  - `audio`: binary file (`audio/wav`, `audio/webm`)
  - `targetText`: string (e.g. `你好`)
  - `expectedPinyin`: string (e.g. `nǐ hǎo`)
- **Response** (JSON):
```json
{
  "status": "assessed", // "assessed" | "not_scorable" | "engine_unavailable" | "overloaded" | "error"
  "overallScore": 88.5, // null if status != "assessed"
  "toneScore": 90.0,
  "fluencyScore": 85.0,
  "syllables": [
    {
      "character": "你",
      "expectedPinyin": "nǐ",
      "expectedTone": 3,
      "sandhiTone": 2,
      "detectedTone": 2,
      "toneCorrect": true,
      "score": 92.0,
      "feedback": "Biến điệu thanh 3 thành thanh 2 chuẩn xác"
    },
    {
      "character": "好",
      "expectedPinyin": "hǎo",
      "expectedTone": 3,
      "sandhiTone": 3,
      "detectedTone": 3,
      "toneCorrect": true,
      "score": 85.0,
      "feedback": "Thanh 3 phát âm tốt"
    }
  ],
  "reason": null,
  "guidance": null
}
```

### 2. Spring Boot Backend ↔ Frontend Client
- **Endpoint**: `POST /api/v1/reading-assessment/evaluate`
- **Request**: Multipart Form Data:
  - `audio`: audio blob
  - `targetText`: string
  - `expectedPinyin`: string
  - `targetType`: `VOCABULARY` | `RADICAL`
  - `targetId`: integer
- **Response**: Maps exactly to the standardized ReadingAssessmentResponse DTO with backwards compatibility for `overallScore`, `toneScore`, `fluencyScore`, `status`.

### 3. Audio Playback Controller API Contract
- `SpeechController.playPronunciation(cardOrItem, options)`:
  - Never throws uncaught promise rejection.
  - Returns `{ success: boolean, method: 'audio_file' | 'web_speech' | 'ui_fallback', message?: string }`.
  - Disables button only while loading/playing, resets cleanly on complete or error.

---

## Code Layout
- Frontend: `frontend/js/ui/speech.js`, `frontend/js/pages/srs-review-page.js`, `frontend/js/api/demo-seed-data.js`
- Backend: `backend/src/main/java/com/elearning/.../reading/`, `backend/src/main/java/com/elearning/.../vocabulary/`
- AI Microservice: `speech-service/` (FastAPI app, tone assessment engine, requirements.txt)
- Database: `backend/src/main/resources/db/migration/V28__fix_v26_v27_discrepancies_and_sync_ids.sql`
- Tests: `tests/frontend/`, `tests/e2e/`, `backend/src/test/java/com/elearning/...`
