# Hướng Dẫn Triển Khai 100% Free-Tier (Zero-Cost Deployment Guide)
## Hệ Thống Học Hán Ngữ & Bộ Thủ (WebLearnChinese)

Tài liệu này hướng dẫn chi tiết từng bước đưa toàn bộ hệ thống WebLearnChinese lên môi trường Internet công khai, sử dụng **100% dịch vụ miễn phí (Free Tier)**, **không yêu cầu thẻ tín dụng quốc tế (No Credit Card Required)** và **không có rủi ro tự động trừ phí (Zero Auto-Billing)**.

---

### 1. Kiến Trúc Hệ Thống & Giới Hạn Free-Tier

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GITHUB PAGES                                  │
│   https://khoadzsieucapvippro.github.io/WebLearnChinese/               │
│   - Vanilla JS, Zero-Build, Static Hosting                             │
│   - Tự động nhận diện API URL qua BACKEND_API_URL hoặc ?apiUrl=...     │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS (CORS Allowed Origin)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   RENDER FREE WEB SERVICE                              │
│   https://elearning-backend-xxxx.onrender.com                          │
│   - Spring Boot 3.3.5 / Eclipse Temurin 21 JRE                         │
│   - Giới hạn RAM: 512MB (-XX:MaxRAMPercentage=75.0)                    │
│   - Endpoint kiểm tra sức khỏe: /actuator/health                       │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │ TLS (Port 4000)                        │ HTTPS + Header Token
                │ Non-Clustered PK                       │ X-Internal-Token
                ▼                                        ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│       TIDB CLUSTER SERVERLESS    │ │     RENDER FREE WEB SERVICE      │
│       (100% Free Forever)        │ │  https://speech-service-xxxx...  │
│   - MySQL 8.0/8.4 Protocol       │ │  - Python 3.11 FastAPI           │
│   - 5GB Dung lượng miễn phí      │ │  - Thuật toán Chao 5-scale DSP   │
│   - Flyway Migrations (V1-V29)   │ │  - Endpoint: /evaluate-reading   │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

| Thành phần | Nền tảng | Gói dịch vụ | Giới hạn & Đặc tính | Yêu cầu thẻ |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | GitHub Pages | Free Public Repo | Băng thông 100GB/tháng, 1GB lưu trữ tĩnh | **Không** |
| **Backend API** | Render | Free Web Service | 512MB RAM, 750 giờ/tháng, tự ngủ sau 15p nhàn rỗi | **Không** |
| **Speech Service** | Render | Free Web Service | 512MB RAM, RAM thực tế ~177MB, tự ngủ sau 15p | **Không** |
| **Cơ sở dữ liệu** | TiDB Cloud | Serverless Starter | 5GB lưu trữ miễn phí vĩnh viễn, 50 triệu RU/tháng | **Không** |

---

### 2. Bước 1: Khởi Tạo Cơ Sở Dữ Liệu TiDB Cloud Serverless

TiDB Cloud Serverless cung cấp cơ sở dữ liệu tương thích hoàn toàn MySQL 8.0/8.4, bảo mật TLS bắt buộc và không yêu cầu thẻ tín dụng.

