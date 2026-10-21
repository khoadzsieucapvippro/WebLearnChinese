# -*- coding: utf-8 -*-
"""
Script xuất và nén toàn bộ 214 bộ thủ và 1068 từ vựng thành file để kiểm tra nguồn ngoài.
Hỗ trợ:
1. data_kiem_tra_all.json (File JSON chứa toàn bộ 214 bộ thủ + 1068 từ vựng)
2. data_kiem_tra_all.zip (File nén ZIP dung lượng ~160KB)
3. bo_thu_214.csv & tu_vung_1000.csv (File CSV mở bằng Excel/Google Sheets)
4. data_kiem_tra_tom_tat.txt (File văn bản dạng dòng dễ đọc, tiện copy vào AI đối soát)
"""

import os
import sys
import json
import csv
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def export_all():
    seed_path = os.path.join("frontend", "js", "api", "demo-seed-data.js")
    if not os.path.exists(seed_path):
        print(f"Error: Không tìm thấy file {seed_path}")
        return

    with open(seed_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Parse Radicals
    rad_str = text.split("export const SEED_RADICALS = ")[1].split(";\n\nexport const SEED_VOCABULARY")[0]
    radicals = json.loads(rad_str)

    # Parse Vocabulary
    vocab_str = text.split("export const SEED_VOCABULARY = ")[1].split(";\n\nexport const SEED_LESSONS")[0]
    vocabularies = json.loads(vocab_str)

    print(f"-> Đã đọc: {len(radicals)} bộ thủ và {len(vocabularies)} từ vựng.")

    # 1. Xuất file JSON tổng hợp
    json_filename = "data_kiem_tra_all.json"
    data = {
        "metadata": {
            "title": "Dữ liệu 214 bộ thủ & 1000+ từ vựng HSK (Elearning)",
            "total_radicals": len(radicals),
            "total_vocabulary": len(vocabularies),
            "exported_at": "2026-10-21"
        },
        "radicals": radicals,
        "vocabulary": vocabularies
    }
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Đã tạo file JSON: {json_filename} ({os.path.getsize(json_filename)/1024:.1f} KB)")

    # 2. Xuất file tóm tắt text (rất tiện để dán vào prompt AI / LLM)
    txt_filename = "data_kiem_tra_tom_tat.txt"
    with open(txt_filename, "w", encoding="utf-8") as f:
        f.write("=== DANH SÁCH 214 BỘ THỦ ===\n")
        f.write("STT | Chữ Hán | Pinyin | Hán Việt | Nghĩa tiếng Việt | Số nét | Mẹo nhớ & Ví dụ\n")
        f.write("-" * 80 + "\n")
        for r in radicals:
            f.write(f"#{r.get('radicalId')} | {r.get('character')} | {r.get('pinyin')} | {r.get('meaningHanViet')} | {r.get('meaningVi')} | {r.get('strokeCount')} nét | {r.get('explanationVi')}\n")

        f.write("\n\n" + "=" * 80 + "\n")
        f.write("=== DANH SÁCH TỪ VỰNG HSK (1068 TỪ) ===\n")
        f.write("ID | Chữ Hán | Pinyin | Hán Việt | Nghĩa tiếng Việt | Từ loại | HSK | Bộ thủ cấu thành | Ví dụ | Dịch ví dụ\n")
        f.write("-" * 80 + "\n")
        for v in vocabularies:
            rad_ids = ",".join(map(str, v.get("radicalIds", [])))
            pos = v.get("partOfSpeech", "")
            f.write(f"#{v.get('vocabId')} | {v.get('hanzi')} | {v.get('pinyin')} | {v.get('meaningHanViet')} | {v.get('meaningVi')} | {pos} | HSK{v.get('hskLevel')} | [Bộ: {rad_ids}] | {v.get('exampleSentence', '')} | {v.get('exampleTranslation', '')}\n")
    print(f"[OK] Đã tạo file TXT: {txt_filename} ({os.path.getsize(txt_filename)/1024:.1f} KB)")

    # 3. Xuất 2 file CSV để mở bằng Excel/Google Sheets
    csv_rad_filename = "bo_thu_214.csv"
    with open(csv_rad_filename, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Chữ Hán", "Pinyin", "Hán Việt", "Nghĩa tiếng Việt", "Số nét", "Mẹo & Ví dụ"])
        for r in radicals:
            writer.writerow([r.get("radicalId"), r.get("character"), r.get("pinyin"), r.get("meaningHanViet"), r.get("meaningVi"), r.get("strokeCount"), r.get("explanationVi")])

    csv_voc_filename = "tu_vung_1000.csv"
    with open(csv_voc_filename, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Chữ Hán", "Pinyin", "Hán Việt", "Nghĩa tiếng Việt", "Từ loại", "HSK", "Mã Bộ Thủ", "Câu Ví Dụ", "Dịch Ví Dụ"])
        for v in vocabularies:
            writer.writerow([
                v.get("vocabId"), v.get("hanzi"), v.get("pinyin"), v.get("meaningHanViet"),
                v.get("meaningVi"), v.get("partOfSpeech", ""), v.get("hskLevel"), ",".join(map(str, v.get("radicalIds", []))),
                v.get("exampleSentence"), v.get("exampleTranslation")
            ])
    print(f"[OK] Đã tạo CSV: {csv_rad_filename} và {csv_voc_filename}")

    # 4. Nén tất cả vào 1 file ZIP duy nhất
    zip_filename = "data_kiem_tra_all.zip"
    with zipfile.ZipFile(zip_filename, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(json_filename, arcname=json_filename)
        z.write(txt_filename, arcname=txt_filename)
        z.write(csv_rad_filename, arcname=csv_rad_filename)
        z.write(csv_voc_filename, arcname=csv_voc_filename)
    print(f"[OK] Đã nén thành file ZIP duy nhất: {zip_filename} ({os.path.getsize(zip_filename)/1024:.1f} KB)")
    print("\nHoàn tất! File đã sẵn sàng để gửi nguồn ngoài kiểm tra.")

if __name__ == "__main__":
    export_all()
