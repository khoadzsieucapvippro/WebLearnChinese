# Kiến Trúc Hệ Thống (System Architecture)

Tài liệu này là đặc tả kiến trúc chính thức của nền tảng **WebLearnChinese** (E-Learning Chinese Radicals & Vocabulary with SRS).

---

## 1. Tổng Quan Kiến Trúc (High-Level Topology)

WebLearnChinese được thiết kế theo mô hình phân tầng phân tán, hoàn toàn tương thích với kiến trúc Cloud Free-Tier 24/7 và môi trường container hoá:

```
+------------------------------------------------------------------------+
|                      CLIENT-SIDE FRONTEND                              |
|   GitHub Pages / Local Web Server (Zero-Build Static Assets)           |
|   - Semantic HTML5 (25 trang chuyên biệt)                              |
|   - Vanilla JavaScript (ES2022 Native Modules, API Client tập trung)   |
|   - CSS Custom Properties (Scholarly Cinnabar Tokens)                 |
|   - Bảo mật: Strict CSP, SRI Hashes, Safe DOM Mutation APIs            |
+------------------------------------------------------------------------+
                                  |
                HTTPS / REST API (JSON Envelope) + CORS
                                  v
+------------------------------------------------------------------------+
|                      BACKEND REST API SERVICE                          |
|   Render Free Web Service / Docker Container                           |
|   - Java 21, Spring Boot 3.3.5                                         |
|   - Spring Security: Stateless JWT RBAC (4 Vai trò)                    |
|   - Spring Data JPA + Hibernate (ddl-auto: none)                       |
|   - Flyway Migration Engine (V1..V30 Baseline)                         |
|   - Actuator Health Probe: /actuator/health                            |
+------------------------------------------------------------------------+
           /                                              \
  JDBC / TLS (Port 4000)                   HTTPS + X-Internal-Token
  Collation: utf8mb4_unicode_ci            Acoustic Tone Sandhi Evaluation
         v                                                v
+-----------------------------+           +------------------------------+
|     DATABASE PERSISTENCE    |           |    ACOUSTIC SPEECH SERVICE   |
|  TiDB Cloud Serverless      |           |  Render Free Web Service     |
|  (hoặc Local MySQL 8.0/8.4) |           |  - Python 3.11, FastAPI      |
|  - 214 Bộ thủ Khang Hy      |           |  - Chao 5-scale DSP Engine   |
|  - 1,068 Từ vựng HSK 1-3    |           |  - Praat / PyWorld / Librosa |
|  - 50 Bài học chuẩn hoá     |           |  - 100% Offline Algorithm    |
|  - Bảng Audit Log, SRS...   |           |  - Endpoint: /evaluate-reading
+-----------------------------+           +------------------------------+
```

---

## 2. Các Thành Phần Hệ Thống (Core Components)

### 2.1. Frontend (Zero-Build Vanilla Web)
- **Công nghệ**: HTML5 semantic, CSS3 (Modern Flexbox/Grid, CSS custom properties, hệ thống màu Scholarly Cinnabar), JavaScript ES Modules nguyên bản (không dùng bundler/Webpack/Vite, không có runtime npm production).
- **Kiểm soát truy cập API**: `frontend/js/api/api.js` là boundary HTTP duy nhất; không gọi trực tiếp `fetch()` tại các trang.
- **Quản lý phiên làm việc**: `frontend/js/auth/auth-state.js` lưu trữ JWT và phiên làm việc tại `localStorage` (được coi là bộ nhớ tiện ích không tin cậy; mọi quyền hạn do Backend quyết định).
- **Hệ thống Smart Fallback**: Khi deploy trên GitHub Pages không có Backend kết nối, `demo-fallback-engine.js` tự động cung cấp dữ liệu mô phỏng 4 tài khoản, 214 bộ thủ, 1,068 từ vựng và 50 bài học để người dùng trải nghiệm trực quan mà không gặp lỗi kỹ thuật.

### 2.2. Backend (Spring Boot 3.3.5 REST API)
- **Mô hình bảo mật**: Spring Security với cơ chế kiểm tra Stateless JWT Filter. Mỗi request được xác thực qua Header `Authorization: Bearer <token>`.
- **4 Vai trò người dùng (RBAC)**:
  - `Learner`: Tra cứu bộ thủ, từ vựng, học bài, luyện viết Hanzi, ôn luyện SRS 4 kỹ năng, ghi chú cá nhân.
  - `Creator`: Soạn thảo bài học, nhập từ vựng từ Excel 2 bước (`sample-curriculum-valid.xlsx`), sắp xếp thứ tự từ vựng, gửi kiểm duyệt.
  - `Moderator`: Quản lý hàng đợi kiểm duyệt, xem chi tiết bài học, phê duyệt/từ chối kèm lý do (nghiêm cấm Creator tự kiểm duyệt bài của chính mình).
  - `Admin`: Quản trị tài khoản người dùng, phân quyền 4 vai trò (bảo vệ Admin cuối cùng không thể bị hạ quyền hay khoá), quản lý bộ thủ/từ vựng toàn hệ thống, xem nhật ký kiểm toán `management_audit_log`.
- **Kiểm toán quản trị (Audit Logging)**:
  - Bảng cơ sở dữ liệu: `management_audit_log` (Flyway V29).
  - Tự động khử trừ thông tin nhạy cảm (passwords, tokens, secrets) trước khi ghi vào cơ sở dữ liệu với 6 lớp lồng tử.