1. **Đăng ký tài khoản:**
   - Truy cập: [https://tidbcloud.com](https://tidbcloud.com).
   - Đăng ký bằng tài khoản **GitHub** hoặc **Google** (không cần nhập thông tin thanh toán).

2. **Tạo cụm CSDL Serverless:**
   - Chọn loại cụm: **Serverless**.
   - Đặt tên cụm: `elearning-cluster`.
   - Chọn khu vực (Cloud Provider & Region): Khuyến nghị chọn **AWS Singapore (`ap-southeast-1`)** hoặc khu vực gần nhất để tối ưu độ trễ mạng từ Việt Nam.
   - Nhấn **Create**. Quá trình khởi tạo hoàn tất sau khoảng 10–20 giây.

3. **Lấy thông tin kết nối & Tạo Database:**
   - Trong giao diện bảng điều khiển cụm, nhấn nút **Connect**.
   - Chọn loại kết nối: **General** hoặc **Java (JDBC)**.
   - Đặt/Lưu mật khẩu cho tài khoản `root` (ví dụ: `xxxxxx.root`).
   - Ghi lại thông tin:
     - **Host**: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` (hoặc tương tự theo vùng).
     - **Port**: `4000`.
     - **User**: `xxxxxx.root`.
     - **Password**: `<mật khẩu đã tạo>`.
   - Sử dụng tab **SQL Editor** trên web console của TiDB Cloud để tạo cơ sở dữ liệu:
     ```sql
     CREATE DATABASE IF NOT EXISTS elearning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

4. **Xây dựng chuỗi JDBC URL chuẩn xác:**
   > ⚠️ **LƯU Ý KỸ THUẬT QUAN TRỌNG:**
   > TiDB không hỗ trợ `ALTER TABLE ... DROP PRIMARY KEY` khi khóa chính hiện tại là **clustered index**, và cũng không hỗ trợ chuyển đổi clustered ↔ non-clustered. Vì vậy migration `V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql` **không còn** chạy `DROP PRIMARY KEY`; migration này tạo bảng mới với khóa chính `(vocab_id, radical_id, hanzi_char) NONCLUSTERED`, copy dữ liệu, rồi hoán đổi bảng bằng `RENAME TABLE` nguyên tử. Cách này hoạt động với cả CSDL mới và CSDL đã bị lỗi một phần.
   >
   > Tham số `sessionVariables=tidb_enable_clustered_index=OFF` chỉ có tác dụng với các bảng được tạo **sau đó**; nó không sửa được bảng đã tồn tại. Không cần dùng tham số này nữa.
   >
   > Tuy nhiên, schema dùng `utf8mb4_unicode_ci` trong khi MySQL 8 / TiDB mặc định session là `utf8mb4_0900_ai_ci`. Thiếu cấu hình collation, các migration so sánh chuỗi sẽ lỗi `ERROR 1267 (HY000): Illegal mix of collations`. Backend đã tự áp dụng `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` qua Hikari `connection-init-sql`, nhưng nên thêm `connectionCollation=utf8mb4_unicode_ci` vào URL để cả công cụ ngoài (Flyway CLI, SQL client) cũng nhất quán.

   Chuỗi kết nối JDBC hoàn chỉnh:
   ```
   jdbc:mysql://<gateway-host>:4000/elearning_db?sslMode=VERIFY_IDENTITY&useSSL=true&requireSSL=true&verifyServerCertificate=true&connectionCollation=utf8mb4_unicode_ci&characterEncoding=UTF-8&serverTimezone=UTC
   ```

---

### 3. Bước 2: Triển Khai Render Blueprint (`render.yaml`)

Dự án đã tích hợp file cấu hình Infrastructure-as-Code `render.yaml` tự động cấu hình cả 2 dịch vụ độc lập trên Render.

1. **Đăng nhập Render:**
   - Truy cập: [https://render.com](https://render.com).
   - Đăng nhập bằng tài khoản **GitHub**.

2. **Tạo Blueprint Instance:**
   - Nhấn **New +** ở góc trên bên phải -> Chọn **Blueprint**.
   - Chọn kho mã nguồn (Repository) của bạn: `WebLearnChinese` (hoặc tên repo tương ứng).
   - Render sẽ tự động quét và nhận diện file `render.yaml` với 2 dịch vụ:
     - `elearning-backend` (Web Service, Docker)
     - `speech-service` (Web Service, Docker)

3. **Tạo mã bảo mật nội bộ (Shared Secret Token):**
   - Chạy lệnh sau trên terminal của bạn để tạo một chuỗi ngẫu nhiên an toàn:
     ```bash
     openssl rand -hex 32
     ```
   - Giá trị này sẽ được dùng chung cho biến `INTERNAL_SPEECH_TOKEN` ở cả 2 dịch vụ để xác thực qua header `X-Internal-Token`.

4. **Tạo JWT Secret cho Backend:**
   - Chạy lệnh tạo chuỗi JWT Secret 256-bit chuẩn:
     ```bash
     openssl rand -base64 32
     ```

5. **Điền các biến môi trường trên Render:**
   - **Dịch vụ `speech-service`:**
     - `INTERNAL_SPEECH_TOKEN`: `<chuỗi 32 hex đã tạo ở trên>`
   - **Dịch vụ `elearning-backend`:**
     - `SPRING_DATASOURCE_URL`: `<Chuỗi JDBC URL TiDB Cloud đã tạo ở Bước 1>`
     - `SPRING_DATASOURCE_USERNAME`: `<TiDB User, ví dụ xxxxxx.root>`
     - `SPRING_DATASOURCE_PASSWORD`: `<TiDB Password>`
     - `JWT_SECRET`: `<Chuỗi JWT Secret đã tạo ở trên>`
     - `INTERNAL_SPEECH_TOKEN`: `<chuỗi 32 hex đã tạo ở trên>`
     - `SPEECH_SERVICE_URL`: `https://speech-service-xxxx.onrender.com` *(Lấy URL do Render cấp cho dịch vụ speech-service sau khi tạo)*
     - `APP_CORS_ALLOWED_ORIGINS`: `https://khoadzsieucapvippro.github.io,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000`
     - `APP_DEMO_SEED_ACCOUNTS`: `false`

6. **Tiến hành Deploy:**
   - Nhấn **Apply**.
   - Render sẽ tiến hành build Docker image và khởi chạy cả hai dịch vụ.
   - Khi dịch vụ backend khởi động lần đầu, Flyway sẽ tự động chạy toàn bộ các migration từ V1 đến V29 lên CSDL TiDB Cloud.

---

### 4. Bước 3: Cấu Hình GitHub Pages & Tích Hợp Frontend

1. **Bật GitHub Pages bằng GitHub Actions:**
   - Truy cập kho lưu trữ GitHub của bạn.
   - Vào **Settings** -> **Pages**.
   - Tại mục **Build and deployment** -> **Source**, chọn: **GitHub Actions**.

2. **Cấu hình biến môi trường `BACKEND_API_URL`:**
   - Vào **Settings** -> **Secrets and variables** -> **Actions**.
   - Chuyển sang tab **Variables** (lưu ý: chọn tab Variables, không phải Secrets).
   - Nhấn **New repository variable**.
   - Điền:
     - **Name**: `BACKEND_API_URL`
     - **Value**: `https://elearning-backend-xxxx.onrender.com/api/v1` *(Thay thế bằng domain Render thật của bạn, nhớ có hậu tố `/api/v1`)*
   - Nhấn **Add variable**.

3. **Kích hoạt quy trình triển khai:**
   - Vào tab **Actions** -> Chọn workflow **Deploy GitHub Pages** -> Nhấn **Run workflow**.
   - Workflow `.github/workflows/deploy-pages.yml` sẽ thực hiện:
     - Copy toàn bộ mã nguồn `frontend/` vào thư mục phát hành.
     - Tự động thay thế giá trị `__CLOUD_BACKEND_API_URL__` trong `js/config.js` bằng giá trị biến `BACKEND_API_URL`.
     - Xuất bản lên GitHub Pages tại địa chỉ: `https://khoadzsieucapvippro.github.io/WebLearnChinese/`.

4. **Phương án dự phòng cấu hình động (Dynamic Fallback via URL):**
   - Nếu chưa cấu hình GitHub Actions variable, người dùng hoặc người kiểm thử có thể truy cập bằng đường dẫn có tham số:
     `https://khoadzsieucapvippro.github.io/WebLearnChinese/?apiUrl=https://elearning-backend-xxxx.onrender.com/api/v1`
   - File `frontend/js/config.js` sẽ tự động lưu giá trị này vào `localStorage` của trình duyệt (`ELEARNING_CLOUD_API_URL`) và sử dụng cho toàn bộ các phiên làm việc tiếp theo.

---

### 5. Bước 4: Danh Mục Kiểm Tra Xác Minh (Verification Checklist)

Sau khi hoàn tất triển khai, thực hiện kiểm tra theo danh sách sau để đảm bảo hệ thống vận hành chuẩn xác:

#### 1. Kiểm tra sức khỏe Backend (Spring Boot Actuator)
```bash
curl -i https://elearning-backend-xxxx.onrender.com/actuator/health
```
- **Kết quả mong đợi:** HTTP 200 OK với body:
  ```json
  {"status":"UP"}
  ```

#### 2. Kiểm tra sức khỏe Speech Service (FastAPI)
```bash
curl -i https://speech-service-xxxx.onrender.com/health
```
- **Kết quả mong đợi:** HTTP 200 OK với body:
  ```json
  {"status":"READY","engine":"chao_dsp","version":"1.0.0"}
  ```

#### 3. Kiểm tra CORS Preflight từ GitHub Pages
```bash
curl -i -X OPTIONS https://elearning-backend-xxxx.onrender.com/api/v1/auth/login \
  -H "Origin: https://khoadzsieucapvippro.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```
- **Kết quả mong đợi:** HTTP 200 OK và chứa header:
  ```http
  Access-Control-Allow-Origin: https://khoadzsieucapvippro.github.io
  Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
  ```

#### 4. Kiểm tra nhật ký Flyway Migrations
- Mở mục **Logs** của dịch vụ `elearning-backend` trên Render.
- Xác nhận các dòng log thông báo hoàn tất migrations:
  ```text
  Database: jdbc:mysql://... (MySQL 8.0/8.4)
  Current version of schema `elearning_db`: 29
  Schema `elearning_db` is up to date. No migration necessary.
  ```

#### 5. Kiểm tra tính năng Đánh giá Phát âm (Chao 5-scale Reading Assessment)
- Truy cập `https://khoadzsieucapvippro.github.io/WebLearnChinese/srs-review.html`.
- Mở thẻ học flashcard có tính năng đọc từ/câu.
- Bấm nút ghi âm và phát âm từ vựng.
- Trình duyệt sẽ gửi audio lên `POST /api/v1/srs/reading/assess`. Backend chuyển tiếp an toàn tới FastAPI speech service kèm token nội bộ `X-Internal-Token`.
- Kiểm tra kết quả trả về hiển thị đầy đủ điểm tổng quan, biểu đồ thanh điệu ngũ độ và nhận xét tiếng Việt.

---

### 6. Xử Lý Hiện Tượng Cold-Start (Ngủ Đông của Render Free-Tier)

1. **Cơ chế hoạt động:**
   - Dịch vụ miễn phí của Render sẽ tạm dừng (ngủ đông) sau 15 phút không nhận được lưu lượng truy cập nào.
   - Khi có người dùng gửi request đầu tiên, Render sẽ khởi động lại container (thời gian spin-up khoảng 30–50 giây).

2. **Cơ chế chịu lỗi tích hợp sẵn của hệ thống:**
   - **Đồng bộ Timeout & Giới hạn Chờ (<50s):**
     - Backend Spring Boot được cấu hình `connect-timeout-ms: 15000` (15s) và `read-timeout-ms: 30000` (30s) trong `LocalSpeechConfig.java` và `application.yml`.
     - Trong `LocalSpeechServiceClient.java`, tổng thời gian chờ và thử lại tối đa được giới hạn chặt chẽ dưới 50 giây (ngưỡng an toàn 48s), hoàn toàn không vượt quá giới hạn 60 giây (`UPLOAD_TIMEOUT_MS = 60000`) của `apiClient` trên frontend.
   - **Thông báo Thân thiện & Khích lệ (`coldStartWakingUp`):**
     - Khi phát hiện container speech-service đang thức giấc từ trạng thái ngủ đông, backend trả về DTO `coldStartWakingUp` chuẩn hóa:
       - `status: "engine_unavailable"`
       - `summaryVi: "Hệ thống Phân tích Phát âm & Thanh điệu đang khởi động từ trạng thái nghỉ (Render Free Tier spin-up ~30-50s)."`
       - `retryAdvice: "Máy chủ phân tích âm thanh cần khoảng 30-50 giây để khởi động lại sau thời gian nghỉ. Vui lòng bấm 'Thử đọc lại' sau giây lát hoặc bấm 'Bỏ qua →' để tiếp tục ôn tập."`
   - **Điều khiển Trơn tru, Không Treo Ứng dụng:**
     - Phía frontend (`srs-review-page.js`), các mã trạng thái được phân tích không phân biệt hoa thường (`cold_start`, `coldstartwakingup`, `engine_unavailable`).
     - Hai nút điều khiển **"Thử đọc lại"** (`#btnReadingTryAgain`) và **"Bỏ qua →"** (`#btnReadingSkipOnError`) luôn được kích hoạt tự do, cho phép người học bấm micro thử lại ngay khi container ấm lên hoặc chuyển ngay sang thẻ tiếp theo mà không bị treo giao diện.

---

### 7. Thiết Lập UptimeRobot Giữ Ấm 24/7 (Prevent Render Sleep & Guarantee 0s Latency)

Để triệt tiêu hoàn toàn độ trễ khởi động 30–50 giây của gói Render Free Tier và giữ cả 2 container backend và speech service luôn ở trạng thái thường trực (100% Warm State, 0 giây chờ đợi cho người học), cấu hình dịch vụ giám sát miễn phí **UptimeRobot** gửi HTTP probe mỗi 5 phút:

#### 1. Nguyên lý Hoạt Động
- Bộ đếm nhàn rỗi của Render kích hoạt ngủ đông sau **15 phút** không có lưu lượng truy cập.
- Gói Free của UptimeRobot (https://uptimerobot.com) cung cấp **50 monitors miễn phí** với tần suất kiểm tra **5 phút / lần**.
- Bằng cách gửi định kỳ yêu cầu HTTP GET mỗi 5 phút tới các endpoint probe nhẹ (`/actuator/health` và `/health`), bộ đếm 15 phút của Render liên tục được đặt lại về 0, duy trì cả hai container luôn chạy trên bộ nhớ RAM 24/7.

#### 2. Các Bước Thiết Lập Chi Tiết

##### Bước 1: Đăng ký tài khoản UptimeRobot
1. Truy cập [https://uptimerobot.com](https://uptimerobot.com) và bấm **Register for FREE** (hoặc Log in nếu đã có tài khoản).
2. Xác nhận email kích hoạt tài khoản.

##### Bước 2: Thiết lập Monitor 1 — Giữ ấm Backend Spring Boot (`elearning-backend`)
1. Trên Dashboard UptimeRobot, bấm nút **+ Add New Monitor**.
2. Cấu hình các thông số:
   - **Monitor Type:** Chọn `HTTP(s)`.
   - **Friendly Name:** `WebLearnChinese - Backend API`
   - **URL (or IP):** `https://<YOUR_BACKEND_DOMAIN>.onrender.com/actuator/health`  
     *(Ví dụ: `https://elearning-backend-pwyi.onrender.com/actuator/health`)*
   - **Monitoring Interval:** Chọn `Every 5 minutes` (mặc định miễn phí).
   - **Monitor Timeout:** `30 seconds`.
3. Bấm **Create Monitor**.
4. *Xác nhận:* Endpoint `/actuator/health` là probe công khai của Spring Boot Actuator (đã cấp quyền `.permitAll()` trong `SecurityConfig.java`), trả về mã `200 OK` với nội dung `{"status":"UP"}` trong < 50ms.

##### Bước 3: Thiết lập Monitor 2 — Giữ ấm Speech Service Engine (`speech-service`)
1. Tiếp tục bấm nút **+ Add New Monitor**.
2. Cấu hình các thông số:
   - **Monitor Type:** Chọn `HTTP(s)`.
   - **Friendly Name:** `WebLearnChinese - Speech Tone Service`
   - **URL (or IP):** `https://speech-service-3l49.onrender.com/health`
   - **Monitoring Interval:** Chọn `Every 5 minutes` (mặc định miễn phí).
   - **Monitor Timeout:** `30 seconds`.
3. Bấm **Create Monitor**.
4. *Xác nhận:* Endpoint `/health` là probe công khai của FastAPI Chao tone engine, không yêu cầu token nội bộ, trả về mã `200 OK` với nội dung `{"status":"READY","engine":"local-acoustic-f0-tone","model":"Chao-5-Scale Tone Sandhi Engine"}`.

#### 3. Bảng Kiểm Tra Kết Quả Sau Cấu Hình
| Monitor | Mục tiêu | URL Endpoint | Chu kỳ ping | Trạng thái mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **Monitor 1** | Backend Spring Boot API | `https://<YOUR_BACKEND_DOMAIN>.onrender.com/actuator/health` | 5 phút | Up (HTTP 200, `{"status":"UP"}`) |
| **Monitor 2** | Python Speech Service | `https://speech-service-3l49.onrender.com/health` | 5 phút | Up (HTTP 200, `{"status":"READY"}`) |

> [!TIP]
> Sau khi kích hoạt 2 monitor trên, mở Dashboard Render để quan sát: cả hai dịch vụ sẽ duy trì nhãn xanh **Live**, không bao giờ chuyển sang **Suspended** hay **Sleeping**. Trải nghiệm luyện đọc và ôn tập SRS của người học sẽ đạt tốc độ phản hồi tức thì 100%.
