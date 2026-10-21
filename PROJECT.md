# Project: Hán Ngữ & 214 Bộ Thủ Khang Hy & HSK 1-3 1000 Từ Vựng Standardization (HSK 3.0 Nov 2025)

## Architecture
- **Backend**: Spring Boot 3.3.5 (Java 17/21), Spring Data JPA, Flyway Database Migrations (MySQL 8.4+).
- **Frontend**: Vanilla JS (ES6 modules), CSS3, HTML5, zero-build client-side architecture with fallback demo seed data (`frontend/js/api/demo-seed-data.js`).
- **Data Pipeline**: Python audit/export scripts (`scripts/export_audit_dataset.py`, `scripts/build_full_hsk_dataset.py`, `scripts/test_radical_resolver.py`).
- **Verification Layer**:
  - Automated Python E2E harness (`scripts/verify_hsk_radical_standardization.py`): 27/27 PASS.
  - Backend JUnit tests (`ChineseDomainDataAuditTests`, `VocabularyHskAndUnicodeIntegrityTests`, `VocabularyIntegrationTests`, `RadicalIntegrationTests`, `RadicalServiceTests`, `VocabularyDtoTests`): 63/63 PASS.
  - Frontend node test runner (`tests/frontend/runner.mjs`): 864/864 PASS (fast tier) / 1067 PASS (full tier).
  - Root export files (`data_kiem_tra_all.json`, `data_kiem_tra_tom_tat.txt`, `bo_thu_214.csv`, `tu_vung_1000.csv`, `data_kiem_tra_all.zip`): 100% synchronized.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Radical #69 斤 Fix | Sửa âm Hán-Việt Bộ #69 từ "Cẩn" thành chuẩn "Cân" | M1 | R1 |
