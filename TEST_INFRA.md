# E2E Test Infrastructure & Verification Architecture

## Overview
This document specifies the automated opaque-box End-to-End (E2E) testing infrastructure for the **E-Learning Chinese Speech & SRS Platform** across Tiers 1–4 per Dual Track guidelines.

The test infrastructure runs deterministically across local development environments and CI pipelines on Windows (PowerShell) and Linux (Bash) without external cloud dependencies.

---

## 1. Test Architecture & Directory Layout

The E2E test suite is located in `tests/e2e/`:

```
tests/e2e/
├── runner.mjs                             # Central CLI test runner with tier filtering & matrix reporting
├── tier1-feature-coverage.test.mjs        # Tier 1: Feature Coverage (TC-T1-01 .. TC-T1-06)
├── tier2-boundary-corner-cases.test.mjs   # Tier 2: Boundary & Corner Cases (TC-T2-01 .. TC-T2-06)
├── tier3-cross-feature-combinations.test.mjs # Tier 3: Cross-Feature Combinations (TC-T3-01 .. TC-T3-04)
├── tier4-application-workloads.test.mjs   # Tier 4: Real-World Application Workloads (TC-T4-01 .. TC-T4-04)
└── utils/
    ├── audio-generator.mjs                # Synthetic WAV generator (silence, clipping, noise, tone, short)
    ├── e2e-test-context.mjs               # Central browser & HTTP interception context
    ├── mock-speech-service.mjs            # Contract-compliant Speech & Tone assessment engine
    └── tone-sandhi.mjs                    # Authoritative Chinese tone sandhi reference oracle
```

---

## 2. Test Execution Commands

The test runner utilizes Node.js built-in test runner (`node:test`, `node:assert/strict`) and `playwright-core` (Chromium / Microsoft Edge headless).

### Run All Tiers (Default)
```powershell
node tests/e2e/runner.mjs
# or explicitly:
node tests/e2e/runner.mjs --tier=all
```

### Run Specific Tiers
```powershell
# Tier 1: Feature Coverage only
node tests/e2e/runner.mjs --tier=1

# Tier 2: Boundary & Corner Cases only
node tests/e2e/runner.mjs --tier=2

# Tier 3: Cross-Feature Combinations only
node tests/e2e/runner.mjs --tier=3

# Tier 4: Real-World Application Workloads only
node tests/e2e/runner.mjs --tier=4
```

### Run Direct Subtest Files via Node.js
```powershell
node --test tests/e2e/tier1-feature-coverage.test.mjs
node --test tests/e2e/tier2-boundary-corner-cases.test.mjs
node --test tests/e2e/tier3-cross-feature-combinations.test.mjs
node --test tests/e2e/tier4-application-workloads.test.mjs
```

---

## 3. Test Case Catalogue (20 Test Cases)

### Tier 1: Feature Coverage (6 Tests)
| Test ID | Name | Test Input | Authoritative Source | Expected Output / Pass Criteria |
|---------|------|------------|----------------------|----------------------------------|
| **TC-T1-01** | Audio Playback Engine & Controller Contract | Browser interaction with `#btnAudioPronounceFront` | `PROJECT.md` § Interface Contract 3 | Audio button locks during playback, 3-tier fallback triggers, zero uncaught promise rejections |
| **TC-T1-02** | Speech Evaluation Endpoint Contract | Synthetic speech WAV (1.2s), "你好", "nǐ hǎo" | `PROJECT.md` § Interface Contract 1 & 2 | Response JSON has `status: "assessed"`, overallScore, toneScore, fluencyScore, syllables breakdown |
| **TC-T1-03** | Tone Sandhi Engine Rules | Canonical pairs: 你好 (3+3), 不对/不好 (不), 一个/一天 (一), 北京 (half 3rd) | HSK 3.0 Standard & Chinese Phonetics | Canonical sandhi tones: 你好 -> 2+3, 不对 -> 2+4, 不好 -> 4+3, 一个 -> 2+4, 一天 -> 4+1, 第一 -> 4+1 |
| **TC-T1-04** | Kangxi Radicals Data Integrity | `bo_thu_214.csv` | Unicode Kangxi & GF 0011-2009 | Exactly 214 radicals, #69 斤 is "Cân" (not "Cẩn"), variants on #96, #187, #197, #205 |
| **TC-T1-05** | HSK 1-3 Vocabulary Data Integrity | `tu_vung_1000.csv` | Official HSK 3.0 Syllabus (Nov 2025) | Exactly 1,068 rows (300 HSK 1, 200 HSK 2, 500 HSK 3, 68 HSK 0), homograph separation, HSK level alignment |
| **TC-T1-06** | SRS Flashcard Review Flow | Review session due cards | SM-2 Algorithm Specification | Front prompt renders, 3D flip reveals answer, rating [3] Good submits payload to `/api/v1/srs/review` |