- **Khai thác dữ liệu & Seeder**:
  - `DemoAccountSeeder.java`: Tự động nạp 4 tài khoản kiểm thử chuẩn khi có cờ `app.demo.seed-accounts=true` trên môi trường Cloud. Trên Production profile, cờ này bị cấm tuyệt đối.

### 2.3. Speech Service (Microservice Phân Tích Phát Âm & Thanh Điệu)
- **Công nghệ**: Python 3.11, FastAPI, Uvicorn.
- **Thuật toán xử lý âm thanh**: Sử dụng thuật toán Chao 5-scale DSP acoustic pitch tracking (F0) và tone sandhi dựa trên Librosa/PyWorld.
- **Hoàn toàn mã nguồn mở & Offline**: Không sử dụng Cloud AI SDK, không phụ thuộc API bên ngoài, không tốn chi phí hay giới hạn quota.
- **Bảo mật nội bộ**: Giao tiếp Backend - Speech Service qua Header xác thực `X-Internal-Token`.

### 2.4. Cơ Sở Dữ Liệu (MySQL 8.0+ / TiDB Cloud Serverless)
- **Flyway Migrations**: Tất cả thay đổi cấu trúc schema được quản lý nghiêm ngặt qua các tệp tin `V1` đến `V30` tại `backend/src/main/resources/db/migration/`.
- **Bảng mã UTF-8**: Toàn bộ schema sử dụng collation `utf8mb4_unicode_ci`. Hikari Pool trên Spring Boot luôn thực thi `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` để tránh lỗi `Illegal mix of collations (error 1267)` trên MySQL và TiDB.
- **Tương thích TiDB Cloud Serverless**: Bảng `vocab_radical` được tái thiết kế với Khóa chính phi phân cụm (`NONCLUSTERED` Primary Key) trong migration V24 để tương thích 100% với cơ chế phân tán của TiDB.

---

## 3. Kho Dữ Liệu & Giá Trị Cơ Sở (Data Baseline)

- **214 Bộ thủ Khang Hy**:
  - Contiguous IDs từ 1 đến 214.
  - Đầy đủ biến thể chữ Hán giản thể, số nét, phiên âm pinyin, nghĩa Hán-Việt chuẩn hoá và giải thích sư phạm chi tiết (V21).
  - Video minh hoạ luyện viết chuẩn (V11).
- **1,068 Từ vựng HSK**:
  - 300 từ vựng HSK 1.
  - 200 từ vựng HSK 2.
  - 500 từ vựng HSK 3.
  - 68 từ vựng bổ trợ.
  - Phân rã bộ thủ cấu thành và thành phần kết cấu chuẩn xác (`vocab_radical`).
- **50 Bài học chính thức (Curriculum Lessons)**:
  - V30 chuẩn hoá toàn bộ 50 bài học: HSK 1 gồm 15 bài (300 từ), HSK 2 gồm 10 bài (200 từ), HSK 3 gồm 25 bài (500 từ).
  - 100% từ vựng được gắn vào bài học có thứ tự sắp xếp khoa học.
- **Spaced Repetition System (SRS SM-2 Engine)**:
  - Thuật toán SM-2 tính toán khoảng cách ôn tập (`interval_days`), hệ số dễ dàng (`ease_factor`), và số lần lặp lại liên tiếp (`repetition_number`).
  - 4 phòng ôn tập độc lập:
    1. **Flashcard**: Nhận diện mặt chữ, phiên âm, nghĩa và âm thanh.
    2. **Luyện viết (Writing)**: Tương tác từng nét chữ Hán với HanziWriter SDK.
    3. **Luyện nghe (Listening)**: Nghe phát âm và chọn / gõ đáp án chữ Hán.
    4. **Luyện đọc (Reading)**: Thu âm qua trình duyệt và gửi về âm thanh microservice phân tích cao độ F0 và thanh điệu Chao 5-scale.

---

## 4. Giao Thức Giao Tiếp & Chuẩn REST API (API Contracts)

- **Response Envelope**: Mọi phản hồi từ Backend đều được đóng gói theo định dạng chuẩn:
  ```json
  {
    "code": "SUCCESS",
    "message": "Thao tác thành công",
    "data": { ... }
  }
  ```
  Trường hợp lỗi:
  ```json
  {
    "code": "BAD_REQUEST",
    "message": "Dữ liệu không hợp lệ",
    "data": null
  }
  ```
- **Error Codes tiêu biểu**: `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `DUPLICATE_RESOURCE`, `VALIDATION_FAILED`, `RATE_LIMITED`.
- **Identity Invariant**: Danh tính người dùng luôn được trích xuất trực tiếp từ JWT Claims trong `SecurityContextHolder`, không bao giờ chấp nhận `account_id` do client tự truyền lên body hay query để chống tấn công IDOR.

---

## 5. Danh Mục Cơ Sở Dữ Liệu (Database Schema Entity Relationships)

```
[account] 1 --- * [account_roles] * --- 1 [role]
   |
   +--- 1 --- 1 [user_profile]
   +--- 1 --- 1 [user_srs_setting]
   +--- 1 --- * [card_progress] * --- 1 [vocabulary]
   +--- 1 --- * [card_progress] * --- 1 [kangxi_radical]
   +--- 1 --- * [study_session]
   +--- 1 --- * [review_log]
   +--- 1 --- * [personal_note]
   +--- 1 --- * [lesson] (created_by)
   +--- 1 --- * [management_audit_log] (performed_by)

[lesson] 1 --- * [lesson_vocabulary] * --- 1 [vocabulary]

[vocabulary] * --- * [vocab_radical] * --- * [kangxi_radical]
```