| 2 | Radical Character Variants | Đồng bộ biến thể/giản thể cho #96 玉(王/玊), #187 馬(马), #197 鹵(卤), #205 黽(黾) | M1 | R1 |
| 3 | Radical #71 无 Pedagogical Update | Rà soát và cập nhật explanationVi Bộ #71 (bỏ ví dụ 抚, dùng chữ thuộc bộ chính hoặc chú thích rõ) | M1 | R1 |
| 4 | Test Invariant Update (Radical Count) | Cập nhật `ChineseDomainDataAuditTests.java` compoundDisplayCount (43 -> 47) và unifiedIdeographCount (171 -> 167) | M1 | Survey |
| 5 | Visual Radical Decomposition Rules | Chỉ gán bộ thủ thực sự xuất hiện; bộ thủ độc lập (#42, #110, #173, #238, #426, #871) chỉ ánh xạ tới chính nó | M2 | R2 |
| 6 | Visual Component Corrections (14 chars) | Sửa 14 chữ bị lỗi gán bộ thủ: 干, 后, 右, 左, 习, 买, 卫, 丢, 节, 爬, 声, 书, 喝/渴, 游泳 | M2 | R2 |
| 7 | 阝 Phụ #170 vs Ấp #163 Distinction | Phân biệt chính xác 阝 trái (#170 阜) và 阝 phải (#163 邑) trên toàn bộ chữ chứa 阝 (邮, 邻, 郊, 都, 部, 那, 哪, 帮, 院, 阳, 阴, 附, 除, 阿, 队, 阶...) | M2 | R2 |
| 8 | Remove Phonetic Secondary Radicals | Bỏ ép gán bộ thủ phụ cho thành phần biểu âm (爸爸, 吧, 杯, 坏, 病, 还) | M2 | R2 |
| 9 | Han-Viet Phonology Standardization | Sửa 17+ nhóm lỗi Âm Hán-Việt (打, 听, 喝, 冷, 觉得/睡觉, 重/重要, 长, 儿子, 几, 正/正在, 丢, 爬, 胖, 啤酒, 爸爸/妈妈, 什么/怎么, 上, 哪, 场) | M3 | R3 |
| 10 | Contextual Meaning & Example Sentences | Sửa 18+ nhóm nghĩa tiếng Việt và câu ví dụ: tách riêng 地 (de vs dì), 干 (gān vs gàn), 还 (hái vs huán); sửa dịch máy 告诉, 后天, 机场, 考, 累, 没事儿, 米饭, 奶奶, 男, 您, 上车/下车, 西, 页, 重, 子; bỏ nghĩa họ/cổ | M3 | R3 |
| 11 | HSK 3.0 Level Alignment | Cập nhật cấp độ HSK 2025: 爱好, 班, 本子 (HSK 2); 别的, 别人, 病人 (HSK 3); giữ Bạch 白 là HSK 0 | M4 | R4 |
| 12 | Homograph Indexing Integrity | Định danh chính xác 5 cặp từ đồng hình (点, 花, 会, 站, 过去) theo `hsk_source_id` và `homograph_index` | M4 | R4 |
| 13 | Foreign Key & SRS Lesson Preservation | Bảo toàn toàn bộ 1.068 vocab_id, không DELETE/TRUNCATE; bảo toàn 10 bài học SRS trong V17 (`lesson_vocabulary`), `card_progress`, `review_log` | M4 | R4 |
| 14 | Flyway Migration V26 | Viết migration mới `V26__standardize_radicals_and_hsk1_to_3_vocab_2025.sql` áp dụng toàn bộ DDL/DML an toàn | M5 | R5 |
| 15 | Demo Seed Data Fallback Sync | Đồng bộ toàn bộ dữ liệu chuẩn hóa vào `frontend/js/api/demo-seed-data.js` | M5 | R5 |
| 16 | Export Script & Root Files Sync | Chạy script export để cập nhật `data_kiem_tra_all.json`, `data_kiem_tra_tom_tat.txt`, `bo_thu_214.csv`, `tu_vung_1000.csv`, `data_kiem_tra_all.zip` | M5 | R5 |
| 17 | E2E Automated Verification Suite | Viết và chạy script automated Python validation kiểm tra 100% các tiêu chí R1-R5 (27/27 PASS) | M6 | R6 |
| 18 | Backend & Frontend Test Suite Pass | Chạy toàn bộ test suites backend và frontend runner.mjs pass 100% | M6 | R6 |
| 19 | Forensic Integrity Audit & Veto Check | Kiểm tra độc lập tính chân thực (anti-cheat, no hardcoding, no facades) bởi teamwork_preview_auditor (CLEAN) | M6 | Verification |
| 20 | Acceptance Report in Vietnamese | Báo cáo nghiệm thu hoàn chỉnh bằng Tiếng Việt kèm bảng đối chiếu Trước vs Sau và trích dẫn học thuật | M6 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Radicals 214 Standardization | Chuẩn hóa bảng `RADICAL`, sửa #69 斤, cập nhật biến thể #96, #187, #197, #205, sửa #71, cập nhật test invariant | none | **DONE** |
| M2 | Radical Composition & Visual Rules | Chuẩn hóa `VOCAB_RADICAL` / `radicalIds` cho 656+ chữ, 4 nhóm lỗi hệ thống, 阝 trái vs phải, standalone radicals, phonetic components | M1 | **DONE** |
| M3 | Han-Viet & Vietnamese Semantics | Sửa 17+ nhóm âm Hán-Việt, 18+ nhóm nghĩa tiếng Việt và câu ví dụ, tách polysemy (地, 干, 还) | none | **DONE** |
| M4 | HSK 2025 Alignment & FK Preservation | Cập nhật HSK 2/3 (爱好, 班, 本子, 别的, 别人, 病人), bảo toàn 10 bài học SRS và 1.068 vocab_id, định danh 5 cặp đồng hình | M3 | **DONE** |
| M5 | Migration V26 & System Sync | Tạo `V26__standardize_radicals_and_hsk1_to_3_vocab_2025.sql`, cập nhật `demo-seed-data.js`, chạy export script tạo 4 file root | M1, M2, M3, M4 | **DONE** |
| M6 | Final Verification, Audit & Acceptance | Script Python kiểm tra 100% (27/27 PASS), chạy backend/frontend test suites, Forensic Audit (CLEAN), Báo cáo nghiệm thu Tiếng Việt | M5 | **DONE** |

## Interface Contracts
### Database Schema ↔ Application Layer
- `RADICAL`:
  - `radical_id`: INT UNSIGNED (1..214) PRIMARY KEY.
  - `character`: VARCHAR(10) NOT NULL UNIQUE (includes canonical character and optional parentheses variants, e.g. `玉(王/玊)`).
  - `meaning_han_viet`: VARCHAR(100) NOT NULL (e.g. `Cân` for #69).
  - `explanation_vi`: VARCHAR(1000) NOT NULL.
- `VOCABULARY`:
  - `vocab_id`: BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY. Strictly preserved.
  - `hanzi`: VARCHAR(100) NOT NULL.
  - `pinyin`: VARCHAR(150) NOT NULL.
  - `meaning_han_viet`: VARCHAR(255) NOT NULL.
  - `meaning_vi`: VARCHAR(500) NOT NULL.
  - `hsk_level`: TINYINT UNSIGNED NOT NULL (0, 1, 2, 3).
  - `hsk_source_id`: INT UNSIGNED (1..1000 for official HSK, NULL for supplementary).
  - `homograph_index`: TINYINT UNSIGNED (1 or 2 for homographs, 1 default).
- `VOCAB_RADICAL`:
  - Composite PK: `(vocab_id, radical_id, hanzi_char)`.
  - `component_type`: ENUM('kangxi_radical', 'structural_component') DEFAULT 'kangxi_radical'.
  - `verification_status`: ENUM('unverified', 'verified', 'disputed') DEFAULT 'verified'.
- `LESSON_VOCABULARY`:
  - Foreign key: `vocab_id` references `VOCABULARY(vocab_id)` ON DELETE RESTRICT.
  - Exactly 200 links across 10 lessons in V17 remain strictly intact.

## Code Layout
- Backend Migrations: `backend/src/main/resources/db/migration/`
- Backend Domain Entities: `backend/src/main/java/com/elearning/entity/`
- Backend Test Suites: `backend/src/test/java/com/elearning/`
- Frontend Seed Data: `frontend/js/api/demo-seed-data.js`
- Frontend Test Runner: `tests/frontend/runner.mjs`
- Export Script: `scripts/export_audit_dataset.py`
- Root Audit Deliverables: `data_kiem_tra_all.json`, `data_kiem_tra_tom_tat.txt`, `bo_thu_214.csv`, `tu_vung_1000.csv`, `data_kiem_tra_all.zip`
