# -*- coding: utf-8 -*-
import subprocess
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V23_PATH = os.path.join(ROOT_DIR, "backend", "src", "main", "resources", "db", "migration", "V23__standardize_hsk_1_to_3_vocabulary_2025.sql")

with open(V23_PATH, "r", encoding="utf-8") as f:
    v23_content = f.read()

# Split out Steps 2, 3, 4, 5 (skip Step 1 DDL since schema is already modified)
step2_marker = "-- Step 2: Update 432 existing vocabulary entries"
step2_idx = v23_content.index(step2_marker)
steps_2_to_5 = v23_content[step2_idx:]

cleanup_preamble = """
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `vocab_radical` WHERE `vocab_id` >= 509;
DELETE FROM `vocabulary` WHERE `vocab_id` >= 509;
ALTER TABLE `vocabulary` AUTO_INCREMENT = 509;
UPDATE `vocabulary` SET `hsk_source_id` = NULL WHERE `vocab_id` <= 508;
"""

postamble = """
UPDATE `flyway_schema_history` SET `checksum` = 720942103, `installed_on` = NOW() WHERE `version` = '23';
SET FOREIGN_KEY_CHECKS = 1;
"""

full_sql = cleanup_preamble + "\n" + steps_2_to_5 + "\n" + postamble

temp_file = os.path.join(ROOT_DIR, "temp_reapply.sql")
with open(temp_file, "w", encoding="utf-8") as f:
    f.write(full_sql)

print(f"Prepared full SQL payload ({len(full_sql)} characters). Executing on elearning_db...")

p = subprocess.Popen(
    ["docker", "exec", "-i", "400a80386414", "mysql", "-uroot", "--default-character-set=utf8mb4", "elearning_db"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

out, err = p.communicate(input=full_sql.encode('utf-8'))
if p.returncode != 0:
    print("Execution failed:", err.decode('utf-8', errors='replace'))
    sys.exit(1)

print("Executed successfully!")

if os.path.exists(temp_file):
    os.remove(temp_file)

# Run verification queries
def run_query(q):
    cmd = ["docker", "exec", "400a80386414", "mysql", "-uroot", "--default-character-set=utf8mb4", "-e", f"USE elearning_db; {q}"]
    print(subprocess.check_output(cmd).decode('utf-8'))

print("=== VERIFICATION ===")
run_query("SELECT COUNT(*) AS total_vocab, COUNT(hsk_source_id) AS total_source_ids, COUNT(DISTINCT hsk_source_id) AS distinct_source_ids FROM vocabulary;")
run_query("SELECT COUNT(*) AS total_vocab_radicals FROM vocab_radical;")
run_query("SELECT vocab_id, hanzi, pinyin, pinyin_raw, meaning_han_viet, meaning_vi, hsk_level, hsk_source_id FROM vocabulary WHERE hanzi = '女儿';")
run_query("SELECT version, checksum, description, success FROM flyway_schema_history WHERE version = '23';")
