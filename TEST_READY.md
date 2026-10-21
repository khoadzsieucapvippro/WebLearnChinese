# E2E Test Suite Ready

## Test Runner
- Command: `python scripts/verify_hsk_radical_standardization.py`
- Alternative unittest runner: `python -m unittest scripts.verify_hsk_radical_standardization`
- Expected: all 27 tests pass with exit code 0

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 8 | 214 radicals, #69 Cân, variants (#96, #187, #197, #205), #71, 1068 vocab, HSK 1-3 levels, homographs |
| 2. Boundary & Corner | 6 | 14 visual components, 阝 170 (left) vs 163 (right), standalone radicals, phonetic prunings |
| 3. Cross-Feature | 4 | 17+ Han-Viet phonetic groups, 18+ contextual meanings & polysemy (地, 干, 还) |
| 4. Real-World Application | 9 | V17 10 lessons / 200 words, V26 non-destructive safety, multi-source parity |
| **Total** | **27** | Comprehensive 4-tier automated test suite |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| Radicals 214 & #69 Cân | 5 | 5 | ✓ | ✓ |
| Variants (#96, #187, #197, #205) | 5 | 5 | ✓ | ✓ |
| Radical #71 无 | 5 | 5 | ✓ | ✓ |
| Visual Components (14 chars) | 5 | 5 | ✓ | ✓ |
| 阝 Left #170 vs Right #163 | 5 | 5 | ✓ | ✓ |
| Standalone Radicals (no stroke fragments) | 5 | 5 | ✓ | ✓ |
| Phonetic Component Radicals Removal | 5 | 5 | ✓ | ✓ |
| Han-Viet Phonology (17+ groups) | 5 | 5 | ✓ | ✓ |
| Vietnamese Meanings & Polysemy (18+ groups) | 5 | 5 | ✓ | ✓ |
| HSK 2025 Level Alignment & Homographs | 5 | 5 | ✓ | ✓ |
| V17 10 Lessons / 200 Words Foreign Keys | 5 | 5 | ✓ | ✓ |
| V26 Migration & Multi-Source Parity | 5 | 5 | ✓ | ✓ |
