# BẢN ĐẶC TẢ KỸ THUẬT & ĐIỀU PHỐI SUBAGENTS CẦM TAY CHỈ VIỆC (MASTER EXECUTION BLUEPRINT)

Bạn là **Lead Orchestrator Agent**. Nhiệm vụ của bạn là thực hiện cuộc đại tu toàn diện dự án **E-Learning Học Bộ Thủ Khang Hy & Từ Vựng Tiếng Trung** theo đúng từng bước được chỉ dẫn dưới đây.

Bạn **PHẢI** đọc kỹ toàn bộ tài liệu này, tuyệt đối không làm tắt, không tự ý phỏng đoán, phải gọi các **Subagents** theo đúng phân công và **LƯU TIẾN TRÌNH VÀO GIT (`git add` & `git commit`)** sau mỗi Giai đoạn (Phase) khi đã chạy test thành công.

---

## PHẦN 0: NHỮNG "CÁI BẪY KỸ THUẬT" CẤM VI PHẠM TRONG DỰ ÁN NÀY (ĐỌC KỸ TRƯỚC KHI CODE)

Dự án này có hệ thống kiểm thử tĩnh (`tests/frontend/static/*.test.mjs`) và kiểm thử tích hợp Backend (`backend/src/test/`) cực kỳ nghiêm ngặt. Mọi Subagent khi viết code **BẮT BUỘC** phải tuân thủ 6 quy tắc sống còn sau:

1. **CẤM DÙNG `innerHTML`, `outerHTML`, `insertAdjacentHTML` hoặc inline event (`onclick=...`):**
   - File `tests/frontend/static/dom-sinks.test.mjs` quét toàn bộ mã nguồn `.js` trong `frontend/js/`. Nếu bạn dùng `element.innerHTML = ...` để render giao diện mới, bài test sẽ **FAIL NGAY LẬP TỨC**.
   - **Cách làm đúng bắt buộc:** Chỉ được sử dụng `document.createElement()`, `document.createElementNS()`, `element.textContent = ...`, `element.setAttribute()`, `element.replaceChildren()`, `element.append(...)` và các hàm helper tạo DOM trong `frontend/js/ui/ui.js`.

2. **CẤM SỬA CÁC FILE FLYWAY MIGRATION TỪ `V1` ĐẾN `V19`:**
   - Trong `backend/src/main/resources/db/migration/`, các file từ `V1__init_schema.sql` đến `V19__support_skill_independent_srs_card_types.sql` đã được cố định. Nếu sửa dù chỉ 1 dấu cách, Flyway sẽ báo lỗi Checksum Mismatch và toàn bộ Backend sập.
   - **Cách làm đúng bắt buộc:** Mọi thay đổi về Schema và Data (sửa `radical_id` của từ vựng, mở rộng cột `avatar_url`, thêm chủ đề ôn tập) **PHẢI** viết trong file mới `V20__fix_radicals_expand_avatar_and_seed_topics.sql`.

3. **CẤM ĐOÁN MÒ KHÓA CHÍNH `id` CỦA BẢNG `radicals` KHI VIẾT SQL UPDATE:**
   - Trong bảng `radicals`, cột `id` (auto-increment) có thể khác với cột `kangxi_number` (số thứ tự bộ thủ từ 1 đến 214).
   - **Cách làm đúng bắt buộc:** Khi gán bộ thủ cho từ vựng trong `V20`, **BẮT BUỘC** dùng subquery theo `kangxi_number`:
     ```sql
     UPDATE vocabulary
     SET radical_id = (SELECT id FROM radicals WHERE kangxi_number = <SO_BO_THU_KHANG_HY> LIMIT 1)
     WHERE hanzi IN (...);
     ```

4. **CẤM LÀM HỎNG CẤU TRÚC SEMANTIC HTML & CSP TRÊN 22 FILE `frontend/*.html`:**
   - Các file `tests/frontend/static/html-semantics.test.mjs` và `csp-resource-graph.test.mjs` kiểm tra từng file `.html`.
   - **Cách làm đúng bắt buộc:**
     - Mọi file `.html` phải giữ nguyên `<a class="skip-link" href="#main-content">`, `<header>`, `<nav>`, `<main id="main-content">`, `<footer>`, thuộc tính `lang="vi"`.
     - Thẻ `<meta http-equiv="Content-Security-Policy" ...>` phải đồng nhất giữa các file `.html`. Khi cập nhật `img-src` để hỗ trợ ảnh tải từ máy tính (`data:`), phải cập nhật đồng bộ và kiểm tra ngay bằng lệnh `node tests/frontend/runner.mjs --tier static`.

5. **CẤM GỌI `window.fetch` TRỰC TIẾP TRONG CÁC FILE `frontend/js/pages/*-page.js`:**
   - Mọi lệnh gọi HTTP **PHẢI** đi qua `apiClient` trong `frontend/js/api/api.js`.

6. **GIAO THỨC LƯU TIẾN TRÌNH GIT (GIT CHECKPOINT PROTOCOL):**
   - Trước khi bắt đầu: Chạy `git status` để kiểm tra trạng thái kho code. Tạo nhánh làm việc (hoặc làm trên nhánh hiện tại theo yêu cầu) và tạo commit mốc ban đầu nếu có file đang sửa dở.
   - Kết thúc **MỖI GIAI ĐOẠN (Phase 1 -> Phase 7)**:
     1. Chạy lệnh test kiểm chứng của giai đoạn đó.
     2. Nếu có lỗi: Sửa cho đến khi PASS 100%.
     3. Kiểm tra `git status` để đảm bảo không có file rác, file log tạm thời.
     4. Chạy `git add -A` và `git commit -m "<Thông điệp chuẩn của Phase>"` để lưu mốc an toàn.

---

## PHẦN 1: QUY TRÌNH ĐIỀU PHỐI SUBAGENTS THEO 7 GIAI ĐOẠN (PHASES)

Hãy thực hiện lần lượt từ **Phase 1** đến **Phase 7**. Trong mỗi Phase, hãy khởi tạo Subagent tương ứng, truyền đầy đủ chỉ dẫn kỹ thuật của Phase đó cho Subagent, kiểm tra kết quả và thực hiện **Git Commit** trước khi sang Phase tiếp theo.

---

### 🔹 PHASE 1: Khảo sát Hệ thống & Thiết lập GitHub Codespaces 1-Click Demo
**Gọi Subagent: `Phase1-Codespaces-And-Proxy-Agent`**

#### Nhiệm vụ 1.1: Khảo sát nhanh (Read-only)
Đọc các file sau để nắm rõ cấu hình hiện tại:
- `package.json`, `scripts/serve.mjs`, `frontend/js/config.js`, `frontend/js/api/api.js`
- `backend/src/main/resources/application.yml`, `backend/src/main/java/com/elearning/config/SecurityConfig.java`
- `tests/frontend/unit/config/config.test.mjs`, `tests/frontend/static/csp-resource-graph.test.mjs`
- `tests/postman/fixtures/seed-test-accounts.sql`, `tests/postman/fixtures/seed-test-accounts.mjs`

#### Nhiệm vụ 1.2: Nâng cấp Reverse Proxy trong `scripts/serve.mjs` & Tự động nhận diện Origin trong `frontend/js/config.js`
- **Vấn đề:** Khi chạy trên GitHub Codespaces (`https://<codespace-name>-<port>.app.github.dev`), nếu Frontend gọi sang một port 8080 tách biệt, trình duyệt sẽ bị chặn bởi CSP (`connect-src 'self' http://localhost:8080 http://127.0.0.1:8080`) và lỗi CORS trên port Private của Codespaces.
- **Cách thực hiện trong `scripts/serve.mjs`:**
  - Giữ nguyên toàn bộ tính năng phục vụ file tĩnh hiện có cho thư mục `frontend/`.
  - Thêm logic ở đầu hàm xử lý request (`http.createServer`): Nếu `req.url.startsWith('/api/')` hoặc `req.url.startsWith('/actuator/')`, sử dụng module `node:http` có sẵn của Node.js để proxy (pipe) toàn bộ request (`method`, `url`, `headers`, và request stream body bao gồm cả `multipart/form-data` khi upload Excel) sang Backend tại `process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8080'`, sau đó trả nguyên vẹn status code, response headers và response stream về cho client.
- **Cách thực hiện trong `frontend/js/config.js`:**
  - Kiểm tra cách `config.js` tính toán `apiBaseUrl`.
  - Giữ nguyên toàn bộ hành vi mặc định cho `localhost`, `127.0.0.1` và `window.__ENV__` để **100% bài test trong `tests/frontend/unit/config/config.test.mjs` vẫn PASS**.
  - Bổ sung điều kiện: Nếu không có `window.__ENV__?.API_BASE_URL` ghi đè VÀ `window.location.hostname` kết thúc bằng `.app.github.dev` hoặc `.github.dev`, thì đặt `apiBaseUrl = `${window.location.origin}/api/v1``.

#### Nhiệm vụ 1.3: Tạo cấu hình `.devcontainer/` và nút bấm trên `README.md`
1. Tạo `.devcontainer/docker-compose.yml`:
   - Khởi tạo MySQL 8.0 (`mysql:8.0`) với `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=elearning`, bộ mã `--character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci` và `healthcheck` dùng `mysqladmin ping`.
   - Khởi tạo container `app` dùng image `mcr.microsoft.com/devcontainers/java:1-21-bullseye` (tích hợp feature Node.js 20 và Maven).
2. Tạo `.devcontainer/devcontainer.json`:
   - Cấu hình `forwardPorts: [3000, 8080]` (hoặc port mặc định của `scripts/serve.mjs`).
   - Đặt `portsAttributes` cho cổng Frontend với `"label": "E-Learning Web (Bấm để mở Web)"`, `"onAutoForward": "openBrowser"`.
   - Đặt `postStartCommand: "bash .devcontainer/start-demo.sh"`.
3. Tạo `.devcontainer/start-demo.sh` (cấp quyền `chmod +x`):
   - Đợi MySQL sẵn sàng.
   - Khởi chạy Backend Spring Boot (`mvn -f backend/pom.xml spring-boot:run`) chạy ngầm, đợi `/actuator/health` báo `UP`.
   - Nạp tài khoản mẫu cho 4 vai trò (`Admin`, `Creator`, `Moderator`, `Learner`) từ `tests/postman/fixtures/seed-test-accounts.mjs` (hoặc `.sql`).
   - Khởi chạy Frontend Server (`node scripts/serve.mjs`) và in bảng hướng dẫn + tài khoản mẫu ra màn hình Terminal.
