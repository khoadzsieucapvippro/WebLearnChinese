---
name: hanzi-radical-decomposition-guardrail
description: Strict invariants for Hanzi constituent radical mapping (radicalIds) to prevent pseudo-radical decomposition.
---

# Hanzi Radical Decomposition Guardrail

Khi xác định các bộ thủ cấu thành (`radicalIds`, `CHAR_TO_RADICALS_MAP`, `VOCAB_RADICAL`) cho chữ Hán và từ vựng trong hệ thống:

## 1. Nguyên tắc Chiết tự Thị giác Trực tiếp (Direct Visual Components)
- Chỉ đưa vào danh sách bộ thủ cấu thành những bộ thủ Khang Hy (trong 214 bộ thủ chuẩn) **THỰC SỰ XUẤT HIỆN TRỰC TIẾP** về mặt hình thể thị giác trong chữ Hán đó.
- Nếu một chữ Hán đơn bản thân đã là một bộ thủ độc lập trong 214 bộ thủ (`车, 风, 见, 门, 页, 马, 山, 水, 鱼...`), **CHỈ ÁNH XẠ VỀ CHÍNH NÓ**, tuyệt đối không phân rã thành các nét đơn vụn vặt (`一, 丨, 丿, 丶, 乙`).

## 2. Cấm Phân rã Giả Cụm Hài Thanh / Biểu Âm (Anti-Pseudo-Decomposition)
Tuyệt đối KHÔNG phân rã các cụm nét không phải là bộ thủ thành các bộ thủ nét đơn hoặc gán ép các bộ thủ đồng dạng hình thức:
- **Cụm `且`:** Chữ `且` không chứa bộ Nguyệt (`#74 月`). Trong các chữ `助, 姐, 租, 宜`, tuyệt đối không gán `#74 月` và `#1 一`. Riêng chữ `且` độc lập quy về bộ `#1 一`.
- **Cụm `也`:** Khi đứng làm thành phần hài thanh (`他, 她, 地`), không phân rã ép thành bộ Ất (`#5 乙`).
- **Cụm `丁`:** Không dùng nét `#1 一` làm phần bù cho `丁` trong các chữ `打, 灯, 可, 河, 啊, 阿, 奇, 椅, 骑`.
- **Cụm `求`:** Không tách `求` thành `#85 水` + `#1 一` trong chữ `球`. Chữ `球` chỉ gồm bộ Ngọc `#96 玉`.
- **Cụm `乍`:** Không tách `乍` thành `#1 一` + `#4 丿` trong `作, 昨, 怎`.
- **Cụm `井`:** Không tách ép thành `#7 二` trong `进, 讲`.
- **Cụm `亥`:** Không tách lẻ loi `#8 亠` trong `孩, 该, 刻`.
- **Cụm `巴`:** `巴` không phải bộ thủ; không ép gán `#49 己` trong `爸, 吧, 把, 爬`.
- **Cụm `不` / `丙`:** Không gán `#1 一` cho `杯, 坏, 还, 病`.
- **Cụm `交`:** Thống nhất chữ `交` phân rã thị giác chuẩn gồm 2 bộ thủ: Đầu `#8 亠` + Phụ `#88 父` (trong `交, 校, 较, 饺`).
- **Cụm `新`:** Phần dưới bên trái là bộ Mộc `#75 木`, không phải `一 + 小`. `新` gồm: Cân `#69 斤` + Mộc `#75 木` + Lập `#117 立`.
- **Cụm `原`:** Gồm Hán `#27 厂` + Bạch `#106 白` + Tiểu `#42 小` (không nhầm thành bộ Thủy `#85`).

## 3. Quy tắc Cực tính Bộ 阝 (Left vs. Right 阝 Polarities)
- `阝` nằm bên TRÁI chữ Hán: BẮT BUỘC là **Bộ `#170 阜` (Phụ)** (như `院, 阳, 阴, 附, 除, 阿, 队, 阶...`).
- `阝` nằm bên PHẢI chữ Hán: BẮT BUỘC là **Bộ `#163 邑` (Ấp)** (như `邮, 邻, 郊, 都, 部, 那, 哪, 帮...`).
