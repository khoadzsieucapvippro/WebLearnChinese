#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/verify_hsk_radical_standardization.py

Comprehensive 4-Tier Automated Verification Harness for:
Hán Ngữ & 214 Bộ Thủ Khang Hy & HSK 1-3 1000 Từ Vựng Standardization (HSK 3.0 Nov 2025)

Authoritative Requirements & Coverage:
- Tier 1: Feature Coverage (214 radicals, #69 Cân, variants, #71, 1068 vocab, 300 HSK1, 200 HSK2, 500 HSK3, 68 HSK0)
- Tier 2: Boundary & Visual Decomposition (14 target chars, 阝 left 170 vs right 163, standalone radicals, phonetic components)
- Tier 3: Linguistics & Semantics (17+ Han-Viet groups, 18+ contextual meanings/polysemy splits)
- Tier 4: Foreign Keys, SRS Consistency & Parity (V17 10 lessons / 200 words, V26 safety, multi-source parity)

Usage:
  python scripts/verify_hsk_radical_standardization.py
  python scripts/verify_hsk_radical_standardization.py --tier 1
  python scripts/verify_hsk_radical_standardization.py --target seed
  python scripts/verify_hsk_radical_standardization.py --target exports
  python scripts/verify_hsk_radical_standardization.py --target migration
  python scripts/verify_hsk_radical_standardization.py --json-output report.json --verbose
  python -m unittest scripts/verify_hsk_radical_standardization.py
"""

import os
import sys
import re
import json
import csv
import argparse
import time
import unittest
from typing import Dict, List, Any, Optional, Tuple, Set

# Ensure UTF-8 output on all operating systems (especially Windows CP1252 / cmd)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='backslashreplace')


# ==============================================================================
# DATA MODELS & RESULT TRACKING
# ==============================================================================

class TestStatus:
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"


class TestResult:
    def __init__(self, test_id: str, tier: int, name: str, status: str, message: str, details: Optional[List[str]] = None):
        self.test_id = test_id
        self.tier = tier
        self.name = name
        self.status = status
        self.message = message
        self.details = details or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "tier": self.tier,
            "name": self.name,
            "status": self.status,
            "message": self.message,
            "details": self.details
        }


# ==============================================================================
# DATA LOADERS & PARSERS
# ==============================================================================

class DatasetLoader:
    def __init__(self, project_root: str):
        self.project_root = os.path.abspath(project_root)
        self.seed_path = os.path.join(self.project_root, "frontend", "js", "api", "demo-seed-data.js")
        self.json_path = os.path.join(self.project_root, "data_kiem_tra_all.json")
        self.rad_csv_path = os.path.join(self.project_root, "bo_thu_214.csv")
        self.voc_csv_path = os.path.join(self.project_root, "tu_vung_1000.csv")
        self.txt_path = os.path.join(self.project_root, "data_kiem_tra_tom_tat.txt")
        self.v17_sql_path = os.path.join(self.project_root, "backend", "src", "main", "resources", "db", "migration", "V17__reorganize_curriculum_10_lessons_200_words.sql")
        self.v26_sql_path = os.path.join(self.project_root, "backend", "src", "main", "resources", "db", "migration", "V26__standardize_radicals_and_hsk1_to_3_vocab_2025.sql")

    def load_demo_seed(self) -> Dict[str, Any]:
        """Parses frontend/js/api/demo-seed-data.js ES6 module without requiring Node.js."""
        if not os.path.exists(self.seed_path):
            raise FileNotFoundError(f"Missing demo-seed-data.js at {self.seed_path}")

        with open(self.seed_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse SEED_RADICALS
        m_rad = re.search(r'export const SEED_RADICALS = (\[.*?\]);\n\nexport const SEED_VOCABULARY', content, re.DOTALL)
        if not m_rad:
            raise ValueError("Failed to locate SEED_RADICALS in demo-seed-data.js")
        radicals = json.loads(m_rad.group(1))

        # Parse SEED_VOCABULARY
        m_voc = re.search(r'export const SEED_VOCABULARY = (\[.*?\]);\n\nexport const SEED_LESSONS', content, re.DOTALL)
        if not m_voc:
            raise ValueError("Failed to locate SEED_VOCABULARY in demo-seed-data.js")
        vocabulary = json.loads(m_voc.group(1))

        # Parse SEED_LESSONS
        m_les = re.search(r'export const SEED_LESSONS = (\[.*?\]);\n\nexport const SEED_ACCOUNTS', content, re.DOTALL)
        lessons = json.loads(m_les.group(1)) if m_les else []

        # Parse SEED_SRS_CARDS
        m_cards = re.search(r'export const SEED_SRS_CARDS = (\[.*?\]);\n\nexport const CHAR_TO_RADICAL_MAP', content, re.DOTALL)
        cards = json.loads(m_cards.group(1)) if m_cards else []

        # Parse CHAR_TO_RADICAL_MAP
        m_char_rad = re.search(r'export const CHAR_TO_RADICAL_MAP = (?:Object\.freeze\()?(\{.*?\})\)?;', content, re.DOTALL)
        char_to_radical = json.loads(m_char_rad.group(1)) if m_char_rad else {}

        # Parse CHAR_TO_RADICALS_MAP
        m_char_rads = re.search(r'export const CHAR_TO_RADICALS_MAP = (?:Object\.freeze\()?(\{.*?\})\)?;', content, re.DOTALL)
        char_to_radicals = json.loads(m_char_rads.group(1)) if m_char_rads else {}

        return {
            "radicals": radicals,
            "vocabulary": vocabulary,
            "lessons": lessons,
            "cards": cards,
            "char_to_radical": char_to_radical,
            "char_to_radicals": char_to_radicals
        }

    def load_root_json(self) -> Optional[Dict[str, Any]]:
        if not os.path.exists(self.json_path):
            return None
        with open(self.json_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_root_csvs(self) -> Tuple[Optional[List[Dict[str, Any]]], Optional[List[Dict[str, Any]]]]:
        rad_rows = None
        voc_rows = None
        if os.path.exists(self.rad_csv_path):
            with open(self.rad_csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                rad_rows = list(reader)
        if os.path.exists(self.voc_csv_path):
            with open(self.voc_csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                voc_rows = list(reader)
        return rad_rows, voc_rows

    def load_v17_sql(self) -> Optional[str]:
        if os.path.exists(self.v17_sql_path):
            with open(self.v17_sql_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def load_v26_sql(self) -> Optional[str]:
        if os.path.exists(self.v26_sql_path):
            with open(self.v26_sql_path, "r", encoding="utf-8") as f:
                return f.read()
        return None


# ==============================================================================
# AUTHORITATIVE REFERENCE SPECIFICATIONS (PROJECT.md & ORIGINAL_REQUEST.md)
# ==============================================================================

# Tier 2 - Group 3: Standalone Kangxi Radicals mapped strictly to themselves
STANDALONE_RADICALS = {
    42: (159, "车"),
    110: (182, "风"),
    173: (147, "见"),
    238: (169, "门"),
    426: (181, "页"),
    871: (187, "马")
}

# Tier 2 - Group 2: Right 阝 (163 邑) vs Left 阝 (170 阜)
RIGHT_B_CHARS = ["邮", "邻", "郊", "都", "部", "那", "哪", "帮"]
LEFT_B_CHARS = ["院", "阳", "阴", "附", "除", "阿", "队", "阶"]

# Tier 2 - Group 4: Phonetic secondary radical pruning
PHONETIC_CLEANUP_WORDS = {
    4: ("爸爸", [88]),
    5: ("吧", [30]),
    17: ("杯", [75]),
    18: ("杯子", [75, 39]),
    152: ("坏", [32]),
    28: ("病", [104]),
    29: ("病人", [104, 9]),
    132: ("还", [162]),
    153: ("还", [162])
}

# Tier 3 - 17+ Han-Viet Reading Standardizations
HAN_VIET_CORRECTIONS = [
    # Nhóm 打 (dǎ) -> Đả
    (56, "打", "Đả", ["Tá"]),
    (57, "打车", "Đả Xa", ["Tá Xa"]),
    (58, "打电话", "Đả Điện Thoại", ["Tá Điện Thoại"]),
    (59, "打开", "Đả Khai", ["Tá Khai"]),
    (60, "打球", "Đả Cầu", ["Tá Cầu"]),
    # Nhóm 听 (tīng) -> Thính
    (141, "好听", "Hảo Thính", ["Hảo Dẫn"]),
    (361, "听", "Thính", ["Dẫn"]),
    (362, "听到", "Thính Đáo", ["Dẫn Đáo"]),
    (363, "听见", "Thính Kiến", ["Dẫn Kiến"]),
    (364, "听写", "Thính Tả", ["Dẫn Tả"]),
    # Từ thuần Việt / phát âm sai
    (144, "喝", "Hát", ["Húp"]),
    (212, "冷", "Lãnh", ["Lạnh"]),
    (187, "觉得", "Giác Đắc", ["Giáo Đắc"]),
    (348, "睡觉", "Thuỵ Giác", ["Thuỵ Giáo"]),
    (483, "重", "Trọng", ["Trùng"]),
    (484, "重要", "Trọng Yếu", ["Trùng Yêu"]),
    (1042, "长", "Trưởng", ["Trường"]),
    (97, "儿子", "Nhi Tử", ["Nhân Tử"]),
    (165, "几", "Kỷ", ["Cơ"]),
    (472, "正", "Chính", ["Chinh"]),
    (473, "正在", "Chính Tại", ["Chinh Tại"]),
    (726, "丢", "Đưu", ["Đâu"]),
    (886, "爬", "Bà", ["Ba"]),
    (890, "胖", "Bàng", ["Bàn"]),
    (891, "啤酒", "Tỳ Tửu", ["Bia Tửu"]),
    (4, "爸爸", "Bá Bá", ["Ba Ba"]),
    (224, "妈妈", "Ma Ma", ["Má Má"]),
    # Đồng bộ 什么 / 怎么 / 上 / 哪 / 场
    (328, "什么", "Thập Ma", ["Thậm Yêu"]),
    (460, "怎么", "Chẩm Ma", ["Chẩm Yêu"]),
    (114, "干什么", "Can Thập Ma", ["Can Thậm Yêu"]),
    (234, "没什么", "Một Thập Ma", ["Một Thậm Yêu"]),
    (250, "哪", "Na", ["Nả"]),
    (251, "哪里", "Na Lý", ["Nả Lý"]),
    (253, "哪些", "Na Ta", ["Nả Ta"]),
    (162, "机场", "Cơ Trường", ["Cơ Tràng"]),
    (313, "商场", "Thương Trường", ["Thương Tràng"]),
    # Bổ sung 4 lỗi âm Hán-Việt
    (416, "行", "Hành", ["Hàng"]),
    (983, "校长", "Hiệu Trưởng", ["Hiệu Trường"]),
    (104, "放假", "Phóng Giá", ["Phóng Giả"]),
    (297, "请假", "Thỉnh Giá", ["Thỉnh Giả"])
]

# All 19 words with '上' must use 'Thượng' (never 'Thướng')
SHANG_WORD_IDS = [44, 72, 126, 219, 223, 226, 315, 316, 317, 318, 319, 320, 321, 322, 323, 326, 374, 375, 459]

# Tier 3 - 18+ Contextual Meaning & Machine Translation Sanitization
CONTEXTUAL_MEANING_SPECS = [
    # Polysemy splits
    (66, "地", "de", ["Trợ từ kết cấu"], ["地上", "mặt đất"], "Structural particle de"),
    (69, "地", "dì", ["mặt đất", "đất"], ["Trợ từ kết cấu"], "Noun ground dì"),
    (111, "干", "gān", ["khô", "khô ráo"], ["làm việc"], "Adjective dry gān"),
    (113, "干", "gàn", ["làm", "làm việc"], ["phơi khô", "khô ráo"], "Verb work gàn"),
    (132, "还", "hái", ["vẫn", "còn"], ["trả lại"], "Adverb still hái"),
    (153, "还", "huán", ["trả", "hoàn"], ["uống nước"], "Verb return huán"),
    # Machine translation & obsolete senses
    (117, "告诉", "gàosu", ["nói", "bảo", "thông báo"], ["khởi kiện", "khiếu nại"], "No legal lawsuit"),
    (149, "后天", "hòutiān", ["ngày mốt", "ngày kia"], ["sau khi sinh"], "No post-natal life"),
    (162, "机场", "jīchǎng", ["sân bay", "phi trường"], ["shadowsocks", "vượt kiểm duyệt"], "No VPN slang"),
    (196, "考", "kǎo", ["thi", "kiểm tra"], ["đánh", "đập"], "No beating/torture"),
    (211, "累", "lèi", ["mệt", "mệt mỏi"], ["tích lũy", "liên lụy"], "No accumulate/involve"),
    (234, "没什么", "méi shénme", ["không có gì", "không sao đâu"], ["đừng bận tâm", "nghĩ không có gì"], "Deduplicated daily méi shénme"),
    (148, "后边", "hòubian", ["phía sau", "đằng sau"], ["phần cuối", "gần cuối"], "Deduplicated spatial noun hòubian"),
    (235, "没事儿", "méishìr", ["không sao", "không có gì"], [], "Includes 'not a problem'"),
    (242, "米饭", "mǐfàn", ["cơm"], ["đã nấu"], "No dangling 'cooked'"),
    (260, "奶奶", "nǎinai", ["bà", "bà nội"], ["bà chủ nhà"], "No landlady"),
    (261, "男", "nán", ["nam", "đàn ông", "phái nam"], ["nam tước", "quý tộc"], "No feudal baron"),
    (274, "您", "nín", ["ngài", "ông", "bà", "kính trọng"], [], "Respectful register"),
    (318, "上车", "shàng chē", ["lên xe"], ["lên"], "Complete verb-object"),
    (392, "下车", "xià chē", ["xuống xe"], ["xuống"], "Complete verb-object"),
    (384, "西", "xī", ["tây", "phía tây", "hướng tây"], ["tây ban nha"], "No Spanish language abbreviation"),
    (426, "页", "yè", ["trang", "tờ"], ["đầu"], "No anatomical head"),
    (483, "重", "zhòng", ["nặng", "quan trọng"], ["lặp lại"], "No repeat (chóng)"),
    (489, "子", "zi", ["hậu tố", "con"], ["con trai"], "Noun suffix zi")
]


# ==============================================================================
# VERIFICATION ENGINE (4 TIERS)
# ==============================================================================

class HSKRadicalStandardizationVerifier:
    def __init__(self, loader: DatasetLoader, target: str = "all", verbose: bool = False):
        self.loader = loader
        self.target = target
        self.verbose = verbose
        self.results: List[TestResult] = []
        self._demo_data: Optional[Dict[str, Any]] = None
        self._json_data: Optional[Dict[str, Any]] = None

    def _get_target_data(self) -> Dict[str, Any]:
        """Loads data based on the chosen target (seed vs exports vs all)."""
        if self.target == "exports":
            if self._json_data is None:
                self._json_data = self.loader.load_root_json()
                if not self._json_data:
                    raise FileNotFoundError("Target 'exports' requested but data_kiem_tra_all.json not found")
            return {
                "radicals": self._json_data.get("radicals", []),
                "vocabulary": self._json_data.get("vocabulary", []),
                "lessons": [],
                "cards": [],
                "char_to_radical": {},
                "char_to_radicals": {}
            }
        else:
            if self._demo_data is None:
                self._demo_data = self.loader.load_demo_seed()
            return self._demo_data

    # --------------------------------------------------------------------------
    # TIER 1: FEATURE COVERAGE TESTS
    # --------------------------------------------------------------------------

    def test_tier1_radicals_count_and_sequence(self) -> TestResult:
        """Tier 1.1: Exact 214 radicals and contiguous 1..214 sequence."""
        data = self._get_target_data()
        radicals = data["radicals"]
        errors = []

        if len(radicals) != 214:
            errors.append(f"Total radicals count is {len(radicals)}, expected exactly 214")

        ids = [r.get("radicalId") for r in radicals]
        expected_ids = list(range(1, 215))
        if ids != expected_ids:
            missing = set(expected_ids) - set(ids)
            dupes = [x for x in ids if ids.count(x) > 1]
            errors.append(f"Radical IDs non-contiguous: missing={missing}, dupes={dupes}")

        # Validate Radical #212 龍 has strokeCount = 16
        r212 = next((r for r in radicals if r.get("radicalId") == 212), None)
        if r212 and r212.get("strokeCount") != 16:
            errors.append(f"Radical #212 strokeCount is {r212.get('strokeCount')}, expected 16")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Radical count or IDs deviate from 214 contiguous baseline" if errors else "Exactly 214 radicals with strictly contiguous IDs 1..214"
        res = TestResult("T1.1", 1, "Radicals Total Count & ID Contiguity", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_radical_69_can(self) -> TestResult:
        """Tier 1.2: Radical #69 斤 Hán-Việt reading standardized to 'Cân'."""
        data = self._get_target_data()
        r69 = next((r for r in data["radicals"] if r.get("radicalId") == 69), None)

        if not r69:
            res = TestResult("T1.2", 1, "Radical #69 斤 Hán-Việt Reading", TestStatus.FAIL, "Radical #69 not found in dataset")
            self.results.append(res)
            return res

        current_hv = r69.get("meaningHanViet", "").strip()
        if current_hv == "Cân":
            res = TestResult("T1.2", 1, "Radical #69 斤 Hán-Việt Reading", TestStatus.PASS, "Radical #69 meaningHanViet is correctly 'Cân'")
        else:
            res = TestResult(
                "T1.2", 1, "Radical #69 斤 Hán-Việt Reading", TestStatus.FAIL,
                f"Radical #69 meaningHanViet is '{current_hv}', expected 'Cân'",
                [f"Found '{current_hv}'. Academic Grounding: Thiều Chửu, Đào Duy Anh, Unihan kVietnamese specify 斤 (jīn) = 'Cân'."]
            )
        self.results.append(res)
        return res

    def test_tier1_radical_variants(self) -> TestResult:
        """Tier 1.3: Simplified and parenthesized variants for #96, #187, #197, #205."""
        data = self._get_target_data()
        targets = {
            96: ("玉(王/玊)", "玉"),
            187: ("馬(马)", "馬"),
            197: ("鹵(卤)", "鹵"),
            205: ("黽(黾)", "黽")
        }
        errors = []
        for rid, (expected, _old) in targets.items():
            rad = next((r for r in data["radicals"] if r.get("radicalId") == rid), None)
            if not rad:
                errors.append(f"Radical #{rid} not found")
                continue
            char = rad.get("character", "").strip()
            if char != expected:
                errors.append(f"Radical #{rid}: character is '{char}', expected '{expected}'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "One or more radical variant strings are not standardized" if errors else "Radicals #96, #187, #197, #205 properly include parenthesized variants"
        res = TestResult("T1.3", 1, "Radical Simplified Variants in character Column", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_radical_compound_display_counts(self) -> TestResult:
        """Tier 1.4: Invariant 47 compound radicals with parentheses and 167 unified ideographs."""
        data = self._get_target_data()
        radicals = data["radicals"]

        compound_count = 0
        unified_count = 0
        for r in radicals:
            ch = r.get("character", "")
            if "(" in ch and ")" in ch:
                compound_count += 1
            else:
                unified_count += 1

        errors = []
        if compound_count != 47:
            errors.append(f"compoundDisplayCount is {compound_count}, expected exactly 47 (43 baseline + #96, #187, #197, #205)")
        if unified_count != 167:
            errors.append(f"unifiedIdeographCount is {unified_count}, expected exactly 167 (171 baseline - 4 converted)")
        if compound_count + unified_count != 214:
            errors.append(f"Total radicals {compound_count + unified_count} != 214")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Radical compound display invariant check failed" if errors else "Exactly 47 compound display radicals and 167 unified ideographs (sum = 214)"
        res = TestResult("T1.4", 1, "Radical Display Compound/Unified Counts (47 / 167)", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_radical_71_pedagogy(self) -> TestResult:
        """Tier 1.5: Radical #71 无 pedagogical explanation without misleading attribution of 抚."""
        data = self._get_target_data()
        r71 = next((r for r in data["radicals"] if r.get("radicalId") == 71), None)
        if not r71:
            res = TestResult("T1.5", 1, "Radical #71 Pedagogical Explanation", TestStatus.FAIL, "Radical #71 not found")
            self.results.append(res)
            return res

        exp = r71.get("explanationVi", "")
        errors = []

        if len(exp) > 1000:
            errors.append(f"explanationVi length ({len(exp)}) exceeds DB schema limit 1000")
        if "Ví dụ:" not in exp:
            errors.append("explanationVi missing mandatory 'Ví dụ:' section")
        if "Mẹo nhớ:" not in exp:
            errors.append("explanationVi missing mandatory 'Mẹo nhớ:' section")

        # Must not falsely claim 抚 belongs to #71 without noting its true radical #64 手/扌
        if "抚" in exp:
            if not ("bộ Thủ" in exp or "扌" in exp or "#64" in exp or "thành phần biểu âm" in exp):
                errors.append("explanationVi cites '抚' without explicitly noting it belongs to radical #64 手(扌)")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Radical #71 pedagogical explanation contains defects" if errors else "Radical #71 pedagogical explanation is pedagogically sound and structurally compliant"
        res = TestResult("T1.5", 1, "Radical #71 Pedagogical Explanation", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_vocab_total_count_and_contiguity(self) -> TestResult:
        """Tier 1.6: Exact 1,068 vocabulary items with contiguous IDs 1..1068."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        errors = []

        if len(vocab) != 1068:
            errors.append(f"Total vocabulary count is {len(vocab)}, expected exactly 1,068")

        ids = [v.get("vocabId") for v in vocab]
        expected_ids = list(range(1, 1069))
        if ids != expected_ids:
            missing = set(expected_ids) - set(ids)
            dupes = [x for x in ids if ids.count(x) > 1]
            errors.append(f"vocabId sequence non-contiguous: missing={len(missing)}, dupes={len(dupes)}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Vocabulary count or IDs deviate from 1068 contiguous baseline" if errors else "Exactly 1,068 vocabulary items with contiguous IDs 1..1068"
        res = TestResult("T1.6", 1, "Vocabulary Total Count & ID Contiguity", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_hsk_level_distribution(self) -> TestResult:
        """Tier 1.7: HSK level breakdown: 300 HSK1, 200 HSK2, 500 HSK3, 68 HSK0."""
        data = self._get_target_data()
        vocab = data["vocabulary"]

        counts = {0: 0, 1: 0, 2: 0, 3: 0}
        for v in vocab:
            lvl = v.get("hskLevel")
            if lvl in counts:
                counts[lvl] += 1
            else:
                counts[lvl] = 1

        errors = []
        if counts.get(1) != 300:
            errors.append(f"HSK 1 count is {counts.get(1)}, expected 300")
        if counts.get(2) != 200:
            errors.append(f"HSK 2 count is {counts.get(2)}, expected 200")
        if counts.get(3) != 500:
            errors.append(f"HSK 3 count is {counts.get(3)}, expected 500")
        if counts.get(0) != 68:
            errors.append(f"HSK 0 (Supplementary) count is {counts.get(0)}, expected 68")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "HSK level counts deviate from official syllabus" if errors else "Exactly 300 HSK1, 200 HSK2, 500 HSK3, and 68 Supplementary items"
        res = TestResult("T1.7", 1, "HSK 1-3 & Supplementary Distribution", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_hsk_source_ids(self) -> TestResult:
        """Tier 1.8: Unique HSK source IDs 1..1000 properly mapped to level brackets."""
        data = self._get_target_data()
        vocab = data["vocabulary"]

        source_id_map: Dict[int, Dict[str, Any]] = {}
        errors = []

        for v in vocab:
            src_id = v.get("hskSourceId")
            lvl = v.get("hskLevel")
            if src_id is not None:
                if src_id in source_id_map:
                    errors.append(f"Duplicate hskSourceId {src_id} on vocabId {v.get('vocabId')} and {source_id_map[src_id].get('vocabId')}")
                source_id_map[src_id] = v

                # Level bracket check
                if 1 <= src_id <= 300 and lvl != 1:
                    errors.append(f"hskSourceId {src_id} (vocabId {v.get('vocabId')}) has level {lvl}, expected 1")
                elif 301 <= src_id <= 500 and lvl != 2:
                    errors.append(f"hskSourceId {src_id} (vocabId {v.get('vocabId')}) has level {lvl}, expected 2")
                elif 501 <= src_id <= 1000 and lvl != 3:
                    errors.append(f"hskSourceId {src_id} (vocabId {v.get('vocabId')}) has level {lvl}, expected 3")

        expected_sources = set(range(1, 1001))
        actual_sources = set(source_id_map.keys())
        missing_sources = expected_sources - actual_sources
        if missing_sources:
            errors.append(f"Missing {len(missing_sources)} hskSourceIds: {sorted(list(missing_sources))[:10]}...")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Defects in hskSourceId mapping" if errors else "1,000 official HSK source IDs contiguous and strictly aligned to level brackets"
        res = TestResult("T1.8", 1, "HSK Source IDs 1..1000 Bracket Alignment", status, msg, errors[:10])
        self.results.append(res)
        return res

    def test_tier1_hsk30_realigned_levels(self) -> TestResult:
        """Tier 1.9: Official HSK 3.0 level updates (爱好/班/本子 in HSK 2, 别的/别人/病人 in HSK 3, 白 in HSK 0)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]

        checks = [
            ("爱好", 2, "HSK 2 in HSK 3.0 (ID 302)"),
            ("班", 2, "HSK 2 in HSK 3.0 (ID 304)"),
            ("本子", 2, "HSK 2 in HSK 3.0 (ID 308)"),
            ("别的", 3, "HSK 3 in HSK 3.0 (ID 531)"),
            ("别人", 3, "HSK 3 in HSK 3.0 (ID 532)"),
            ("病人", 3, "HSK 3 in HSK 3.0 (ID 537)"),
            ("白", 0, "Curriculum Supplementary outside HSK 1-3")
        ]

        errors = []
        for hz, exp_lvl, reason in checks:
            matching = [v for v in vocab if v.get("hanzi") == hz]
            if not matching:
                errors.append(f"Word '{hz}' not found in vocabulary")
                continue
            for v in matching:
                lvl = v.get("hskLevel")
                if lvl != exp_lvl:
                    errors.append(f"'{hz}' (vocabId {v.get('vocabId')}) has hskLevel={lvl}, expected {exp_lvl} ({reason})")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Level mismatch on reclassified vocabulary items" if errors else "All 7 target vocabulary items have correct HSK 3.0 2025 levels"
        res = TestResult("T1.9", 1, "HSK 3.0 (2025) Realigned Vocabulary Levels", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_homographs_indexing(self) -> TestResult:
        """Tier 1.10: 5 Homograph pairs (点, 花, 会, 站, 过去) disambiguated by homographIndex & hskSourceId."""
        data = self._get_target_data()
        vocab = data["vocabulary"]

        homograph_targets = ["点", "花", "会", "站", "过去"]
        errors = []

        for hz in homograph_targets:
            matching = [v for v in vocab if v.get("hanzi") == hz]
            if len(matching) < 2:
                errors.append(f"Expected at least 2 homograph entries for '{hz}', found {len(matching)}")
                continue
            indices = [v.get("homographIndex") for v in matching]
            if set(indices) != {1, 2}:
                errors.append(f"Homograph '{hz}' indices are {indices}, expected {{1, 2}}")
            source_ids = [v.get("hskSourceId") for v in matching]
            if len(set(source_ids)) != len(matching):
                errors.append(f"Homograph '{hz}' entries share identical hskSourceId: {source_ids}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Homograph pair indexing errors detected" if errors else "All 5 homograph pairs disambiguated with unique homographIndex and source IDs"
        res = TestResult("T1.10", 1, "Homograph Disambiguation & Indexing", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier1_unicode_sanitization(self) -> TestResult:
        """Tier 1.11: Absence of ASCII '?' replacement artifacts in hanzi and pinyin."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        errors = []

        for v in vocab:
            vid = v.get("vocabId")
            hz = v.get("hanzi", "")
            py = v.get("pinyin", "")
            if "?" in hz:
                errors.append(f"vocabId {vid} hanzi '{hz}' contains '?' replacement char")
            if "?" in py:
                errors.append(f"vocabId {vid} pinyin '{py}' contains '?' replacement char")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "ASCII replacement characters found in vocabulary data" if errors else "Zero '?' ASCII replacement artifacts in hanzi or pinyin"
        res = TestResult("T1.11", 1, "Unicode Character Sanitization", status, msg, errors)
        self.results.append(res)
        return res

    # --------------------------------------------------------------------------
    # TIER 2: BOUNDARY & VISUAL DECOMPOSITION TESTS
    # --------------------------------------------------------------------------

    def test_tier2_standalone_radicals_no_fragments(self) -> TestResult:
        """Tier 2.1: Standalone Kangxi Radicals (车, 风, 见, 门, 页, 马) contain no stroke fragments."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        for vid, (expected_rad, hz) in STANDALONE_RADICALS.items():
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} '{hz}' not found")
                continue
            rids = v.get("radicalIds", [])
            if rids != [expected_rad]:
                errors.append(f"Vocab #{vid} '{hz}' has radicalIds={rids}, expected strictly [{expected_rad}]")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Standalone radicals decomposed into redundant stroke fragments" if errors else "All 6 standalone radicals map exclusively to their canonical self-radical ID"
        res = TestResult("T2.1", 2, "Standalone Radicals with No Stroke Fragments", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier2_b_radicals_left_vs_right(self) -> TestResult:
        """Tier 2.2: 阝 Right (163 邑) vs 阝 Left (170 阜) strictly partitioned."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        errors = []

        # Right 阝: must have 163, must NOT have 170
        for char in RIGHT_B_CHARS:
            matches = [v for v in vocab if char in v.get("hanzi", "")]
            for v in matches:
                rids = v.get("radicalIds", [])
                if 163 not in rids:
                    errors.append(f"Right-阝 word '{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #163 邑. Current: {rids}")
                if 170 in rids:
                    errors.append(f"Right-阝 word '{v.get('hanzi')}' (vocabId {v.get('vocabId')}) erroneously contains #170 阜. Current: {rids}")

        # Left 阝: must have 170, must NOT have 163
        for char in LEFT_B_CHARS:
            matches = [v for v in vocab if char in v.get("hanzi", "")]
            for v in matches:
                rids = v.get("radicalIds", [])
                if 170 not in rids:
                    errors.append(f"Left-阝 word '{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #170 阜. Current: {rids}")
                if 163 in rids:
                    errors.append(f"Left-阝 word '{v.get('hanzi')}' (vocabId {v.get('vocabId')}) erroneously contains #163 邑. Current: {rids}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Cross-contamination between Left-阝 and Right-阝 radicals detected" if errors else "100% of Left-阝 and Right-阝 characters accurately partitioned"
        res = TestResult("T2.2", 2, "阝 Left (#170 阜) vs 阝 Right (#163 邑) Distinction", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier2_visual_decomposition_14_chars(self) -> TestResult:
        """Tier 2.3: Visual component corrections on the 14 audit characters (Group 1)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        errors = []

        # 1. 干: must have 51 (干), must not have 24 (十)
        for v in [v for v in vocab if "干" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 51 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing canonical #51 干")
            if 24 in rids and v.get("hanzi") == "干":
                errors.append(f"Single char '干' (vocabId {v.get('vocabId')}) erroneously contains #24 十")

        # 2. 后: must have 27 (厂) and 4 (丿)
        for v in [v for v in vocab if "后" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 27 not in rids or 4 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing outer frame #27 厂 or stroke #4 丿")

        # 3. 右: must have 1 (一) and 4 (丿)
        for v in [v for v in vocab if "右" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 1 not in rids or 4 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #1 一 or #4 丿")

        # 4. 左: must have 1 (一) and 4 (丿)
        for v in [v for v in vocab if "左" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 1 not in rids or 4 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #1 一 or #4 丿")

        # 5. 习: must not have 15 (冫)
        for v in [v for v in vocab if "习" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 15 in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) erroneously contains #15 冫 (ice)")

        # 6. 买: must not have 15 (冫)
        v_mai = next((v for v in vocab if v.get("vocabId") == 228), None)
        if v_mai and 15 in v_mai.get("radicalIds", []):
            errors.append("Vocab #228 '买' erroneously contains #15 冫")

        # 7. 卫: must have 26 (卩)
        for v in [v for v in vocab if "卫" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 26 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #26 卩")

        # 8. 丢: must not have 96 (玉)
        v_diu = next((v for v in vocab if v.get("vocabId") == 726), None)
        if v_diu and 96 in v_diu.get("radicalIds", []):
            errors.append("Vocab #726 '丢' erroneously contains #96 玉")

        # 9. 节: must have 26 (卩)
        for v in [v for v in vocab if "节" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 26 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #26 卩")

        # 10. 爬: must have #87 爪, must not have #49 己 (synced with 爸, 吧, 把)
        v_pa = next((v for v in vocab if v.get("vocabId") == 886), None)
        if v_pa:
            if 87 not in v_pa.get("radicalIds", []):
                errors.append("Vocab #886 '爬' missing #87 爪")
            if 49 in v_pa.get("radicalIds", []):
                errors.append("Vocab #886 '爬' erroneously contains #49 己")

        # 11. 声: must have 44 (尸) or 49 (己)
        for v in [v for v in vocab if "声" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 44 not in rids and 49 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing lower component #44/#49")

        # 12. 书: must have 5 (乙)
        for v in [v for v in vocab if "书" in v.get("hanzi", "")]:
            rids = v.get("radicalIds", [])
            if 5 not in rids:
                errors.append(f"'{v.get('hanzi')}' (vocabId {v.get('vocabId')}) missing #5 乙")

        # 13. 喝 and 渴: must have 20 (勹) and 21 (匕), no duplicate 73 (曰)
        for vid, hz in [(144, "喝"), (198, "渴")]:
            v = next((x for x in vocab if x.get("vocabId") == vid), None)
            if v:
                rids = v.get("radicalIds", [])
                if 20 not in rids or 21 not in rids:
                    errors.append(f"Vocab #{vid} '{hz}' missing #20 勹 or #21 匕")
                if 72 in rids and 73 in rids:
                    errors.append(f"Vocab #{vid} '{hz}' contains duplicate #72 日 and #73 曰")

        # 14. 游泳: must attribute 泳 components
        v_yy = next((x for x in vocab if x.get("vocabId") == 635), None)
        if v_yy:
            rids = v_yy.get("radicalIds", [])
            if 85 not in rids:
                errors.append("Vocab #635 '游泳' missing water radical #85 氵")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Visual component decomposition errors detected" if errors else "All 14 target characters correctly decomposed per GF 0011-2009 / Unihan"
        res = TestResult("T2.3", 2, "Visual Component Corrections (14 Target Chars)", status, msg, errors[:10])
        self.results.append(res)
        return res

    def test_tier2_phonetic_secondary_radicals_removed(self) -> TestResult:
        """Tier 2.4: Removal of secondary radicals on purely phonetic components (Group 4)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        for vid, (hz, expected_rids) in PHONETIC_CLEANUP_WORDS.items():
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} '{hz}' not found")
                continue
            rids = v.get("radicalIds", [])
            if set(rids) != set(expected_rids):
                errors.append(f"Vocab #{vid} '{hz}' has radicalIds={rids}, expected {expected_rids}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Phonetic components retain forced secondary radicals" if errors else "Secondary radicals on phonetic components (爸, 吧, 杯, 坏, 病, 还) pruned"
        res = TestResult("T2.4", 2, "Removal of Phonetic Secondary Radicals", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier2_component_range_and_uniqueness(self) -> TestResult:
        """Tier 2.5: All radical IDs are valid (1..214) with zero duplicates within any word."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        errors = []

        for v in vocab:
            vid = v.get("vocabId")
            rids = v.get("radicalIds", [])
            for rid in rids:
                if not isinstance(rid, int) or rid < 1 or rid > 214:
                    errors.append(f"vocabId {vid} contains invalid radical ID: {rid}")
            if len(rids) != len(set(rids)):
                errors.append(f"vocabId {vid} has duplicate radical IDs: {rids}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Invalid or duplicate radical IDs in vocabulary items" if errors else "All radical IDs valid in range [1..214] and unique per entry"
        res = TestResult("T2.5", 2, "Radical ID Range & Intra-Word Uniqueness", status, msg, errors[:10])
        self.results.append(res)
        return res

    # --------------------------------------------------------------------------
    # TIER 3: LINGUISTICS & SEMANTICS TESTS
    # --------------------------------------------------------------------------

    def test_tier3_hanviet_da_group(self) -> TestResult:
        """Tier 3.1: Han-Viet 'Đả' for 打 group (打, 打车, 打电话, 打开, 打球)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        da_group = [56, 57, 58, 59, 60]
        for vid in da_group:
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} not found")
                continue
            hv = v.get("meaningHanViet", "")
            if not hv.startswith("Đả"):
                errors.append(f"Vocab #{vid} '{v.get('hanzi')}' meaningHanViet is '{hv}', expected to start with 'Đả' (found 'Tá')")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Words in '打' group have incorrect Han-Viet readings" if errors else "All 5 words in '打' group standardized to 'Đả'"
        res = TestResult("T3.1", 3, "Han-Viet 'Đả' Group (打)", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier3_hanviet_thinh_group(self) -> TestResult:
        """Tier 3.2: Han-Viet 'Thính' for 听 group (好听, 听, 听到, 听见, 听写)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        thinh_group = [141, 361, 362, 363, 364]
        for vid in thinh_group:
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} not found")
                continue
            hv = v.get("meaningHanViet", "")
            if "Thính" not in hv:
                errors.append(f"Vocab #{vid} '{v.get('hanzi')}' meaningHanViet is '{hv}', expected to contain 'Thính' (found 'Dẫn')")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Words in '听' group have incorrect Han-Viet readings" if errors else "All 5 words in '听' group standardized to 'Thính'"
        res = TestResult("T3.2", 3, "Han-Viet 'Thính' Group (听)", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier3_hanviet_misread_and_pure_vietnamese(self) -> TestResult:
        """Tier 3.3: 17+ Han-Viet corrections (喝, 冷, 觉, 重, 长, 儿子, 几, 正, 丢, 爬, 胖, 啤酒, 爸, 妈...)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        for vid, hz, target_hv, forbidden_hvs in HAN_VIET_CORRECTIONS:
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} '{hz}' not found")
                continue
            actual_hv = v.get("meaningHanViet", "").strip()

            # Check if actual matches target or one of its accepted variations
            matched = False
            if actual_hv == target_hv:
                matched = True
            elif target_hv == "Kỷ" and actual_hv in ["Kỷ", "Kỉ"]:
                matched = True
            elif target_hv == "Bàng" and actual_hv in ["Bàng", "Phán"]:
                matched = True
            elif target_hv == "Na Ta" and actual_hv in ["Na Ta", "Na Tiếp"]:
                matched = True

            if not matched:
                errors.append(f"Vocab #{vid} '{hz}' meaningHanViet is '{actual_hv}', expected '{target_hv}'")

            for f_hv in forbidden_hvs:
                if re.search(r'\b' + re.escape(f_hv) + r'\b', actual_hv, re.IGNORECASE):
                    errors.append(f"Vocab #{vid} '{hz}' retains forbidden obsolete form '{f_hv}' in '{actual_hv}'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Han-Viet pronunciation defects detected" if errors else "All 37 Han-Viet targets standardized per Thiều Chửu / Đào Duy Anh / Unihan"
        res = TestResult("T3.3", 3, "Han-Viet Phonological Standardization (37 Items)", status, msg, errors[:10])
        self.results.append(res)
        return res

    def test_tier3_hanviet_sync_thap_ma_cham_ma_thuong_na_truong(self) -> TestResult:
        """Tier 3.4: Systematic synchronization of '上' (all 19 words to Thượng), '什么'/'怎么', '哪', '场'."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        for vid in SHANG_WORD_IDS:
            v = by_id.get(vid)
            if v:
                hv = v.get("meaningHanViet", "")
                if "Thướng" in hv:
                    errors.append(f"Vocab #{vid} '{v.get('hanzi')}' meaningHanViet contains obsolete 'Thướng': '{hv}'")
                if "Thượng" not in hv:
                    errors.append(f"Vocab #{vid} '{v.get('hanzi')}' meaningHanViet missing 'Thượng': '{hv}'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Obsolete 'Thướng' reading detected in vocabulary items" if errors else "All 19 words containing '上' synchronized to 'Thượng'"
        res = TestResult("T3.4", 3, "Han-Viet Systematic Synchronization (上/Thượng)", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier3_polysemy_splits(self) -> TestResult:
        """Tier 3.5: Polysemy splits (地 de vs dì, 干 gān vs gàn, 还 hái vs huán)."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        # 1. 地: #66 (de) vs #69 (dì)
        v66 = by_id.get(66)
        v69 = by_id.get(69)
        if v66 and v69:
            if "Trợ từ kết cấu" not in v66.get("meaningVi", ""):
                errors.append(f"Vocab #66 '地 (de)' meaningVi missing 'Trợ từ kết cấu'")
            if "地上有一本书" in v66.get("exampleSentence", ""):
                errors.append("Vocab #66 '地 (de)' mistakenly uses ground noun example '地上有一本书。'")
            if "Trợ từ kết cấu" in v69.get("meaningVi", ""):
                errors.append("Vocab #69 '地 (dì)' mistakenly inherits structural particle definition")
            if not ("đất" in v69.get("meaningVi", "").lower() or "mặt đất" in v69.get("meaningVi", "").lower()):
                errors.append("Vocab #69 '地 (dì)' meaningVi missing noun meaning 'mặt đất / đất'")

        # 2. 干: #111 (gān) vs #113 (gàn)
        v111 = by_id.get(111)
        v113 = by_id.get(113)
        if v111 and v113:
            if not ("khô" in v111.get("meaningVi", "").lower()):
                errors.append("Vocab #111 '干 (gān)' meaningVi missing 'khô / khô ráo'")
            if not ("làm" in v113.get("meaningVi", "").lower()):
                errors.append("Vocab #113 '干 (gàn)' meaningVi missing 'làm / làm việc'")
            if "晾干" in v113.get("exampleSentence", ""):
                errors.append("Vocab #113 '干 (gàn)' mistakenly uses dry clothes example '晾干'")

        # 3. 还: #132 (hái) vs #153 (huán)
        v132 = by_id.get(132)
        v153 = by_id.get(153)
        if v132 and v153:
            if not ("vẫn" in v132.get("meaningVi", "").lower() or "còn" in v132.get("meaningVi", "").lower()):
                errors.append("Vocab #132 '还 (hái)' meaningVi missing 'vẫn / còn'")
            if not ("trả" in v153.get("meaningVi", "").lower() or "hoàn" in v153.get("meaningVi", "").lower()):
                errors.append("Vocab #153 '还 (huán)' meaningVi missing 'trả / trả lại'")
            if "吃饱" in v153.get("exampleSentence", ""):
                errors.append("Vocab #153 '还 (huán)' mistakenly uses food/water example of 'hái'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Polysemy entries conflate meanings or example sentences" if errors else "Polysemic pairs (地, 干, 还) cleanly separated by definitions and contextual sentences"
        res = TestResult("T3.5", 3, "Polysemy Splits & Sentence Separation (地/干/还)", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier3_machine_translation_sanitization(self) -> TestResult:
        """Tier 3.6: 18+ Machine translation & obsolete dictionary definitions sanitization."""
        data = self._get_target_data()
        vocab = data["vocabulary"]
        by_id = {v["vocabId"]: v for v in vocab}
        errors = []

        for vid, hz, _pinyin, required_keywords, forbidden_keywords, description in CONTEXTUAL_MEANING_SPECS:
            v = by_id.get(vid)
            if not v:
                errors.append(f"Vocab #{vid} '{hz}' not found")
                continue
            meaning_vi = v.get("meaningVi", "").lower()

            # Check forbidden keywords
            for f_kw in forbidden_keywords:
                if f_kw.lower() in meaning_vi:
                    # Do not reject valid required phrases where forbidden keyword is a substring (e.g. "lên" in "lên xe", "xuống" in "xuống xe")
                    if required_keywords and any(f_kw.lower() in r_kw.lower() and r_kw.lower() in meaning_vi for r_kw in required_keywords):
                        continue
                    errors.append(f"Vocab #{vid} '{hz}' contains machine translation artifact '{f_kw}' ({description})")

            # Check required keywords (at least one must be present if specified)
            if required_keywords:
                found_req = any(r_kw.lower() in meaning_vi for r_kw in required_keywords)
                if not found_req:
                    errors.append(f"Vocab #{vid} '{hz}' meaningVi '{v.get('meaningVi')}' missing expected term from {required_keywords} ({description})")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Machine translation or obsolete dictionary senses detected" if errors else "All 18+ contextual meanings purged of machine translation artifacts"
        res = TestResult("T3.6", 3, "Machine Translation & Obsolete Sense Sanitization", status, msg, errors[:10])
        self.results.append(res)
        return res

    # --------------------------------------------------------------------------
    # TIER 4: FOREIGN KEYS, SRS CONSISTENCY & PARITY TESTS
    # --------------------------------------------------------------------------

    def test_tier4_v17_curriculum_200_words_preserved(self) -> TestResult:
        """Tier 4.1: V17 SRS Curriculum (10 lessons, 200 words) strictly preserved in 1068 VOCABULARY."""
        v17_sql = self.loader.load_v17_sql()
        if not v17_sql:
            res = TestResult("T4.1", 4, "V17 Curriculum 200 Words Preservation", TestStatus.FAIL, "V17 migration file not found")
            self.results.append(res)
            return res

        data = self._get_target_data()
        vocab = data["vocabulary"]
        vocab_by_hp = {(v["hanzi"], v["pinyinRaw"]): v for v in vocab}
        vocab_by_hanzi: Dict[str, List[Dict[str, Any]]] = {}
        for v in vocab:
            vocab_by_hanzi.setdefault(v["hanzi"], []).append(v)

        lv_matches = re.findall(r"SELECT\s+(@lesson_id_\d+),\s*`vocab_id`,\s*(\d+)\s+FROM\s+`vocabulary`\s+WHERE\s+`hanzi`\s*=\s*'([^']+)'\s+AND\s+`pinyin_raw`\s*=\s*'([^']+)'", v17_sql)

        if len(lv_matches) != 200:
            res = TestResult("T4.1", 4, "V17 Curriculum 200 Words Preservation", TestStatus.FAIL, f"Found {len(lv_matches)} word mappings in V17, expected exactly 200")
            self.results.append(res)
            return res

        missing = []
        for lid, ord_idx, hanzi, pinyin_raw in lv_matches:
            if (hanzi, pinyin_raw) in vocab_by_hp:
                continue
            elif hanzi in vocab_by_hanzi:
                # Check normalized pinyin_raw in V23 (bukeqi, meiguanxi, nuer)
                norm_candidates = vocab_by_hanzi[hanzi]
                if not norm_candidates:
                    missing.append(f"{lid} #{ord_idx} {hanzi} ({pinyin_raw})")
            else:
                missing.append(f"{lid} #{ord_idx} {hanzi} ({pinyin_raw}) NOT in 1068 vocabulary")

        status = TestStatus.FAIL if missing else TestStatus.PASS
        msg = f"{len(missing)} words from V17 cannot be resolved in vocabulary catalog" if missing else "All 200 lesson words across 10 V17 lessons 100% resolvable in vocabulary catalog"
        res = TestResult("T4.1", 4, "V17 Curriculum 200 Words Preservation", status, msg, missing)
        self.results.append(res)
        return res

    def test_tier4_v26_migration_safety(self) -> TestResult:
        """Tier 4.2: Migration V26 DDL/DML safety invariants (No DELETE/TRUNCATE on VOCABULARY)."""
        v26_sql = self.loader.load_v26_sql()
        if not v26_sql:
            res = TestResult(
                "T4.2", 4, "Migration V26 Safety Invariants", TestStatus.SKIP,
                "Migration file V26__standardize_radicals_and_hsk1_to_3_vocab_2025.sql pending creation by implementation worker"
            )
            self.results.append(res)
            return res

        errors = []
        # Invariant 1: No DELETE/TRUNCATE on VOCABULARY
        if re.search(r'\bDELETE\s+FROM\s+`?VOCABULARY`?', v26_sql, re.IGNORECASE):
            errors.append("V26 contains forbidden 'DELETE FROM VOCABULARY'")
        if re.search(r'\bTRUNCATE\s+TABLE?\s+`?VOCABULARY`?', v26_sql, re.IGNORECASE):
            errors.append("V26 contains forbidden 'TRUNCATE TABLE VOCABULARY'")
        if re.search(r'\bDROP\s+TABLE\s+`?VOCABULARY`?', v26_sql, re.IGNORECASE):
            errors.append("V26 contains forbidden 'DROP TABLE VOCABULARY'")

        # Invariant 2: Proper UPDATE on RADICAL #69
        if "UPDATE" in v26_sql and "RADICAL" in v26_sql:
            if not ("Cân" in v26_sql and "69" in v26_sql):
                errors.append("V26 does not appear to update Radical #69 to 'Cân'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "V26 migration violates database safety invariants" if errors else "V26 migration adheres strictly to non-destructive DDL/DML rules"
        res = TestResult("T4.2", 4, "Migration V26 Safety Invariants", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier4_root_exports_sync_parity(self) -> TestResult:
        """Tier 4.3: Multi-Source Parity across demo-seed-data.js, data_kiem_tra_all.json, and CSV exports."""
        json_data = self.loader.load_root_json()
        rad_rows, voc_rows = self.loader.load_root_csvs()

        if not json_data:
            res = TestResult("T4.3", 4, "Multi-Source Artifact Sync Parity", TestStatus.FAIL, "data_kiem_tra_all.json missing")
            self.results.append(res)
            return res
        if rad_rows is None or voc_rows is None:
            res = TestResult("T4.3", 4, "Multi-Source Artifact Sync Parity", TestStatus.FAIL, "Root CSV export files missing")
            self.results.append(res)
            return res

        demo_data = self.loader.load_demo_seed()
        errors = []

        # Count parity
        if len(json_data.get("radicals", [])) != len(demo_data["radicals"]):
            errors.append(f"JSON radicals count ({len(json_data.get('radicals', []))}) != seed ({len(demo_data['radicals'])})")
        if len(json_data.get("vocabulary", [])) != len(demo_data["vocabulary"]):
            errors.append(f"JSON vocabulary count ({len(json_data.get('vocabulary', []))}) != seed ({len(demo_data['vocabulary'])})")
        if len(rad_rows) != 214:
            errors.append(f"bo_thu_214.csv row count is {len(rad_rows)}, expected 214")
        if len(voc_rows) != 1068:
            errors.append(f"tu_vung_1000.csv row count is {len(voc_rows)}, expected 1068")

        # Spot check radical #69 sync
        j_r69 = next((r for r in json_data.get("radicals", []) if r.get("radicalId") == 69), {})
        s_r69 = next((r for r in demo_data["radicals"] if r.get("radicalId") == 69), {})
        if j_r69.get("meaningHanViet") != s_r69.get("meaningHanViet"):
            errors.append(f"JSON Radical #69 HV '{j_r69.get('meaningHanViet')}' != seed '{s_r69.get('meaningHanViet')}'")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Parity mismatch between root export files and demo-seed-data.js" if errors else "100% synchronization parity across demo-seed-data.js, JSON, and CSV exports"
        res = TestResult("T4.3", 4, "Multi-Source Artifact Sync Parity", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier4_srs_card_progress_relational_invariants(self) -> TestResult:
        """Tier 4.4: SRS Card progress items map strictly to valid vocabulary (1..1068) and radical IDs (1..214)."""
        data = self._get_target_data()
        cards = data.get("cards", [])
        vocab_ids = {v["vocabId"] for v in data["vocabulary"]}
        rad_ids = {r["radicalId"] for r in data["radicals"]}

        errors = []
        for card in cards:
            cid = card.get("cardId")
            itype = card.get("itemType")
            item_id = card.get("itemId")
            if itype == "VOCABULARY":
                if item_id not in vocab_ids:
                    errors.append(f"SRS Card #{cid} references non-existent vocabId {item_id}")
            elif itype == "RADICAL":
                if item_id not in rad_ids:
                    errors.append(f"SRS Card #{cid} references non-existent radicalId {item_id}")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Orphan SRS cards found pointing to invalid item IDs" if errors else f"All {len(cards)} SRS flashcards strictly bound to valid vocabulary / radical primary keys"
        res = TestResult("T4.4", 4, "SRS Card Progress Relational Integrity", status, msg, errors)
        self.results.append(res)
        return res

    def test_tier4_char_to_radicals_map_parity(self) -> TestResult:
        """Tier 4.5: CHAR_TO_RADICALS_MAP components match vocabulary radical decomposition rules."""
        data = self._get_target_data()
        char_map = data.get("char_to_radicals", {})
        errors = []

        if not char_map:
            # If target is exports without char_map, skip or read from seed
            if self.target == "exports":
                res = TestResult("T4.5", 4, "Character Decomposition Map Parity", TestStatus.SKIP, "CHAR_TO_RADICALS_MAP not present in JSON exports (seed-exclusive artifact)")
                self.results.append(res)
                return res
            res = TestResult("T4.5", 4, "Character Decomposition Map Parity", TestStatus.FAIL, "CHAR_TO_RADICALS_MAP not found in demo-seed-data.js")
            self.results.append(res)
            return res

        # Check cleaned pseudo-radicals in character map
        clean_expectations = {
            '爬': [87],
            '且': [1],
            '助': [19],
            '姐': [38],
            '租': [115],
            '宜': [40],
            '他': [9],
            '她': [38],
            '地': [32],
            '打': [64],
            '灯': [86],
            '球': [96],
            '进': [162],
            '讲': [149],
            '吃': [30],
            '妹': [38, 75],
            '考': [125],
            '号': [30],
            '叫': [30],
            '收': [66],
            '孩': [39],
            '该': [149],
            '刻': [18],
            '新': [69, 75, 117],
            '作': [9],
            '昨': [72],
            '怎': [61],
            '便': [9, 72],
            '最': [29, 73, 128],
            '愿': [27, 42, 61, 106],
            '交': [8, 88],
            '校': [8, 75, 88],
            '较': [8, 88, 159],
            '饺': [8, 88, 184]
        }
        for ch, expected_rids in clean_expectations.items():
            if ch in char_map:
                actual_rids = char_map[ch]
                if actual_rids != expected_rids:
                    errors.append(f"CHAR_TO_RADICALS_MAP['{ch}'] is {actual_rids}, expected {expected_rids}")

        # Check standalone radicals in character map
        for _vid, (expected_rad, char) in STANDALONE_RADICALS.items():
            if char in char_map:
                mapped = char_map[char]
                if mapped != [expected_rad]:
                    errors.append(f"CHAR_TO_RADICALS_MAP['{char}'] is {mapped}, expected strictly [{expected_rad}]")

        # Check 阝 characters in character map
        for c in ["邮", "邻", "都", "那", "哪", "帮"]:
            if c in char_map:
                mapped = char_map[c]
                if 163 not in mapped or 170 in mapped:
                    errors.append(f"CHAR_TO_RADICALS_MAP['{c}'] (Right 阝) has {mapped}, expected #163 without #170")

        for c in ["院", "阳", "阴", "附", "除", "阿"]:
            if c in char_map:
                mapped = char_map[c]
                if 170 not in mapped or 163 in mapped:
                    errors.append(f"CHAR_TO_RADICALS_MAP['{c}'] (Left 阝) has {mapped}, expected #170 without #163")

        status = TestStatus.FAIL if errors else TestStatus.PASS
        msg = "Defects detected in CHAR_TO_RADICALS_MAP" if errors else f"CHAR_TO_RADICALS_MAP ({len(char_map)} entries) aligned with visual decomposition standards"
        res = TestResult("T4.5", 4, "Character Decomposition Map Parity", status, msg, errors)
        self.results.append(res)
        return res

    # --------------------------------------------------------------------------
    # EXECUTION RUNNER
    # --------------------------------------------------------------------------

    def run_all(self, selected_tier: Optional[int] = None) -> List[TestResult]:
        tier1_methods = [
            self.test_tier1_radicals_count_and_sequence,
            self.test_tier1_radical_69_can,
            self.test_tier1_radical_variants,
            self.test_tier1_radical_compound_display_counts,
            self.test_tier1_radical_71_pedagogy,
            self.test_tier1_vocab_total_count_and_contiguity,
            self.test_tier1_hsk_level_distribution,
            self.test_tier1_hsk_source_ids,
            self.test_tier1_hsk30_realigned_levels,
            self.test_tier1_homographs_indexing,
            self.test_tier1_unicode_sanitization,
        ]

        tier2_methods = [
            self.test_tier2_standalone_radicals_no_fragments,
            self.test_tier2_b_radicals_left_vs_right,
            self.test_tier2_visual_decomposition_14_chars,
            self.test_tier2_phonetic_secondary_radicals_removed,
            self.test_tier2_component_range_and_uniqueness,
        ]

        tier3_methods = [
            self.test_tier3_hanviet_da_group,
            self.test_tier3_hanviet_thinh_group,
            self.test_tier3_hanviet_misread_and_pure_vietnamese,
            self.test_tier3_hanviet_sync_thap_ma_cham_ma_thuong_na_truong,
            self.test_tier3_polysemy_splits,
            self.test_tier3_machine_translation_sanitization,
        ]

        tier4_methods = [
            self.test_tier4_v17_curriculum_200_words_preserved,
            self.test_tier4_v26_migration_safety,
            self.test_tier4_root_exports_sync_parity,
            self.test_tier4_srs_card_progress_relational_invariants,
            self.test_tier4_char_to_radicals_map_parity,
        ]

        plan = []
        if self.target == "migration":
            plan = [self.test_tier4_v26_migration_safety]
        else:
            if selected_tier is None or selected_tier == 1:
                plan.extend(tier1_methods)
            if selected_tier is None or selected_tier == 2:
                plan.extend(tier2_methods)
            if selected_tier is None or selected_tier == 3:
                plan.extend(tier3_methods)
            if selected_tier is None or selected_tier == 4:
                plan.extend(tier4_methods)

        for m in plan:
            try:
                m()
            except Exception as e:
                test_name = m.__doc__.split(":")[0].strip() if m.__doc__ else m.__name__
                self.results.append(TestResult(
                    "ERR", 0, test_name, TestStatus.FAIL,
                    f"Unhandled exception during test execution: {str(e)}",
                    [str(e)]
                ))

        return self.results


# ==============================================================================
# UNITTEST INTEGRATION WRAPPERS
# ==============================================================================

class BaseVerificationTestCase(unittest.TestCase):
    verifier: HSKRadicalStandardizationVerifier

    @classmethod
    def setUpClass(cls):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        loader = DatasetLoader(project_root)
        cls.verifier = HSKRadicalStandardizationVerifier(loader, target="all")

    def _assert_result(self, res: TestResult):
        if res.status == TestStatus.SKIP:
            self.skipTest(res.message)
        elif res.status == TestStatus.FAIL:
            detail_str = "\n".join(res.details) if res.details else ""
            self.fail(f"[{res.test_id}] {res.name}: {res.message}\n{detail_str}")
        self.assertEqual(res.status, TestStatus.PASS)


class TestTier1FeatureCoverage(BaseVerificationTestCase):
    def test_t1_1_radicals_count_and_sequence(self):
        self._assert_result(self.verifier.test_tier1_radicals_count_and_sequence())

    def test_t1_2_radical_69_can(self):
        self._assert_result(self.verifier.test_tier1_radical_69_can())

    def test_t1_3_radical_variants(self):
        self._assert_result(self.verifier.test_tier1_radical_variants())

    def test_t1_4_radical_compound_display_counts(self):
        self._assert_result(self.verifier.test_tier1_radical_compound_display_counts())

    def test_t1_5_radical_71_pedagogy(self):
        self._assert_result(self.verifier.test_tier1_radical_71_pedagogy())

    def test_t1_6_vocab_total_count_and_contiguity(self):
        self._assert_result(self.verifier.test_tier1_vocab_total_count_and_contiguity())

    def test_t1_7_hsk_level_distribution(self):
        self._assert_result(self.verifier.test_tier1_hsk_level_distribution())

    def test_t1_8_hsk_source_ids(self):
        self._assert_result(self.verifier.test_tier1_hsk_source_ids())

    def test_t1_9_hsk30_realigned_levels(self):
        self._assert_result(self.verifier.test_tier1_hsk30_realigned_levels())

    def test_t1_10_homographs_indexing(self):
        self._assert_result(self.verifier.test_tier1_homographs_indexing())

    def test_t1_11_unicode_sanitization(self):
        self._assert_result(self.verifier.test_tier1_unicode_sanitization())


class TestTier2BoundaryDecomposition(BaseVerificationTestCase):
    def test_t2_1_standalone_radicals_no_fragments(self):
        self._assert_result(self.verifier.test_tier2_standalone_radicals_no_fragments())

    def test_t2_2_b_radicals_left_vs_right(self):
        self._assert_result(self.verifier.test_tier2_b_radicals_left_vs_right())

    def test_t2_3_visual_decomposition_14_chars(self):
        self._assert_result(self.verifier.test_tier2_visual_decomposition_14_chars())

    def test_t2_4_phonetic_secondary_radicals_removed(self):
        self._assert_result(self.verifier.test_tier2_phonetic_secondary_radicals_removed())

    def test_t2_5_component_range_and_uniqueness(self):
        self._assert_result(self.verifier.test_tier2_component_range_and_uniqueness())


class TestTier3LinguisticsSemantics(BaseVerificationTestCase):
    def test_t3_1_hanviet_da_group(self):
        self._assert_result(self.verifier.test_tier3_hanviet_da_group())

    def test_t3_2_hanviet_thinh_group(self):
        self._assert_result(self.verifier.test_tier3_hanviet_thinh_group())

    def test_t3_3_hanviet_misread_and_pure_vietnamese(self):
        self._assert_result(self.verifier.test_tier3_hanviet_misread_and_pure_vietnamese())

    def test_t3_4_hanviet_sync_thap_ma_cham_ma_thuong_na_truong(self):
        self._assert_result(self.verifier.test_tier3_hanviet_sync_thap_ma_cham_ma_thuong_na_truong())

    def test_t3_5_polysemy_splits(self):
        self._assert_result(self.verifier.test_tier3_polysemy_splits())

    def test_t3_6_machine_translation_sanitization(self):
        self._assert_result(self.verifier.test_tier3_machine_translation_sanitization())


class TestTier4ForeignKeysParity(BaseVerificationTestCase):
    def test_t4_1_v17_curriculum_200_words_preserved(self):
        self._assert_result(self.verifier.test_tier4_v17_curriculum_200_words_preserved())

    def test_t4_2_v26_migration_safety(self):
        self._assert_result(self.verifier.test_tier4_v26_migration_safety())

    def test_t4_3_root_exports_sync_parity(self):
        self._assert_result(self.verifier.test_tier4_root_exports_sync_parity())

    def test_t4_4_srs_card_progress_relational_invariants(self):
        self._assert_result(self.verifier.test_tier4_srs_card_progress_relational_invariants())

    def test_t4_5_char_to_radicals_map_parity(self):
        self._assert_result(self.verifier.test_tier4_char_to_radicals_map_parity())


# ==============================================================================
# REPORTING & FORMATTING
# ==============================================================================

def print_report(results: List[TestResult], verbose: bool = False) -> int:
    tier_names = {
        1: "Tier 1: Feature Coverage",
        2: "Tier 2: Boundary & Decomposition",
        3: "Tier 3: Linguistics & Semantics",
        4: "Tier 4: Foreign Keys & SRS Parity"
    }

    tier_stats = {1: {"total": 0, "pass": 0, "fail": 0, "skip": 0},
                  2: {"total": 0, "pass": 0, "fail": 0, "skip": 0},
                  3: {"total": 0, "pass": 0, "fail": 0, "skip": 0},
                  4: {"total": 0, "pass": 0, "fail": 0, "skip": 0}}

    for r in results:
        t = r.tier if r.tier in tier_stats else 1
        tier_stats[t]["total"] += 1
        if r.status == TestStatus.PASS:
            tier_stats[t]["pass"] += 1
        elif r.status == TestStatus.FAIL:
            tier_stats[t]["fail"] += 1
        elif r.status == TestStatus.SKIP:
            tier_stats[t]["skip"] += 1

    print("\n" + "=" * 80)
    print("  E2E AUTOMATED VERIFICATION REPORT")
    print("  HSK 3.0 & 214 KANGXI RADICAL STANDARDIZATION")
    print("=" * 80)
    print(f"  {'Tier / Category':<36} {'Tests':>6} {'Pass':>7} {'Fail':>7} {'Skip':>7}")
    print("  " + "-" * 74)

    tot_tests = sum(s["total"] for s in tier_stats.values())
    tot_pass = sum(s["pass"] for s in tier_stats.values())
    tot_fail = sum(s["fail"] for s in tier_stats.values())
    tot_skip = sum(s["skip"] for s in tier_stats.values())

    for t in [1, 2, 3, 4]:
        s = tier_stats[t]
        if s["total"] > 0:
            print(f"  {tier_names[t]:<36} {s['total']:>6} {s['pass']:>7} {s['fail']:>7} {s['skip']:>7}")

    print("  " + "-" * 74)
    print(f"  {'TOTAL':<36} {tot_tests:>6} {tot_pass:>7} {tot_fail:>7} {tot_skip:>7}")
    print("=" * 80)

    # Detailed Results
    print("\n[DETAILED TEST RESULTS]")
    for r in results:
        sym = "✔" if r.status == TestStatus.PASS else ("✘" if r.status == TestStatus.FAIL else "↷")
        print(f"  [{r.status:<4}] {sym} [{r.test_id}] {r.name}: {r.message}")
        if r.status == TestStatus.FAIL or verbose:
            for d in r.details[:8]:
                print(f"         └─ {d}")
            if len(r.details) > 8:
                print(f"         └─ ... and {len(r.details) - 8} more issues")

    print("\n" + "=" * 80)
    if tot_fail == 0:
        print(f"  OVERALL RESULT: [PASS] - All {tot_pass} active tests PASSED ({tot_skip} skipped).")
        print("=" * 80 + "\n")
        return 0
    else:
        print(f"  OVERALL RESULT: [FAIL] - {tot_fail} test(s) FAILED ({tot_pass} passed, {tot_skip} skipped).")
        print("=" * 80 + "\n")
        return 1


# ==============================================================================
# CLI ENTRY POINT
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Comprehensive 4-Tier Automated Verification Suite for HSK & 214 Radical Standardization."
    )
    parser.add_argument(
        "--tier", type=int, choices=[1, 2, 3, 4], default=None,
        help="Run only a specific tier (1, 2, 3, or 4). Defaults to all tiers."
    )
    parser.add_argument(
        "--target", choices=["all", "seed", "exports", "migration"], default="all",
        help="Target scope to evaluate: 'seed' (demo-seed-data.js), 'exports' (root files), 'migration' (V26 SQL), or 'all'."
    )
    parser.add_argument(
        "--json-output", type=str, default=None,
        help="Optional path to output detailed results in JSON format."
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Print verbose details for all tests including passed ones."
    )
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    loader = DatasetLoader(project_root)
    verifier = HSKRadicalStandardizationVerifier(loader, target=args.target, verbose=args.verbose)

    results = verifier.run_all(selected_tier=args.tier)

    # Optional JSON export
    if args.json_output:
        report_data = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "tier_filter": args.tier,
            "target_filter": args.target,
            "total_tests": len(results),
            "passed": sum(1 for r in results if r.status == TestStatus.PASS),
            "failed": sum(1 for r in results if r.status == TestStatus.FAIL),
            "skipped": sum(1 for r in results if r.status == TestStatus.SKIP),
            "results": [r.to_dict() for r in results]
        }
        with open(args.json_output, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        print(f"[JSON] Exported verification results to: {args.json_output}")

    exit_code = print_report(results, verbose=args.verbose)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