4. Cập nhật đầu file `README.md`:
   - Thêm nút bấm lớn `[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](../../codespaces)` kèm bảng tài khoản đăng nhập mẫu cho 4 quyền (`Learner`, `Creator`, `Moderator`, `Admin`) để Nhóm trưởng bấm vào là kiểm tra được ngay.

#### Nhiệm vụ 1.4: Kiểm thử & Lưu Git Checkpoint 1
- Chạy: `node tests/frontend/runner.mjs --tier static` và `node tests/frontend/runner.mjs --tier unit`
- Khi PASS 100%, chạy:
  ```bash
  git add -A
  git commit -m "chore(codespaces): add 1-click GitHub Codespaces setup and same-origin API proxy"
🔹 PHASE 2: Sửa lỗi Liên kết Bộ Thủ – Từ Vựng (radical_id), Mở rộng Avatar DB & Thêm Chủ đề Học tập (Backend & Flyway V20)
Gọi Subagent: Phase2-Backend-And-Migration-V20-Agent

Nhiệm vụ 2.1: Khảo sát Schema & Dữ liệu hiện tại
Đọc backend/src/main/resources/db/migration/V1__init_schema.sql, V3__seed_radicals.sql, V12__add_vocabulary_hsk_metadata.sql, V13__seed_hsk1_vocabulary_and_radicals.sql, V17__reorganize_curriculum_10_lessons_200_words.sql, V18__remove_radical_video_lesson_url_and_cleanup_test_lessons.sql, V19__support_skill_independent_srs_card_types.sql.

Đọc các Entity và DTO: Vocabulary.java, Radical.java, Lesson.java, UserProfile.java, UpdateProfileRequest.java, UserProfileServiceImpl.java.

Đọc các bài test: ChineseDomainDataAuditTests.java, VocabularyHskAndUnicodeIntegrityTests.java, Curriculum10LessonsIntegrationTests.java, UserProfileControllerTests.java.

Nhiệm vụ 2.2: Tạo Flyway Migration V20__fix_radicals_expand_avatar_and_seed_topics.sql
Tuyệt đối không chạm vào V1–V19. Tạo file backend/src/main/resources/db/migration/V20__fix_radicals_expand_avatar_and_seed_topics.sql thực hiện 3 việc sau:

Mở rộng cột avatar_url trong bảng user_profiles:

SQL
ALTER TABLE user_profiles MODIFY COLUMN avatar_url MEDIUMTEXT NULL;
(Để lưu được cả chuỗi ảnh data:image/webp;base64,... tải lên từ máy tính lẫn preset SVG data URI).

Sửa toàn bộ liên kết radical_id bị sai trong bảng vocabulary:
Sử dụng truy vấn con (SELECT id FROM radicals WHERE kangxi_number = X LIMIT 1) để cập nhật chính xác bộ thủ cấu tạo chuẩn cho toàn bộ từ vựng trong bảng vocabulary.
Dưới đây là bảng đối chiếu chuẩn xác theo số thứ tự Khang Hy (kangxi_number) bắt buộc áp dụng:

kangxi_number = 1 (一 Nhất): 一, 七, 三, 上, 下, 不, 东, 业, 世, 丙, 且, 专

kangxi_number = 2 (丨 Cổn): 中, 丰, 串

kangxi_number = 3 (丶 Chủ): 丸, 丹, 主, 丽, 举

kangxi_number = 4 (丿 Phiệt): 么, 久, 乘, 义, 乎, 乏, 乐, 乒乓

kangxi_number = 5 (乙 Ất): 九, 习, 书, 买, 乱, 乳, 乾

kangxi_number = 6 (亅 Quyết): 了, 事, 争, 予

kangxi_number = 7 (二 Nhị): 二, 五, 些, 亚, 互, 井, 云

kangxi_number = 8 (亠 Đầu): 亮, 京, 亲, 交, 产, 享

kangxi_number = 9 (人/亻 Nhân): 人, 什, 他, 们, 你, 会, 住, 作, 体, 休, 件, 价, 任, 份, 企, 众, 优, 伞, 伟, 传, 伤, 伦, 伴, 伸, 似, 但, 位, 低, 何, 余, 佛, 保, 信, 俩, 俭, 修, 俱, 倍, 倒, 借, 值, 假, 偏, 做, 停, 健, 偶, 偷, 偿, 傅, 傍

kangxi_number = 10 (儿 Nhi): 儿, 元, 先, 兄, 充, 光, 免, 兔, 党, 兜

kangxi_number = 11 (入 Nhập): 入, 全, 内

kangxi_number = 12 (八 Bát): 八, 六, 关, 兴, 共, 兵, 其, 具, 典, 养, 兼, 兽, 冀

kangxi_number = 13 (冂 Quynh): 再, 册, 冒

kangxi_number = 14 (冖 Mịch): 写, 军, 农, 冠, 冤

kangxi_number = 15 (冫 Băng): 冷, 凉, 准, 净, 冻, 况, 减, 凝

kangxi_number = 16 (几 Kỷ): 几, 凡, 凤, 凭, 凯

kangxi_number = 17 (凵 Khảm): 出, 击, 函, 凿

kangxi_number = 18 (刀/刂 Đao): 刀, 分, 切, 前, 别, 到, 利, 刻, 刷, 刺, 刮, 剑, 剧, 剩, 剪, 副, 割, 创, 判, 删, 初, 则, 划, 列, 刘, 刚

kangxi_number = 19 (力 Lực): 力, 办, 加, 动, 助, 努, 劳, 勇, 勉, 勒, 勘, 勤, 励, 劲, 势, 功, 劣

kangxi_number = 20 (勹 Bao): 包, 勺, 勾, 匆

kangxi_number = 21 (匕 Chủy): 北, 化, 匙

kangxi_number = 22 (匚 Phương) / 23 (匸 Hệ): 医, 匹, 区, 巨, 匠, 匪

kangxi_number = 24 (十 Thập): 十, 千, 午, 半, 南, 华, 协, 卒, 卓, 单, 卖, 博

kangxi_number = 26 (卩 Tiết): 卫, 印, 危, 即, 却, 卷, 卸, 卿

kangxi_number = 27 (厂 Hán): 厂, 厅, 历, 厉, 压, 厌, 厕, 厚, 原, 厢, 厨, 厦

kangxi_number = 28 (厶 Khư): 去, 县, 参

kangxi_number = 29 (又 Hựu): 又, 友, 双, 反, 发, 叔, 取, 受, 变, 叙, 叠

kangxi_number = 30 (口 Khẩu): 口, 叫, 吃, 吗, 呢, 吧, 听, 喝, 号, 名, 同, 哪, 喂, 喜, 欢, 唱, 商, 售, 咖啡, 啤酒, 哥哥, 哥, 右, 叶, 合, 吉, 向, 否, 吧, 吵, 吸, 吹, 吻, 吼, 呀, 呆, 呈, 告, 员, 呜, 呢, 周, 味, 呵, 呼, 命, 和, 咸, 咽, 哀, 品, 哄, 哈, 响, 哎, 哑, 哗, 哭, 哲, 哺, 哼, 售, 唯, 喊, 善, 喇, 喉, 喘, 嘴, 嘱, 器, 喷, 嗓

kangxi_number = 31 (囗 Vi): 四, 回, 国, 因, 团, 园, 困, 围, 固, 图, 圆, 圈

kangxi_number = 32 (土 Thổ): 在, 坐, 地, 块, 场, 坏, 城, 墙, 增, 境, 土, 圣, 均, 坊, 坛, 坝, 址, 坡, 坤, 坦, 坪, 垂, 垃圾, 型, 垒, 埃, 埋, 培, 基, 堂, 堆, 堕, 堡, 堤, 堪, 报, 塑, 塔, 塞, 填

kangxi_number = 33 (士 Sĩ): 士, 声, 处, 备, 复, 夏, 壶, 寿

kangxi_number = 36 (夕 Tịch): 夕, 外, 多, 夜, 够, 梦

kangxi_number = 37 (大 Đại): 大, 太, 天, 夫, 失, 头, 奇, 奖, 套, 奔, 夺, 奋, 奥

kangxi_number = 38 (女 Nữ): 女, 她, 好, 妈, 姐, 妹, 奶, 姓, 妻, 姑, 娘, 姨, 妇, 如, 妇, 妥, 妨, 妮, 始, 委, 姿, 威, 娃, 娄, 娇, 娶, 婆, 婚, 媒, 嫁, 嫌, 嫩

kangxi_number = 39 (子 Tử): 子, 字, 学, 孩, 孙, 季, 孝, 孟, 孤, 孕, 存

kangxi_number = 40 (宀 Miên): 家, 客, 室, 完, 宜, 宝, 实, 宠, 审, 宪, 宫, 害, 宴, 宵, 容, 宽, 宾, 宿, 寂, 寄, 密, 富, 寒, 寓, 察, 寡, 寝, 寨, 安, 守, 宋, 宏, 宗, 官, 宙, 定, 宣

kangxi_number = 41 (寸 Thốn): 对, 寻, 导, 寿, 封, 射, 将, 尊, 小 (Lưu ý: 对 thuộc bộ 寸 41, 小, 少, 尖, 尘, 尚, 尝 thuộc bộ 小 42, 就 thuộc bộ 尢 43).

kangxi_number = 44 (尸 Thi): 尺, 尽, 尾, 尿, 局, 屁, 层, 居, 屈, 届, 屋, 展, 属, 屠

kangxi_number = 46 (山 Sơn): 山, 岁, 岛, 岸, 峰, 崇, 崎, 崔, 崖, 崩, 岗, 岚

kangxi_number = 48 (工 Công): 工, 左, 巧, 巨, 差

kangxi_number = 49 (己 Kỷ): 己, 已, 巳, 巴, 巷

kangxi_number = 50 (巾 Cân): 师, 市, 布, 希, 帐, 帕, 帖, 帘, 帚, 帛, 帝, 带, 席, 帮, 常, 帽, 幅, 幕

kangxi_number = 51 (干 Can): 干, 平, 年, 并, 幸

kangxi_number = 53 (广 Nghiễm): 店, 床, 应, 底, 座, 庭, 康, 庆, 庐, 库, 庙, 府, 庞, 废, 度, 延

kangxi_number = 57 (弓 Cung): 弟, 张, 引, 弘, 弛, 弦, 弧, 弯, 弱, 弹, 强, 弥

kangxi_number = 59 (彡 Sam): 影, 形, 彩, 彬, 彭, 彰

kangxi_number = 60 (彳 Xích): 很, 得, 往, 征, 待, 律, 后, 徐, 徒, 徘, 徙, 御, 循, 微, 德, 彻

kangxi_number = 61 (心/忄 Tâm): 心, 想, 您, 忙, 快, 慢, 懂, 忘, 念, 忽, 怀, 态, 怎, 怒, 怕, 怖, 思, 怠, 急, 性, 怨, 怪, 怯, 总, 恋, 恐, 恒, 恕, 恢, 恤, 恨, 恩, 恬, 恭, 息, 恰, 悦, 悉, 悔, 悖, 患, 悬, 悲, 情, 惊, 惑, 惜, 惠, 惧, 惨, 惩, 惭, 惯, 惰, 愈, 愉, 意, 愕, 愚, 感, 愤, 愧, 愿, 慈, 慌, 慎, 慕, 慰, 憾, 懒

kangxi_number = 62 (戈 Qua): 我, 或, 战, 戚, 戴, 戏, 成, 戒

kangxi_number = 63 (戶/户 Hộ): 房, 所, 扇, 户, 扁

kangxi_number = 64 (手/扌 Thủ): 手, 打, 找, 把, 拿, 搬, 接, 提, 换, 挂, 推, 拉, 抱, 扔, 掉, 擦, 才, 扎, 扑, 扒, 托, 扛, 扣, 执, 扩, 扫, 扬, 扭, 扮, 扯, 扰, 扶, 批, 扼, 承, 技, 抄, 抉, 抓, 投, 抖, 抗, 折, 抚, 抛, 抢, 护, 报, 披, 抬, 抱, 抵, 抹, 押, 抽, 拂, 拆, 拇, 拍, 拒, 拓, 拔, 拖, 拗, 拘, 拙, 招, 拜, 拟, 拢, 拣, 拥, 拦, 拧, 拨, 择, 括, 拭, 拮, 拯, 拱, 拳, 拴, 拷, 拼, 拽, 拾, 持, 挂, 指, 按, 挎, 挑, 挖, 挚, 挛, 挝, 挞, 挟, 挠, 挡, 挣, 挤, 挥, 挨, 挪, 挫, 振, 挺, 挽, 捂, 捅, 捆, 捉, 捍, 捎, 捏, 捐, 捕, 捞, 损, 捡, 捣, 捧, 据, 捱, 捶, 捷, 捻, 掀, 掂, 授, 掉, 掌, 掏, 掐, 排, 掖, 掘, 掠, 探, 掣, 接, 控, 推, 掩, 措, 掬, 掲, 掳, 掴, 掷, 掸, 掺, 掼, 掾, 搁, 搂, 搅, 搏, 搐, 搓, 搔, 搜, 搞, 搪, 搬, 搭, 携, 搽, 摁, 摄, 摅, 摆, 摇, 摈, 摊, 摒, 摔, 摘, 摞, 摧, 摩, 摸, 摹, 摺, 撂, , 撑, 撒, 撕, 撞, 撤, 撩, 撬, 播, 撮, 撰, 撵, 撷, 撸, 撺, 撼, 擀, 擂, 擅, 操, 擎, 擐, 擒, 擘, 擞, 擢, 擦, 攀, 攒, 攘, 攥, 攫

kangxi_number = 66 (攴/攵 Phộc): 放, 教, 敢, 散, 敬, 数, 敲, 整, 敌, 效, 救, 败, 叙, 敏, 故, 政, 收, 改, 攻

kangxi_number = 67 (文 Văn): 文, 斋, 斌, 斐, 斑

kangxi_number = 69 (斤 Cân): 斤, 新, 断, 斯, 斩, 斥

kangxi_number = 70 (方 Phương): 方, 旁, 旅, 族, 旗, 施, 旋

kangxi_number = 71 (无 Vô): 无, 既

kangxi_number = 72 (日 Nhật): 日, 是, 星, 明, 早, 晚, 时, 晴, 昨, 春, 映, 昭, 是, 昵, 昼, 显, 晃, 晋, 晒, 晓, 晕, 晖, 暂, 暇, 暑, 暖, 暗, 暮, 暴, 曜, 曝, 旦, 旧, 旨, 旬, 旭, 旱, 旺, 昂, 昆, 昌, 昏, 易, 昔

kangxi_number = 73 (曰 Viết): 最, 替, 曾, 曲, 更

kangxi_number = 74 (月 Nguyệt): 月, 有, 朋, 服, 期, 望, 朝, 朗, 朔

kangxi_number = 75 (木 Mộc): 木, 本, 机, 来, 杯, 果, 校, 桌, 椅, 树, 楼, 极, 林, 森, 条, 条件, 板, 极, 构, 析, 枕, 枚, 松, 枪, 枫, 枯, 架, 枷, 柄, 柏, 某, 柑, 染, 柔, 柜, 查, 束, 柱, 柳, 柴, 柿, 栅, 标, 栈, 栋, 栏, 树, 栓, 栖, 栗, 根, 格, 栽, 桀, 桁, 桂, 桃, 框, 案, 桌, 桎, 桐, 桑, 桓, 桔, 档, 桥, 桦, 桨, 桩, 梦, 梧, 梨, 梭, 梯, 械, 梳, 梵, 检, 棂, 棉, 棋, 棍, 棒, 棕, 棘, 棚, 棠, 棣, 森林, 棱, 棵, 棹, 棺, 棼, 椅, 椋, 植, 椎, 椒, 椟, 椠, 椤, 椭, 椰, 椴, 椹, 椽, 椿, 楂, 楔, 楱, 楚, 楝, 楞, 楠, 楣, 楦, 楫, 楮, 楯, 楷, 楸, 楹, 楼, 概, 榄, 榆, 榇, 榈, 榉, 榔, 榕, 榘, 榛, 榜, 榧, 榨, 榫, 榭, 荣, 榴, 榻, 槁, 槃, 槊, 槌, 枪, 槎, 槐, 槔, 槛, 槟, 槠, 槭, 槲, 槽, 槿, 桩, 乐, 樊, 梁, 模, 樟, 横, 樯, 樱, 樵, 樽, 樾, 橄, 橇, 橐, 橘, 橙, 橛, 橡, 橥, 橱, 橹, 橼, 檀, 檄, 檎, 檐, 檑, 檗, 檠, 檩, 檫, 檬

kangxi_number = 76 (欠 Khiếm): 欢, 歌, 次, 欠, 欣, 欧, 欲, 欺, 款, 歇, 歉

kangxi_number = 77 (止 Chỉ): 止, 正, 步, 武, 歧, 歪

kangxi_number = 80 (毋 Vô): 每, 母, 毒

kangxi_number = 81 (比 Tỷ): 比, 毕, 毙

kangxi_number = 82 (毛 Mao): 毛, 毯, 毫

kangxi_number = 84 (气 Khí): 气, 氢, 氧, 氨, 氮, 氯, 氟, 氦, 氖, 氩

kangxi_number = 85 (水/氵 Thủy): 水, 汉, 没, 洗, 汽, 渴, 泳, 河, 海, 流, 深, 清, 满, 漂, 演, 游, 澡, 法, 汁, 求, 汇, 汗, 汛, 汝, 江, 池, 污, 汤, 汨, 汪, 汰, 汲, 汴, 汶, 决, 汾, 沁, 沂, 沃, 沅, 沆, 沈, 沉, 沌, 沏, 沐, 沓, 沔, 沙, 沛, 沟, 没, 沣, 沤, 沥, 沦, 沧, 沨, 沩, 沪, 沫, 沭, 沮, 沱, 沲, 河, 沸, 油, 治, 沼, 沽, 沾, 沿, 泂, 泄, 泅, 泉, 泊, 泌, 泐, 泓, 泔, 法, 泖, 泗, 泛, 泞, 泠, 泡, 波, 泣, 泥, 注, 泪, 泫, 泮, 泯, 泰, 泱, 泳, 泵, 泷, 泸, 泺, 泻, 泼, 泽, 泾, 洁, 洄, 洇, 洈, 洋, 洌, 洎, 洒, 洗, 洙, 洚, 洛, 洞, 津, 洧, 洪, 洫, 洮, 洱, 洲, 洳, 洵, 汹, 浈, 活, 洼, 洽, 派, 流, 浃, 浅, 浆, 浇, 浈, 浊, 测, 浍, 济, 浏, 浑, 浒, 浓, 浔, 浙, 浚, 浜, 浞, 浠, 浣, 浦, 浩, 浪, 浮, 浯, 浴, 海, 浸, 浼, 涂, 涅, 消, 涉, 涌, 涎, 涑, 涓, 涔, 涕, 涛, 涝, 涞, 涟, 涠, 涡, 涣, 涤, 润, 涧, 涨, 涩, 涪, 涫, 涮, 涯, 液, 涵, 涸, 涿, 淀, 淄, 淅, 淆, 淇, 淋, 淌, 淑, 淖, 淘, 淙, 泪, 淞, 淡, 淤, 淦, 淫, 淬, 淮, 深, 淳, 混, 淹, 添, 淼, 清, 渊, 渍, 渎, 渐, 渑, 渔, 渖, 渗, 渚, 渝, 渠, 渡, 渣, 渤, 渥, 温, 渫, 渭, 港, 渰, 渴, 游, 渺, 湃, 湄, 湍, 湎, 湓, 湔, 湖, 湘, 湛, 湟, 湨, 湫, 湮, 湾, 湿, 溃, 溅, 溆, 溇, 溉, 溏, 源, 溘, 溜, 溟, 溢, 溥, 溦, 溪, 溯, 溱, 溲, 溴, 溶, 溷, 溺, 溻, 溽, 滁, 滂, 滃, 沧, 灭, 滇, 滋, 荥, 滑, 滓, 滔, 滕, 滚, 滞, 滟, 滠, 满, 滢, 滤, 滥, 滦, 滨, 滩, 滴, 滹, 漂, 漆, 漉, 漏, 漓, 演, 漕, 漠, 漤, 漩, 漪, 漫, 漭, 漯, 漱, 漳, 漶, 渐, 漾, 浆, 潆, 潇, 潋, 潍, 潘, 潜, 潞, 潟, 潢, 潦, 潭, 潮, 潲, 潴, 潸, 潺, 潼, 澄, 澈, 澉, 澌, 澍, 澎, 澜, 澡, 澧, 澳, 澶, 澹, 激, 濂, 濉, 濑, 濒, 濞, 濠, 濡, 濮, 濯, 瀑, 瀚, 瀛, 瀣, 瀵, 瀹, 灌, 灏, 灞

kangxi_number = 86 (火/灬 Hỏa): 火, 点, 热, 烤, 灯, 烧, 烟, 然, 照, 熟, 熊, 熊猫

kangxi_number = 87 (爪 Trảo): 爱, 爬, 爵

kangxi_number = 88 (父 Phụ): 爸, 爷, 父, 爹

kangxi_number = 93 (牛 Ngưu): 牛, 物, 特, 牧, 牲, 牵, 犀, 牺牲

kangxi_number = 94 (犬/犭 Khuyển): 狗, 猫, 猪, 猴, 狮, 狼, 猎, 猜, 独, 狂, 狐, 狠, 狡, 狭, 狱, 猛, 献

kangxi_number = 96 (玉/王 Ngọc): 王, 玩, 班, 球, 现, 理, 玻, 玻璃, 珍, 珠, 琴, 环, 瑞, 瑟, 瑰, 瑶, 璧

kangxi_number = 100 (Sinh): 生, 产

kangxi_number = 101 (Dụng): 用, 甩

kangxi_number = 102 (田 Điền): 电, 男, 画, 留, 田, 由, 甲, 申, 界, 畏, 畔, 畜, 略, 番, 疆

kangxi_number = 104 (疒 Nạch): 病, 疼, 痛, 瘦, 疯, 疲, 疾, 症, 痕, 痒, 痘, 痢, 瘫, 瘸, 瘾, 癌, 癣, 癫

kangxi_number = 106 (白 Bạch): 白, 百, 的, 皇, 皆, 皂, 皓, 皖

kangxi_number = 109 (目 Mục): 看, 睡, 眼, 睛, 眼镜, 目, 盯, 盲, 直, 相, 盼, 盾, 省, 眉, 真, 眠, 眨, 眩, 眯, 眶, 眷, 眸, 眺, 着, 睁, 睐, 瞄, 瞅, 瞌, 瞎, 瞒, 瞥, 瞧, 瞪, 瞬, 瞭, 瞳, 瞻, 矗

kangxi_number = 111 (矢 Thỉ): 知, 短, 矮, 矩, 矫

kangxi_number = 112 (石 Thạch): 石, 破, 碗, 确, 研, 硬, 础, 碎, 碑, 碧, 碰, 碳, 磁, 磨, 磷, 磺, 礁, 礅, 码, 砂, 砍, 砒, 研, 砖, 砗, 砚, 砜, 砝, 砟, 砣, 砥, 砧, 砭, 砰, 破, 砷, 砸, 砹, 砺, 砻, 砼, 砾

kangxi_number = 113 (示/礻 Thị): 视, 祝, 票, 禁, 礼, 社, 祖, 神, 祥, 祸, 福, 禅

kangxi_number = 115 (禾 Hòa): 秋, 种, 租, 称, 程, 稍, 税, 稳, 稼, 稽, 稿, 穆, 穗, 禾, 秃, 秀, 私, 秆, 秉, 科, 秒, 秕, 秘, 租, 秣, 秤, 秦, 秧, 秩, 秫, 积, 移, 稀, 稂, 税, 稆, 程, 稍, 稔, 稗, 稚, 稞, 稠, 稣

kangxi_number = 116 (穴 Huyệt): 穿, 窗, 空, 突, 究, 穷, 窃, 窄, 窑, 窒, 窖, 窥, 窟, 窝, 窦, 窿

kangxi_number = 117 (立 Lập): 站, 立, 章, 童, 端, 竞, 竖, 竣

kangxi_number = 118 (竹/⺮ Trúc): 笑, 第, 等, 答, 算, 筷, 篮, 简, 箱, 篇, 管, 签, 竹, 竺, 竿, 笃, 笄, 笆, 笈, 笊, 笋, 笏, 笑, 笔, 笕, 笙, 笛, 笞, 笠, 笤, 笥, 符, 笨, 第, 笮, 笱, 笳, 笸, 笺, 笼, 笾, 筅, 笔, 等, 筋, 筌, 筏, 筐, 筑, 筒, 答, 策, 筘, 筚, 筛, 筝, 筠, 筢, 筮, 筱, 筲, 筵, 筷, 筹, 筻, 签, 简, 箅, 箍, 箐, 箔, 箕, 算, 箜, 管, 箢, 箦, 箧, 箨, 箩, 箪, 箫, 箬, 箭, 箱, 箴, 箸, 篁, 篆, 篇, 篌, 篑, 篓, 篙, 篚, 篝, 篡, 篥, 篦, 篪, 篮, 篱, 篷, 篼, 篾, 簇, 簋, 簌, 簏, 簖, 簟, 簦, 簧, 簪, 箫, 檐, 簸, 签名, 簿, 籀, 籁, 籍, 纂, , 

kangxi_number = 119 (米 Mễ): 米, 糖, 糕, 糟, 粮, 类, 粉, 粒, 粗, 粘, 粟, 粤, 粥, 粪, 精, 糊

kangxi_number = 120 (糸/纟 Mịch): 系, 绍, 经, 给, 绿, 红, 练, 纸, 级, 线, 结, 终, 统, 继, 续, 维, 绵, 综, 绸, 缆, 缘, 编, 缓, 紧, 紫, 累, 繁, 素, 索, 约, 纪, 纫, 纹, 纳, 纽, 纾, 纯, 纰, 纱, 纲, 纳, 纵, 纶, 纷, 纸, 纹, 纺, 纽, 纾, 线, 绀, 绁, 绂, 练, 组, 绅, 细, 织, 终, 绉, 绊, 绂, 绌, 绍, 绎, 经, 绐, 绑, 绒, 结, 绔, 绕, 经, 绘, 给, 绚, 绛, 络, 绝, 绞, 统, 绠, 绡, 绢, 绣, 绥, 绦, 继, 绨, 绩, 绪, 绫, 续, 绮, 绯, 绰, 绱, 绲, 绳, 维, 绵, 绶, 绷, 绸, 绹, 绺, 绻, 综, 绽, 绾, 绿, 缀, 缁, 缂, 缃, 缄, 缅, 缆, 缇, 缈, 缉, 缊, 缋, 缌, 缍, 缎, 缏, 线, 缑, 缒, 缓, 缔, 缕, 编, 缗, 缘, 缙, 缚, 缛, 缜, 缝, 缞, 缟, 缠, 缡, 缢, 缣, 缤, 缥, 缦, 缧, 缨, 缩, 缪, 缫, 缬, 缭, 缮, 缯, 缰, 缱, 缲, 缳, 缴, 缵

kangxi_number = 123 (羊 Dương): 羊, 美, 群, 羞, 羡, 义

kangxi_number = 124 (羽 Vũ): 习, 羽, 翅, 翔, 翘, 翻, 翼

kangxi_number = 125 (老 Lão): 老, 考, 者

kangxi_number = 128 (耳 Nhĩ): 耳, 聊, 聪, 联, 聘, 聚, 闻, 职, 耽, 耿, 聂, 聋

kangxi_number = 130 (肉/月 Nhục): 肉, 脑, 胖, 脚, 腿, 脸, 脱, 脾, 肚, 肠, 股, 肢, 肥, 肩, 肪, 肮, 肯, 育, 肴, 肺, 肾, 肿, 胃, 胆, 背, 胎, 胞, 胡, 胤, 胥, 胳, 胴, 胸, 胺, 能, 脂, 胁, 脆, 脉, 脊, 脖, 脏, 脐, 胶, 胸, 胺, 胼, 脆, 脂, 脑, 脓, 脖, 脚, 脯, 脱, 脲, 脶, 脸, 脾, 腆, 腈, 腊, 腋, 腌, 腐, 腑, 腓, 腔, 腕, 腥, 腮, 腰, 腱, 腴, 腹, 腺, 腻, 腼, 腽, 腾, 腿, 膀, 膂, 膈, 膊, 膏, 膑, 膘, 膛, 膜, 膝, 胶, 膨胀, 膳, 膺, 膻, 臀, 臂, 臃, 臆, 臊, 臌, 臣

kangxi_number = 132 (自 Tự): 自, 臭

kangxi_number = 134 (臼 Cữu): 舅, 舆, 舀, 舂

kangxi_number = 135 (舌 Thiệt): 舌, 乱, 辞, 舔, 舒, 馆 (Lưu ý: 馆 thuộc bộ 食/饣 184).

kangxi_number = 137 (舟 Chu): 船, 般, 航, 舰, 舱, 艘, 艇

kangxi_number = 139 (色 Sắc): 色, 艳

kangxi_number = 140 (艸/艹 Thảo): 花, 茶, 菜, 苹, 苹果, 草, 药, 蓝, 葡萄, 蕉, 香蕉, 节, 艺, 苦, 英, 若, 茂, 范, 茄, 茅, 茎, 茧, 茨, 茫, 茬, 茵, 茴, 茹, 荀, 荃, 荆, 荇, 草, 荆, 荐, 荑, 荒, 荔, 荚, 荛, 荜, 荞, 荟, 荠, 荡, 荣, 荤, 荥, 荦, 荧, 荨, 荩, 荪, 荫, 荬, 荭, 荮, 药, 荷, 荸, 荻, 荼, 荽, 莅, 莆, 莉, 莎, 莒, 莓, 莘, 莛, 莞, 莠, 莢, 苋, 莩, 莪, 莫, 莱, 莲, 莳, 莴, 莶, 获, 莸, 莹, 莺, 莼, 莽, 菀, 菁, 菅, 菇, 菊, 菌, 菏, 菔, 菖, 菘, 菜, 萏, 菠, 菡, 萇, 菩, 菱, 菲, 菹, 萠, 萍, 萎, 菡, 萝, 萤, 营, 萦, 萧, 萨, 落, 萱, 萸, 萼, 莴, 葡, 董, 葩, 葫, 葬, 葭, 葱, 葳, 葵, 荤, 葺, 蒂, 蒇, 蒈, 蒉, 蒋, 蒌, 蒍, 蒜, 蒟, 蒡, 蒲, 蒸, 蒹, 蒺, 蒻, 苍, 蒿, 荪, 蓁, 蓄, 蓉, 蓊, 蓍, 蓐, 蓑, 蓓, 蓖, 蓝, 蓟, 蓠, 蓣, 蓥, 蓦, 蓬, 蓼, 蓿, 蔹, 蔑, 蔓, 蔗, 蔚, 蔟, 蔡, 蔫, 蔬, 蔷, 蔸, 蔹, 蔽, 蕃, 蕈, 蕉, 蕊, 蕖, 蕙, 蕞, 蕤, 蕨, 荡, 芜, 蕲, 蕴, 蕹, 蕺, 蕻, 蕾, 薄, 薇, 薏, 薛, 薜, 薅, 薪, 萨, 薯, 薰, 藉, 蓝, 藏, 藐, 藓, 藕, 藜, 艺, 藤, 药, 藩, 藻, 藿, 蘅, 蘑, 蘖, , 蘸, 蘼

kangxi_number = 142 (虫 Trùng): 蛋, 蛋糕, 蜂, 蜜, 蝴蝶, 蚊, 蛇, 虫, 虹, 虽, 虾, 蚀, 蚁, 蚂, 蚕, 蚜, 蚌, 蚍, 蚓, 蚕, 蚜, 蚣, 蚤, 蚧, 蚨, 蚩, 蚪, 蚬, 蚯, 蚰, 蚱, 蚴, 蚵, 蚶, 蚺, 蛀, 蛄, 蛆, 蛇, 蛉, 蛊, 蛋, 蛎, 蛏, 蛐, 蛑, 蛔, 蛘, 蛙, 蛛, 蛞, 蛟, 蛤, 蛩, 蛭, 蛮, 蛰, 蛱, 蛲, 蛳, 蛴, 蛸, 蛹, 蛾, 蜀, 蜂, 蜃, 蜇, 蜈, 蜉, 蜊, 蜍, 蜒, 蜓, 蜕, 蜗, 蜘蛛, 蜚, 蜜, 蜞, 蜡, 蜢, 蜣, 蜥, 蜩, 蜮, 蜱, 蜴, 蜷, 蜻, 蜾, 蜿, 蝇, 蝈, 蝉, 蝌, 蝎, 蝓, 蚀, 蝗, 蝙, 蝠, 蝣, 蝤, 蝥, 蝮, 蝰, 蝴蝶, 蝻, 蝼, 蝽, 蝾, 螂, 螃, 螅, 螈, 螋, 融, 螓, 螗, 螟, 萤, 螨, 螫, 螬, 螭, 螯, 螳, 螵, 螺, 螽, 蟀, 蟆, 蟊, 蟋, 蟑, 蟒, 蟓, 蟛, 蟠, 蟥, , 蟾, 蠊, 蟹, 蠛, 蠃, , 蠢, 蠡, , 蠲, 蠹, 蠼

kangxi_number = 144 (行 Hành): 行, 街, 衡

kangxi_number = 145 (衣/衤 Y): 衣, 裙, 裤, 衫, 衬, 衬衫, 被, 装, 袋, 补, 表, 衰, 衷, 袁, 袄, 袅, 袭, 袱, 袈, 裂, 裁, 裔, 裕, 裘, 褐, 裹, 裸, 褂, 襟

kangxi_number = 146 (襾/西 Á/Tây): 西, 要, 覆

kangxi_number = 147 (見/见 Kiến): 见, 觉, 观, 规, 视, 览, 宽 (Lưu ý: 视 thuộc bộ 示 113, 宽 thuộc bộ 宀 40).

kangxi_number = 148 (角 Giác): 角, 解, 触

kangxi_number = 149 (言/讠 Ngôn): 语, 话, 说, 请, 谢, 读, 谁, 认, 识, 课, 试, 讲, 词, 诉, 记, 讨, 让, 训, 议, 讯, 设, 访, 证, 评, 识, 诈, 诉, 诊, 诋, 诌, 词, 诎, 诏, 译, 诒, 诓, 诔, 试, 诖, 诗, 诘, 诙, 诚, 诛, 诜, 话, 诞, 诟, 诠, 诡, 询, 诣, 诤, 该, 详, 诧, 诨, 诩, 诫, 诬, 语, 诮, 误, 诰, 诱, 诲, 诳, 说, 诵, 诶, 请, 诸, 诹, 诺, 读, 诼, 诽, 课, 诿, 谀, 谁, 谂, 调, 谄, 谅, 谆, 谇, 谈, 谊, 谋, 谌, 谍, 谎, 谏, 谐, 谑, 谒, 谓, 谔, 谕, 谖, 谗, 谘, 谙, 谚, 谛, 谜, 谝, 谟, 谠, 谡, 谢, 谣, 谤, 谥, 谦, 谧, 谨, 谩, 谪, 谫, 谬, 谭, 谮, 谯, 谰, 谱, 谲, 谳, 谴, 谵, 谶, 言, 警, 誉, 誓, 譬

kangxi_number = 154 (貝/贝 Bối): 贵, 买, 卖, 钱, 赛, 宾, 贺, 贷, 费, 贴, 贸, 资, 赏, 赐, 赔, 赖, 赚, 购, 贮, 贯, 贰, 贱, 贲, 贳, 贴, 贵, 贶, 贷, 贸, 费, 贺, 贻, 贼, 贽, 贾, 贿, 赀, 赁, 赂, 赃, 资, 赅, 赆, 赇, 赈, 赉, 赊, 赋, 赌, 赍, 赎, 赏, 赐, 赑, 赒, 赓, 赔, 赕, 赖, 赗, 赘, 赙, 赚, 赛, 赜, 赝, 赞, 赟, 赠, 赡, 赢, 赣 (Lưu ý: 钱 thuộc bộ 金/钅 167, 买 thuộc bộ 乙 5, 卖 thuộc bộ 十 24).

kangxi_number = 156 (走 Tẩu): 走, 起, 超, 越, 趋, 趣, 趁, 赵, 赶, 趾

kangxi_number = 157 (足 Túc): 跑, 路, 踢, 跳, 跳舞, 跟, 足, 趴, 距, 跃, 践, 跌, 跛, 跨, 跪, 路, 跳, 跺, 踊, 踌, 踏, 踩, 踪, 踞, 踢, 踩, , 蹑, 蹒, 蹊, 蹙, 蹲, 蹴, 蹶, 蹼, 蹿, 躁, 躅, 躇, 躏, 躐, 

kangxi_number = 158 (身 Thân): 身, 射, 躺, 躯

kangxi_number = 159 (車/车 Xa): 车, 辆, 轻, 较, 载, 轮, 软, 转, 输, 轨, 轩, 轫, 转, 轭, 轮, 软, 轰, 轱, 轲, 轳, 轴, 轵, 轶, 轷, 轸, 轹, 轺, 轻, 轼, 载, 轾, 轿, 辀, 辁, 辂, 较, 辄, 辅, 辆, 辇, 辈, 辉, 辊, 辋, 辌, 辍, 辎, 辏, 辐, 辑, 辒, 输, 辔, 辕, 辖, 辗, 辘, 辙, 辚

kangxi_number = 160 (辛 Tân): 辞, 辣, 辨, 辩, 辫, 辛, 辜, 辟

kangxi_number = 162 (辵/辶 Sước): 这, 那, 进, 远, 近, 送, 还, 过, 迎, 选, 迷, 退, 追, 逃, 适, 速, 造, 逢, 连, 逛, 遍, 道, 达, 边, 辽, 迈, 迁, 迄, 迅, 过, 迈, 迎, 运, 近, 迓, 返, 迕, 还, 这, 进, 远, 违, 连, 迟, 迢, 迤, 迥, 迦, 迨, 迩, 迪, 迫, 迭, 迮, 述, 径, 迷, 迸, 迹, 迺, 追, 退, 送, 适, 逃, 逄, 逅, 逆, 选, 逊, 逋, 逍, 透, 逐, 逑, 递, 途, 迳, 逖, 逗, 通, 逛, 逝, 逞, 速, 造, 逡, 逢, 逦, 逭, 逮, 逯, 逵, 逶, 逸, 逻, 逼, 逾, 遁, 遂, 遄, 遇, 遍, 遏, 遐, 遑, 遒, 道, 达, 违, 遘, 遥, 遛, 逊, , 递, 远, 溯, 遢, 遣, 遥, 遨, 适, 遭, 遮, 遯, 迟, 遴, 遵, 遶, 迁, 选, 遗, 辽, 遽, 避, 邀, 迈, 邂, 邃, 邈, 邋 (Lưu ý: 那, 都, 邻, 郊, 郎, 郭, 邮, 部 thuộc bộ 邑/阝 163).

kangxi_number = 164 (酉 Dậu): 酒, 酸, 醉, 醒, 配, 醋, 酱, 酬, 酷, 酿

kangxi_number = 166 (里 Lý): 里, 重, 量, 野

kangxi_number = 167 (金/钅 Kim): 钱, 钟, 铅, 铅笔, 银, 银行, 错, 铁, 钢, 针, 铜, 镜, 锻, 锁, 锅, 钥, 钥匙, 钻, 铃, 金, 釜, 鉴, 鏖, 鎏, 鏊, , 钆, 钇, 针, 钉, 钊, 钋, 钌, 钍, 钎, 钏, 钐, 钒, 钓, 钔, 钕, 钗, 钙, 钚, 钛, 钜, 钝, 钞, 钟, 钠, 钡, 钢, 钣, 钤, 钥匙, 钦, 钧, 钨, 钩, 钪, 钫, 钬, 钭, 钮, 钯, 钰, 钱, 钲, 钳, 钴, 钵, 钶, 钷, 钸, 钹, 钺, 钻, 钼, 钽, 钾, 钿, 铀, 铁, 铂, 铃, 铄, 铅, 铆, 铈, 铉, 铊, 铋, 铌, 铍, 铎, 铏, 铐, 铑, 铒, 铓, 铔, 铕, 铖, 铗, 铘, 铙, 铚, 铛, 铜, 铝, 铞, 铟, 铠, 铡, 铢, 铣, 铤, 铥, 铦, 铧, 铨, 铩, 铪, 铫, 铬, 铭, 铮, 铯, 铰, 铱, 铲, 铳, 铴, 铵, 银, 铷, 铸, 铹, 铺, 铻, 铼, 铽, 链, 铿, 销, 锁, 锂, 锃, 锄, 锅, 锆, 锇, 锈, 锉, 锊, 锋, 锌, 锍, 锎, 锏, 锐, 锑, 锒, 锓, 锔, 锕, 锖, 锗, 锘, 错, 锚, 锛, 锜, 锝, 锞, 锟, 锡, 锢, 锣, 锤, 锥, 锦, 锧, 锨, 锩, 锪, 锫, 锬, 锭, 键, 锯, 锰, 锱, 锲, 锳, 锴, 锵, 锶, 锷, 锸, 锹, 锺, 锻, 锼, 锽, 锾, 锿, 镀, 镁, 镂, 镃, 镄, 镅, 镆, 镇, 镈, 镉, 镊, 镋, 镌, 镍, 镎, 镏, 镐, 镑, 镒, 镓, 镔, 镕, 镖, 镗, 镘, 镙, 镚, 镛, 镜, 镝, 镞, 镟, 镡, 镠, 镣, 镢, 镥, 镦, 镧, 镨, 镩, 镪, 镫, 镬, 镭, 镮, 镯, 镰, 镱, 镲, 镳, 镴, 镶

kangxi_number = 168 (長/长 Trường): 长

kangxi_number = 169 (門/门 Môn): 门, 问, 间, 闻, 闲, 闹, 闭, 闯, 闪, 闷, 闸, 阁, 阀, 阅, 阐, 阔

kangxi_number = 170 (阜/阝 Phụ): 院, 阴, 阳, 除, 队, 际, 阿, 附, 陆, 陈, 降, 限, 陡, 险, 陪, 随, 隐, 隔, 障

kangxi_number = 172 (隹 Chuy): 难, 集, 准, 虽, 雄, 雅, 雇, 雌, 雍, 雕

kangxi_number = 173 (雨 Vũ): 雨, 零, 雪, 雷, 雾, 需, 震, 露, 霜, 霞, 雹, 霄, 霉, 霍, 霎, 霓, 霖

kangxi_number = 174 (靑/青 Thanh): 青, 静, 靖, 靛

kangxi_number = 175 (非 Phi): 非, 靠

kangxi_number = 176 (面 Diện): 面

kangxi_number = 177 (革 Cách): 鞋, 鞭, 鞠

kangxi_number = 180 (音 Âm): 音, 音乐, 韵, 韶

kangxi_number = 181 (頁/页 Hiệt): 页, 题, 须, 领, 顿, 顾, 预, 顺, 顽, 颁, 颂, 颐, 频, 颖, 颔, 颈, 颓, 频, 颗, 题, 额, 颞, 颜, 领, 颛, 颜, 额, 颠, 颡, 颢, 颤, 颥, 颦, 颧

kangxi_number = 182 (風/风 Phong): 风, 刮风, 飘, 飙

kangxi_number = 183 (飛/飞 Phi): 飞, 飞机

kangxi_number = 184 (食/饣 Thực): 饭, 饿, 馆, 饱, 饮, 饺, 饼, 饲, 饶, 蚀, 饷, 馁, 饿, 馀, 馁, 馆, 饯, 馄, 馅, 馆, 馊, 馋, 馍, 馏, 馐, 馑, 馒, 馓, 馔, 馕, 食, 餐, 饕, 餮

kangxi_number = 186 (香 Hương): 香

kangxi_number = 187 (馬/马 Mã): 马, 骑, 驾, 骂, 骄, 验, 惊, 骗, 骤, 驴, 驶, 驷, 驸, 驹, 驻, 驼, 驽, 驾, 驿, 骀, 骁, 骂, 骃, 骄, 骅, 骆, 骇, 骈, 骉, 骊, 骋, 验, 骍, 骎, 骏, 骐, 骑, 骒, 骓, 骔, 骕, 骖, 骗, 骘, 骙, 骚, 骛, 骜, 骝, 骞, 骟, 骠, 骡, 骢, 骣, 骤, 骥, 骦, 骧

kangxi_number = 189 (高 Cao): 高

kangxi_number = 195 (魚/鱼 Ngư): 鱼, 鲜, 鲤, 鲨, 鲸, 鳄

kangxi_number = 196 (鳥/鸟 Điểu): 鸟, 鸡, 鸭, 鹅, 鸽, 鹰

kangxi_number = 201 (黃/黄 Hoàng): 黄

kangxi_number = 203 (黑 Hắc): 黑, 默

kangxi_number = 209 (鼻 Tỵ): 鼻

kangxi_number = 210 (齊/齐 Tề): 齐

kangxi_number = 211 (齒/齿 Xỉ): 齿, 龄

kangxi_number = 212 (龍/龙 Long): 龙

Đảm bảo dữ liệu Chủ đề (Topics/Lessons) cho 5 Danh mục Ôn tập:

Kiểm tra các bài học PUBLISHED hiện có trong bảng lessons.

Thêm các bài học/chủ đề PUBLISHED cho HSK 2 và HSK 3 (sử dụng các từ vựng HSK 2, HSK 3 trong bảng vocabulary hoặc seed bổ sung các từ có sẵn file stroke JSON trong frontend/assets/data/strokes/) để khi người dùng chuyển giữa các tab 50 Bộ thủ thông dụng, 214 Bộ thủ, HSK 1, HSK 2, HSK 3 trên trang Ôn tập, danh mục nào cũng có đầy đủ danh sách các Chủ đề (Topics) để học Flashcard và Luyện viết.

Nhiệm vụ 2.3: Cập nhật UpdateProfileRequest.java
Mở backend/src/main/java/com/elearning/dto/request/UpdateProfileRequest.java.

Trong trường avatarUrl:

Mở rộng @Size(max = 500000) (thay vì 500 ký tự như cũ).

Cập nhật @Pattern (nếu có) để cho phép cả ^https?://.* VÀ ^data:image/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$ (hoặc ^data:image/svg\+xml;utf8,.*).

Kiểm tra UserProfileControllerTests.java và UserProfileServiceTests.java để đảm bảo các bài test cũ vẫn PASS và thêm test cho data:image/... avatar.

Nhiệm vụ 2.4: Kiểm thử Backend & Lưu Git Checkpoint 2
Chạy test Maven cho các class liên quan (ChineseDomainDataAuditTests, VocabularyHskAndUnicodeIntegrityTests, UserProfileControllerTests, Curriculum10LessonsIntegrationTests).

Lưu Git Checkpoint:

Bash
git add -A
git commit -m "feat(backend): add V20 radical mapping fixes, topic seeds, and base64 avatar support"
🔹 PHASE 3: Tổng Vệ Sinh Giao Diện (Declutter UI), Đồng Bộ Card & Tách Chế Độ "Cách Viết"
Gọi Subagent: Phase3-UI-Declutter-And-Writing-Demo-Agent

Nhiệm vụ 3.1: Tinh gọn Thanh Điều Hướng (frontend/js/ui/nav.js & toàn bộ frontend/*.html)
Mở frontend/js/ui/nav.js và tất cả các file frontend/*.html:

Với người dùng chưa đăng nhập (Guest):

Xóa nút Bắt đầu học.

Hiển thị đúng 2 nút trên góc phải: Đăng nhập (href="login.html") và Đăng ký (href="register.html").

Menu điều hướng chính của Học viên / Khách:

Gộp 2 mục Bài học và Ôn tập SRS thành 1 mục duy nhất tên là Ôn tập (href="lessons.html" hoặc trang trung tâm ôn tập thống nhất).

Thanh menu chỉ hiển thị 4 mục gọn gàng: Trang chủ | Bộ thủ | Từ vựng | Ôn tập.

Khi đã đăng nhập:

Xóa bỏ badge chữ HỌC VIÊN dư thừa nằm bên trái nút hồ sơ người dùng. Chỉ hiển thị nút Hồ sơ (Avatar + Tên hiển thị) và nút Đăng xuất (cùng link quản trị nếu tài khoản có quyền Creator, Moderator, Admin).

Nhiệm vụ 3.2: Tinh gọn Trang Chủ (frontend/index.html)
Xóa các nhãn phụ rườm rà: MẪU TỰ ĐIỂN HÌNH, NỀN MÓNG, KHOA HỌC, LỘ TRÌNH, TIẾP CẬN.

Xóa các cụm từ mang tính kỹ thuật nội bộ như W3C WCAG 2.2, SuperMemo-2 (SRS SM-2).

Đổi nội dung thẻ thứ 4 từ "Thiết Kế Chuẩn Mực" thành "Luyện Viết Chữ Hán — Thực hành viết từng nét trực quan và chấm điểm độ chính xác tức thì".

Nút kêu gọi hành động trên Hero section dẫn thẳng vào Khám phá 214 Bộ thủ và Vào Phòng Ôn Tập.

Nhiệm vụ 3.3: Tinh gọn Trang Từ Vựng (frontend/vocabulary.html & frontend/js/pages/vocabulary-page.js)
Trong frontend/vocabulary.html và frontend/js/pages/vocabulary-page.js:

XÓA HOÀN TOÀN khung banner "Sẵn sàng học tập (500 từ)", dòng "Lộ trình chuẩn hóa theo khung Hán ngữ HSK 3.0", 3 ô thống kê (TỔNG SỐ TỪ, ĐÃ HỌC (HÔM NAY), ĐẾN HẠN ÔN SRS), và 2 nút Ôn tập SRS ngay, Học theo Giáo trình / Bài học ->.

XÓA HOÀN TOÀN nhãn phụ 词 TỪ VỰNG HSK 1 phía trên tiêu đề H1.

XÓA HOÀN TOÀN nhãn HIỂN THỊ 1–20 / 500 TỪ VỰNG và nút Xem theo Giáo trình & Bài học ->.

Trên từng Card Từ vựng trong danh sách:

XÓA badge HSK 1 / HSK 2 / HSK 3 trên góc thẻ.

XÓA nút 记 (Ghi chú) trên mặt thẻ danh mục.

Mỗi Card Từ vựng chỉ hiển thị tinh gọn, đồng bộ: Chữ Hán lớn, Pinyin, Âm Hán-Việt (ẩn/hiện theo cài đặt người dùng), Nghĩa tiếng Việt, và Nút Loa phát âm.

Nhiệm vụ 3.4: Tinh gọn Trang Bộ Thủ (frontend/radicals.html & frontend/js/pages/radicals-page.js)
Trong frontend/radicals.html và frontend/js/pages/radicals-page.js:

XÓA HOÀN TOÀN các khung thống kê dư thừa đầu trang, nhãn phụ, và nhãn đếm HIỂN THỊ 1–... / 214 BỘ THỦ.

Chỉ giữ lại: Tiêu đề trang ngắn gọn + Thanh tìm kiếm & lọc số nét + Lưới thẻ 214 Bộ thủ.

Thiết kế CSS của Card Bộ thủ đồng bộ hoàn toàn về bo góc, đổ bóng, khoảng cách và font chữ với Card Từ vựng.

Nhiệm vụ 3.5: Giới hạn Modal ở Trang Từ Vựng & Bộ Thủ CHỈ HIỂN THỊ "Cách viết" (demo)
Mở frontend/js/ui/character-writing/character-writing-modal.js và frontend/js/ui/character-writing/vocab-writing-modal.js (cùng nơi gọi trong radicals-page.js và vocabulary-page.js):

Hỗ trợ tham số tùy chọn demoOnly: true (mặc định true khi mở từ trang radicals.html và vocabulary.html).

Khi demoOnly: true:

Chỉ hiển thị duy nhất chế độ Cách viết (demo) (tự động chạy hoạt ảnh thứ tự nét viết + nút Phát lại nét viết).

Ẩn/Không render 2 tab Luyện nét (practice) và Luyện viết (quiz) trong Modal tra cứu từ điển.

Hiển thị rõ thông tin Bộ thủ liên kết (đã được sửa chuẩn ở Phase 2), Pinyin, Âm Hán-Việt, Nghĩa và Câu ví dụ.

Nhiệm vụ 3.6: Xóa chữ thừa ở các trang còn lại
Kiểm tra creator-lessons.html, creator-import.html, moderator-queue.html, moderator-history.html, admin-accounts.html, admin-lessons.html, admin-vocabulary.html, admin-radicals.html, admin-roles.html: Xóa các pill đếm HIỂN THỊ X–Y / Z rườm rà trên thanh công cụ để giao diện sạch sẽ đồng bộ.

Nhiệm vụ 3.7: Kiểm thử & Lưu Git Checkpoint 3
Cập nhật các unit test trong tests/frontend/unit/vocabulary/, tests/frontend/unit/radicals/, tests/frontend/unit/ui/ nếu các test đó kiểm tra các phần tử thừa vừa xóa.

Chạy: node tests/frontend/runner.mjs --tier static và node tests/frontend/runner.mjs --tier unit.

Khi PASS 100%, chạy:

Bash
git add -A
git commit -m "refactor(ui): declutter all pages, unify card styling, and restrict catalog modals to stroke demo mode"
🔹 PHASE 4: Xây Dựng Trung Tâm "Ôn Tập" Hợp Nhất Theo Mô Hình Parroto (parroto.app)
Gọi Subagent: Phase4-Parroto-Study-Hub-Agent

Nhiệm vụ 4.1: Thiết kế Kiến trúc Trung tâm "Ôn tập"
Hợp nhất trải nghiệm của lessons.html, lesson-detail.html, srs-dashboard.html, srs-review.html thành Trung tâm Ôn tập thống nhất:

Khi người dùng bấm vào Ôn tập trên thanh Navbar (hoặc truy cập lessons.html / srs-dashboard.html), họ được đưa tới giao diện Ôn tập theo Chủ đề (Parroto-style Study Hub).

XÓA BỎ HOÀN TOÀN nút Thống kê Tiến độ SRS, xóa banner màu xanh dương "Nâng cấp SRS theo Kỹ năng...", xóa các nhãn ĐÃ DUYỆT, Cập nhật: 11/10/2026, Xem theo Cấp độ HSK ->, HIỂN THỊ 1–10 / 10 BÀI HỌC.

Nhiệm vụ 4.2: Xây dựng 5 Tab Danh mục lớn & Lưới Chủ đề (Topics)
Trên đầu trang Ôn tập, hiển thị thanh chọn 5 Danh mục lớn (Category Pills):

50 Bộ thủ thông dụng (id="cat-radicals-50")

214 Bộ thủ (id="cat-radicals-214")

HSK 1 (id="cat-hsk1")

HSK 2 (id="cat-hsk2")

HSK 3 (id="cat-hsk3")

Cách tổ chức các Chủ đề (Topics) bên trong mỗi Danh mục:

Khi chọn 50 Bộ thủ thông dụng: Chia 50 bộ thủ thông dụng nhất (như 亻, 氵, 扌, 口, 女, 心, 讠, 木, 日, 月, 火, 土, 艹, 辶, 钅, 饣, 宀, 贝, 车, 马, 鸟, 鱼, 纟, 竹, 目, 石, 禾, 穴, 立, 米, 羊, 耳, 肉, 虫, 衣, 见, 足, 门, 阝, 雨...) thành 5 chủ đề nhỏ (mỗi chủ đề 10 bộ thủ theo nhóm ý nghĩa: Con người & Cơ thể, Thiên nhiên & Thời tiết, Đời sống & Nhà cửa, Hoạt động & Di chuyển, Vật chất & Công cụ).

Khi chọn 214 Bộ thủ: Chia toàn bộ 214 bộ thủ Khang Hy thành các chủ đề theo nhóm số nét (ví dụ: Bộ thủ 1–2 nét, Bộ thủ 3 nét (Phần 1 & 2), Bộ thủ 4 nét (Phần 1 & 2), Bộ thủ 5 nét, Bộ thủ 6 nét, Bộ thủ 7+ nét).

Khi chọn HSK 1, HSK 2, HSK 3: Hiển thị danh sách các Chủ đề từ vựng tương ứng với cấp độ HSK đó (lấy từ API /api/v1/lessons kết hợp phân nhóm từ vựng theo chủ đề).

Trên mỗi Card Chủ Đề (Topic Card):

Hiển thị gọn gàng:

Tên Chủ đề (ví dụ: Chủ đề 01 — Chào hỏi và giao tiếp cơ bản)

Số lượng từ / bộ thủ (ví dụ: 20 từ vựng hoặc 10 bộ thủ) + Các chữ Hán tiêu biểu xem trước (你, 好, 谢, 再...)

2 Nút hành động nổi bật, rõ ràng:

🗂️ Flashcard (Mở phiên học & lặp lại ngắt quãng SRS cho chủ đề đó)

✍️ Luyện viết (Mở phiên thực hành Luyện nét & Luyện viết có chấm điểm cho chủ đề đó)

Một nút phụ nhỏ gọn Xem danh sách từ để mở xem nhanh bảng từ vựng của chủ đề đó nếu cần.

Nhiệm vụ 4.3: Kiểm thử & Lưu Git Checkpoint 4
Kiểm tra việc chuyển đổi qua lại giữa 5 danh mục (50 Bộ thủ thông dụng, 214 Bộ thủ, HSK 1, HSK 2, HSK 3) hoạt động mượt mà, dùng 100% DOM APIs an toàn (createElement, textContent).

Chạy: node tests/frontend/runner.mjs --tier static và node tests/frontend/runner.mjs --tier unit.

Lưu Git Checkpoint:

Bash
git add -A
git commit -m "feat(study-hub): unify lessons and SRS into Parroto-style 5-category study hub"
🔹 PHASE 5: Nâng Cấp Phòng Học Flashcard (Ghi Chú Mặt Sau) & Phòng Luyện Viết (Chấm Điểm 3 Sao Tự Động)
Gọi Subagent: Phase5-Flashcard-Notes-And-Writing-Grader-Agent

Nhiệm vụ 5.1: Phòng Học Flashcard SRS + Ghi Chú Cá Nhân ở Mặt Sau (srs-review.html & srs-review-page.js)
Khi người dùng bấm nút 🗂️ Flashcard từ một Chủ đề bất kỳ (hoặc vào srs-review.html):

Tải danh sách thẻ của chủ đề đó (hỗ trợ cả Bộ thủ RADICAL và Từ vựng VOCABULARY, kết hợp trạng thái đến hạn SRS từ /api/v1/srs/due-cards và /api/v1/srs/new-cards).

Mặt trước Flashcard: Hiển thị Chữ Hán cỡ lớn, rõ nét ở chính giữa thẻ.

Mặt sau Flashcard (sau khi bấm Lật thẻ / phím Space):

Hiển thị: Pinyin, Âm Hán-Việt (nếu bật trong cài đặt), Nghĩa tiếng Việt, Bộ thủ cấu tạo, Câu ví dụ, và Nút Loa phát âm (tự động phát âm nếu autoPlayAudio được bật trong cài đặt).

TÍCH HỢP KHUNG GHI CHÚ CÁ NHÂN NGAY TRÊN MẶT SAU FLASHCARD:

Tạo một vùng <div class="flashcard-personal-note"> ngay mặt sau thẻ (dùng document.createElement).

Tự động tải ghi chú cá nhân của từ hiện tại qua apiClient.get('/notes/vocabulary/' + vocabId) (nếu người dùng đã đăng nhập).

Có ô <textarea class="form-control" rows="2" placeholder="Thêm mẹo nhớ hoặc ghi chú cá nhân cho từ này..."> và nút Lưu ghi chú gọi apiClient.put('/notes/vocabulary/' + vocabId, { content }) (hoặc delete nếu xóa trắng), kèm thông báo trạng thái "Đã lưu" nhỏ gọn ngay cạnh mà không làm đóng hay reset thẻ Flashcard đang lật.

Bên dưới thẻ là 4 nút đánh giá SRS chuẩn SM-2 (1: Học lại, 2: Khó, 3: Nhớ được, 4: Rất dễ) gọi API /api/v1/srs/reviews để lặp lại ngắt quãng mỗi ngày.

Nhiệm vụ 5.2: Phòng Luyện Viết & Chấm Điểm 3 Sao Tự Động
Khi người dùng bấm nút ✍️ Luyện viết từ một Chủ đề bất kỳ:

Mở giao diện Phòng Luyện Viết cho toàn bộ các chữ Hán trong chủ đề đó.

Cho phép chọn nhanh chế độ trên thanh đầu phòng:

Luyện nét (practice): Có khung nét mờ dẫn hướng (showOutline: true) để người mới tập tô theo đúng thứ tự nét.

Luyện viết (quiz): Ẩn khung nét mờ (showOutline: false), chỉ hiển thị Pinyin + Âm Hán-Việt + Nghĩa tiếng Việt + Nút nghe phát âm để người học tự nhớ và viết chữ Hán vào ô vuông 미字格 (Mễ tự cách).

Thuật toán Chấm Điểm Tự Động (Auto-Grading 3 Sao & Độ Chính Xác):

Lắng nghe trực tiếp callback onMistake và onComplete từ CharacterWritingEngine (frontend/js/ui/character-writing/character-writing-engine.js):

Khi hoàn thành 1 chữ/từ (totalMistakes là tổng số lần viết sai nét của chữ đó):

⭐⭐⭐ (3 Sao — Xuất sắc / Độ chính xác 100%): totalMistakes === 0 và không bấm nút Xem gợi ý.

⭐⭐ (2 Sao — Khá / Độ chính xác 75%): totalMistakes từ 1 đến 2.

⭐ (1 Sao — Cần ôn lại / Độ chính xác 40%): totalMistakes >= 3 hoặc đã bấm nút Xem nét mẫu.

Hiển thị ngay số Sao (⭐⭐⭐) và lời khen/nhắc nhở ngắn gọn ngay khi viết xong chữ đó, đồng thời tự động phát âm chữ Hán.

Hàng Đợi Củng Cố Tự Động (Mastery Retry Queue):

Bất kỳ chữ nào người học chỉ đạt 1 Sao (⭐) trong lượt viết đầu tiên sẽ tự động được đẩy vào cuối danh sách phiên học với nhãn Ôn lại chữ viết sai để người học viết lại đến khi đạt từ 2–3 Sao mới kết thúc bài.

Màn hình Tổng Kết Phiên Luyện Viết (Writing Session Summary):

Khi hoàn thành tất cả các chữ trong chủ đề, hiển thị bảng kết quả trực quan:

Tổng số Sao đạt được (ví dụ: 56 / 60 ⭐)

Độ chính xác nét viết trung bình (%)

Danh sách từng chữ Hán vừa viết kèm số Sao đạt được (⭐⭐⭐, ⭐⭐, ⭐).

Nếu người dùng đã đăng nhập, tự động đồng bộ kết quả đánh giá sang tiến độ SRS (3 Sao -> Rating 4, 2 Sao -> Rating 3, 1 Sao -> Rating 2) hoặc cho phép bấm Luyện viết lại chủ đề này / Chuyển sang học Flashcard.

Nhiệm vụ 5.3: Kiểm thử & Lưu Git Checkpoint 5
Cập nhật/bổ sung unit test trong tests/frontend/unit/srs/ và tests/frontend/unit/notes/.

Chạy: node tests/frontend/runner.mjs --tier static và node tests/frontend/runner.mjs --tier unit.

Lưu Git Checkpoint:

Bash
git add -A
git commit -m "feat(srs-writing): add backside flashcard notes and 3-star automated writing grader"
🔹 PHASE 6: Thiết Kế Lại Trang Hồ Sơ & Cài Đặt (profile.html & profile-page.js)
Gọi Subagent: Phase6-Profile-Avatar-And-Settings-Agent

Nhiệm vụ 6.1: Cập nhật CSP & URL Sanitizer cho Ảnh Đại Diện (security.js & *.html)
Mở frontend/js/ui/security.js:

Kiểm tra hàm xác thực URL ảnh đại diện (nếu có). Cho phép thêm scheme data:image/png;base64,..., data:image/jpeg;base64,..., data:image/webp;base64,... và data:image/svg+xml;utf8,... (hoặc base64) bên cạnh http: / https:. Tuyệt đối vẫn chặn javascript:, vbscript:, data:text/html.

Kiểm tra thẻ <meta http-equiv="Content-Security-Policy" ...> trên tất cả 22 file frontend/*.html:

Đảm bảo directive img-src có 'self' data: https: http:.

Kiểm tra ngay với node tests/frontend/runner.mjs --tier static để chắc chắn csp-resource-graph.test.mjs PASS 100%.

Nhiệm vụ 6.2: Làm mới Tab "Thông tin cá nhân" — Chọn Avatar Đề Xuất & Tải Ảnh Từ Máy Tính (profile.html & profile-page.js)
XÓA BỎ HOÀN TOÀN ô input nhập link https://example.com/avatar.jpg và dòng chữ "Hỗ trợ URL hình ảnh http:// hoặc https:// hợp lệ (tối đa 500 ký tự)".

Thiết kế giao diện chọn Ảnh đại diện gồm 2 cách trực quan:

Cách 1 — Chọn từ 8 Ảnh đại diện đề xuất (Preset Avatars):

Tạo sẵn 8 mẫu Avatar SVG Data URI mang phong cách văn hóa Hán ngữ sang trọng (ví dụ: chữ 学 Học trên nền Đỏ Chu Sa #C83C23, chữ 智 Trí trên nền Xanh Ngọc Bích #0F766E, chữ 龙 Long trên nền Vàng Hoàng Gia #B45309, chữ 文 Văn trên nền Chàm #1D4ED8, chữ 福 Phúc, 心 Tâm, 道 Đạo, 竹 Trúc).

Hiển thị thành hàng 8 hình tròn để người dùng bấm vào bất kỳ hình nào là cập nhật xem trước ngay lập tức.

Cách 2 — Nút "📁 Chọn ảnh từ máy tính":

Sử dụng <input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp" hidden> kết hợp nút bấm <button type="button" class="btn btn-secondary">📁 Tải ảnh từ máy tính</button>.

Khi người dùng chọn file ảnh từ máy tính:

Dùng FileReader và Image nạp vào một thẻ <canvas width="160" height="160"> ẩn.

Tự động cắt vuông chính giữa (center-crop) bức ảnh về kích thước 160x160 px và xuất ra chuỗi nén nhẹ canvas.toDataURL('image/webp', 0.85) (hoặc image/jpeg nếu trình duyệt không hỗ trợ webp).

Hiển thị ngay lên khung Avatar xem trước và khi bấm Lưu thay đổi sẽ gửi chuỗi avatarUrl này qua apiClient.put('/profile', { fullName, avatarUrl }) để lưu vào DB và cập nhật ngay lên góc phải Navbar.

Nhiệm vụ 6.3: Làm mới Tab "Cài đặt" (profile.html & profile-page.js)
XÓA BỎ các đoạn văn giải thích lý thuyết dài dòng về thuật toán SuperMemo-2 và câu chữ kỹ thuật (số nguyên dương > 0).

Tổ chức thành 3 nhóm cài đặt tinh gọn, hiện đại, lưu vào localStorage (key: 'elearning_study_prefs') đồng thời đồng bộ newCardsPerDay với API /api/v1/srs/settings:

Nhóm 1: Mục tiêu học tập mỗi ngày

3 nút chọn nhanh: 🌱 10 từ / ngày (Nhẹ nhàng) | 🎯 20 từ / ngày (Tiêu chuẩn) | 🔥 30 từ / ngày (Tăng tốc) + ô chỉnh số lượng.

Nhóm 2: Âm thanh & Phát âm

Công tắc bật/tắt: Tự động phát âm tiếng Trung khi lật thẻ Flashcard hoặc viết xong chữ Hán (autoPlayAudio, mặc định true).

Chọn tốc độ giọng đọc: 1.0x (Tiêu chuẩn) | 0.75x (Chậm rõ âm cho người mới) (speechRate, kết nối trực tiếp vào frontend/js/ui/speech.js).

Nhóm 3: Hiển thị & Luyện viết

Công tắc bật/tắt: Hiển thị Âm Hán-Việt trên thẻ từ vựng và Flashcard (showSinoVietnamese, mặc định true).

Chế độ Luyện viết mặc định khi mở bài: Luyện nét (Có khung mờ dẫn hướng) | Luyện viết (Tự nhớ mặt chữ) (defaultWritingMode).

Tự động nháy nét gợi ý sau khi viết sai: 1 lần | 2 lần | 3 lần (showHintAfterMisses, truyền trực tiếp vào CharacterWritingEngine).

Nhiệm vụ 6.4: Kiểm thử & Lưu Git Checkpoint 6
Cập nhật tests/frontend/unit/auth/profile-settings.test.mjs và tests/frontend/unit/security/security.test.mjs.

Chạy: node tests/frontend/runner.mjs --tier static và node tests/frontend/runner.mjs --tier unit.

Lưu Git Checkpoint:

Bash
git add -A
git commit -m "feat(profile): add preset/local file avatar uploader and comprehensive study settings"
🔹 PHASE 7: Kiểm Thử Toàn Diện (Full Verification), Dọn Dẹp & Hoàn Tất Git
Gọi Subagent: Phase7-Full-QA-And-Git-Finalizer-Agent

Chạy toàn bộ các tầng kiểm thử Frontend:

node tests/frontend/runner.mjs --tier static (Đảm bảo CSP, SRI, DOM sinks, CSS tokens, HTML semantics đều PASS 100%).

node tests/frontend/runner.mjs --tier unit (Đảm bảo toàn bộ Unit tests PASS 100%).

Chạy kiểm thử Backend Maven:

Chạy mvn -f backend/pom.xml test (hoặc chạy bộ test kiểm tra Flyway V20, Vocabulary Radicals, Profile, SRS, Lesson).

Kiểm tra trực quan trên trình duyệt (Playwright / E2E nếu môi trường có sẵn):

Kiểm tra không có bất kỳ lỗi Console Error nào, không có tràn khung ngang (scrollWidth <= clientWidth) ở cả Desktop (1440x900) và Mobile (390x844).

Kiểm tra và Lưu Git lần cuối:

Chạy git status để chắc chắn không còn file thừa hay thay đổi nào chưa được commit.

Chạy git log -n 7 --oneline để xuất danh sách các commit mốc đã lưu cho người dùng kiểm tra.

Xuất báo cáo tổng kết toàn bộ các tính năng đã hoàn thành.