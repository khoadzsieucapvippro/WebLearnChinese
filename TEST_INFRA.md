# E2E Test Infra: Hán Ngữ & 214 Bộ Thủ & HSK 1-3 Standardization

## Test Philosophy
- Opaque-box & requirement-driven verification covering all requirements in `ORIGINAL_REQUEST.md` (R1-R5).
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Scenario Testing.
- Zero tolerance for regressions, data corruption, broken foreign keys, or integrity violations.

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|-------------|:----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Radical #69 斤 | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Radical Variants (#96, #187, #197, #205) | R1 | 5 | 5 | ✓ | ✓ |
| 3 | Radical #71 无 | R1 | 5 | 5 | ✓ | ✓ |
| 4 | Visual Radical Decomposition Rules | R2 | 5 | 5 | ✓ | ✓ |
| 5 | Visual Component Corrections (14 chars) | R2 | 5 | 5 | ✓ | ✓ |
| 6 | 阝 Phụ #170 vs Ấp #163 Distinction | R2 | 5 | 5 | ✓ | ✓ |
| 7 | Phonetic Secondary Radicals Removal | R2 | 5 | 5 | ✓ | ✓ |
| 8 | Han-Viet Phonology Standardization | R3 | 5 | 5 | ✓ | ✓ |
| 9 | Contextual Meaning & Polysemy Split | R3 | 5 | 5 | ✓ | ✓ |
| 10 | HSK 3.0 Level Alignment & Homographs | R4 | 5 | 5 | ✓ | ✓ |
| 11 | Foreign Key & SRS Lesson Preservation | R4 | 5 | 5 | ✓ | ✓ |
| 12 | Flyway Migration V26 & Data Sync | R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **E2E Automated Python Validation Harness**:
  - Script: `scripts/verify_hsk_radical_standardization.py` (or equivalent integrity runner).
  - Asserts exact 214 radicals, #69 = Cân, variants present, #71 clean explanation.
  - Asserts 1068 total vocabularies (300 HSK 1, 200 HSK 2, 500 HSK 3, 68 HSK 0).
  - Asserts 100% of 阝 characters match correct 170 (left) vs 163 (right).
  - Asserts standalone radicals have no stroke fragments.
  - Asserts 17+ Han-Viet corrections and 18+ contextual meanings.
  - Asserts 10 V17 SRS lessons (200 words) intact.
- **Backend Test Suite**:
  - `mvn test -Dtest=ChineseDomainDataAuditTests`
  - `mvn test -Dtest=VocabularyHskAndUnicodeIntegrityTests`
  - `mvn test -Dtest=VocabularyIntegrationTests`
  - `mvn test -Dtest=RadicalIntegrationTests`
  - `mvn test -Dtest=RadicalServiceTests`
  - `mvn test -Dtest=VocabularyDtoTests`
- **Frontend Test Suite**:
  - `node tests/frontend/runner.mjs` (fast tier unit & contract tests)
- **Data Export Parity**:
  - `python scripts/export_audit_dataset.py` creates synchronized artifacts without error.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Database Clean & Migration Replay | V1 through V26, table constraints, foreign keys | High |
| 2 | Learner SRS Session with Standardized Vocabulary | 10 lessons in V17, card progress, meaning/phonetic display | High |
| 3 | Radical Lookup & Visual Chiết Tự Rendering | 214 radicals, left vs right 阝, standalone radicals | High |
| 4 | Homograph Disambiguation & Level Filtering | 点, 花, 会, 站, 过去; HSK 1, 2, 3 level queries | Medium |
| 5 | Offline / Fallback Seed Data Consistency | `demo-seed-data.js` vs backend MySQL V26 vs root export files | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 boundary & corner tests
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