### Tier 2: Boundary & Corner Cases (6 Tests)
| Test ID | Name | Test Input | Quality Gate Threshold | Expected Output / Pass Criteria |
|---------|------|------------|------------------------|----------------------------------|
| **TC-T2-01** | Silence Audio Quality Gate | Pure silence WAV (RMS = 0.0) | RMS < 0.006 | `status: "not_scorable"`, `overallScore: null`, `reason: "silence_detected"`, zero fake score |
| **TC-T2-02** | Background Noise Quality Gate | High-variance white noise WAV | Zero-crossing rate > 0.25 & RMS > 0.05 | `status: "not_scorable"`, `overallScore: null`, `reason: "excessive_noise"` |
| **TC-T2-03** | Audio Clipping Quality Gate | Saturated high-gain WAV | Clipping ratio > 2% | `status: "not_scorable"`, `overallScore: null`, `reason: "audio_clipping"` |
| **TC-T2-04** | Short Audio Quality Gate | Brief audio WAV (0.20s) | Duration < 0.35s | `status: "not_scorable"`, `overallScore: null`, `reason: "audio_too_short"` |
| **TC-T2-05** | Triple 3rd Tone Sandhi | "我很好" (wǒ hěn hǎo), "买手表" | Syntactic sandhi parsing | Transforms to 2+2+3 sequence without stack overflow or NaN |
| **TC-T2-06** | Rapid Audio Clicking Stress Test | 10 clicks in 100ms on audio button | Anti-spam throttling | Button lock prevents race conditions, zero uncaught errors or memory leaks |

### Tier 3: Cross-Feature Combinations (4 Tests)
| Test ID | Name | Interaction Combination | Expected Output / Pass Criteria |
|---------|------|-------------------------|----------------------------------|
| **TC-T3-01** | Card Flip During Audio Playback | Click audio button + Space key immediately | Card flips smoothly to `#cardBack`, audio cleans up without throwing uncaught rejection |
| **TC-T3-02** | Reading Room Shortcut Isolation | Press keys [1], [2], [3], [4] in Reading Room | Rating bar strictly hidden, zero review requests sent, item does not skip |
| **TC-T3-03** | Listening Room Shortcut Isolation | Press keys [1], [2], [3], [4] in Listening Room | Rating bar strictly hidden, zero review requests sent |
| **TC-T3-04** | Review Failure Resilience | Submit review while API returns HTTP 500 | Error notice displayed, card remains on screen, session is not prematurely terminated |

### Tier 4: Real-World Application Workloads (4 Tests)
| Test ID | Name | Workflow Scope | Expected Output / Pass Criteria |
|---------|------|----------------|----------------------------------|
| **TC-T4-01** | Multi-Card SRS Learning Lifecycle | 3-card session: Again (1) requeues, Good (3), Easy (4), Again card completed | Session finishes at `#srsCompletedState`, totalReviewed >= 3, againCount >= 1, goodEasyCount >= 2 |
| **TC-T4-02** | Real-World Listening Workflow | Play audio -> submit incorrect -> error notice -> submit correct -> advance | Next button unlocked only after correct answer, review submitted with `cardType: 'LISTENING'` |
| **TC-T4-03** | Real-World Reading Workflow | View prompt -> simulate score -> State D displayed -> Next button advances | Syllable breakdown rendered, overallScore badge visible, review submitted with `cardType: 'READING'` |
| **TC-T4-04** | Seamless Multi-Skill Quick Switching | Flashcard -> Reading -> Listening -> Flashcard | DOM containers mount/unmount cleanly without view collisions or console errors |

---

## 4. Quality Thresholds & Performance Budgets

| Metric | Budget / Threshold | Verification Method |
|--------|-------------------|---------------------|
| Full Suite Wall-Clock Time | < 30.0s | Measured by `runner.mjs` (actual: 24.24s) |
| Silence Rejection Threshold | RMS < 0.006 | Physical RMS energy calculation in `audio-generator.mjs` |
| Audio Clipping Threshold | > 2.0% of samples saturated | Ratio of samples with absolute value >= 32,760 |
| Short Audio Threshold | Duration < 0.35s | Subchunk2 data size / sampleRate |
| Zero Fake Score Policy | 100% strict | On un-scorable audio, `overallScore` MUST be `null` |
| Console Runtime Errors | 0 fatal errors | Monitored via Playwright `pageerror` and `console.error` |
