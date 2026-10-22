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
   > TiDB mặc định kích hoạt clustered index cho khóa chính. Flyway migration `V24__add_radical_stroke_count_and_expand_vocab_radical_pk.sql` thực hiện tái cấu trúc khóa chính:
   > `ALTER TABLE VOCAB_RADICAL DROP PRIMARY KEY, ADD PRIMARY KEY (vocab_id, radical_id, hanzi_char);`
   > Nếu clustered index được bật, TiDB sẽ báo lỗi: `ERROR 8200 (HY000): Unsupported drop primary key when the table is using clustered index`.
   > Do đó, bắt buộc phải bổ sung tham số `sessionVariables=tidb_enable_clustered_index=OFF` vào chuỗi kết nối JDBC. Khi đó bảng được tạo với non-clustered primary key, cho phép Flyway V1–V29 thực thi 100% trơn tru không lỗi.

   Chuỗi kết nối JDBC hoàn chỉnh:
   ```
   jdbc:mysql://<gateway-host>:4000/elearning_db?sslMode=VERIFY_IDENTITY&useSSL=true&requireSSL=true&verifyServerCertificate=true&sessionVariables=tidb_enable_clustered_index=OFF&characterEncoding=UTF-8&serverTimezone=UTC
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
   - Khi có người dùng gửi request đầu tiên, Render sẽ khởi động lại container (thời gian khởi động khoảng 30–50 giây).

2. **Cơ chế chịu lỗi tích hợp sẵn của hệ thống:**
   - **Backend Timeout:** Spring Boot được cấu hình `connect-timeout-ms: 30000` và `read-timeout-ms: 45000` kèm cơ chế thử lại (3 lần, khoảng cách 2.5s) trong `LocalSpeechServiceClient.java`.
   - **Thông báo thân thiện:** Nếu speech service đang trong quá trình thức giấc từ trạng thái ngủ đông, hệ thống sẽ trả về phản hồi chuẩn `status: "engine_unavailable"` kèm thông báo tiếng Việt:
     *"Hệ thống đang khởi động lại dịch vụ xử lý âm thanh đám mây (trạng thái tiết kiệm tài nguyên). Vui lòng thử lại sau 30-60 giây."*
   - Trình duyệt không bị crash hoặc treo vô hạn, trải nghiệm người dùng được bảo đảm mượt mà.
