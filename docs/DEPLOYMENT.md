# Cẩm Nang Triển Khai 100% Free-Tier (Cloud Deployment Guide)

Tài liệu này hướng dẫn chi tiết quy trình đưa toàn bộ hệ thống **WebLearnChinese** lên Internet, sử dụng **100% dịch vụ miễn phí (Free Tier)**, **không yêu cầu thẻ tín dụng quốc tế (No Credit Card Required)** và **không có rủi ro tự động trừ phí (Zero Auto-Billing)**.

---

## 1. Kiến Trúc Triển Khai & Giới Hạn Free-Tier

```
+------------------------------------------------------------------------+
|                          GITHUB PAGES                                  |
|   https://<username>.github.io/<repo>/                                 |
|   - Vanilla JS, Zero-Build, Static Hosting                             |
|   - Tự động nhận diện API URL qua BACKEND_API_URL hoặc ?apiUrl=...     |
+------------------------------------------------------------------------+
                                  | HTTPS (CORS Allowed Origin)
                                  v
+------------------------------------------------------------------------+
|                       RENDER FREE WEB SERVICE                          |
|   https://elearning-backend-xxxx.onrender.com                          |
|   - Spring Boot 3.3.5 / Eclipse Temurin 21 JRE                         |
|   - Giới hạn RAM: 512MB (-XX:MaxRAMPercentage=75.0)                    |
|   - Endpoint kiểm tra sức khoẻ: /actuator/health                       |
+------------------------------------------------------------------------+
                /                                          \
  TLS (Port 4000)                                HTTPS + Header Token
  Collation: utf8mb4_unicode_ci                  X-Internal-Token
               v                                            v
+-----------------------------+           +------------------------------+
|   TIDB CLUSTER SERVERLESS   |           |    RENDER FREE WEB SERVICE   |
|     (100% Free Forever)     |           | https://speech-service-xxxx  |
| - Giao thức MySQL 8.0/8.4   |           | - Python 3.11, FastAPI       |
| - 5GB Dung lượng miễn phí   |           | - Thuật toán Chao 5-scale DSP|
| - Flyway Migrations (V1-V30)|           | - Endpoint: /health          |
+-----------------------------+           +------------------------------+
```

| Thành phần | Nền tảng | Gói dịch vụ | Đặc tính & Giới hạn | Thẻ tín dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | GitHub Pages | Free Public Repo | Băng thông 100GB/tháng, 1GB lưu trữ tĩnh | **Không** |
| **Backend API** | Render | Free Web Service | 512MB RAM, 750 giờ/tháng, tự ngủ sau 15p nhàn rỗi | **Không** |
| **Speech Service** | Render | Free Web Service | 512MB RAM (thực tế ~180MB), tự ngủ sau 15p | **Không** |
| **Cơ sở dữ liệu** | TiDB Cloud | Serverless Starter | 5GB lưu trữ miễn phí vĩnh viễn, 50 triệu RU/tháng | **Không** |

---

## 2. Quy Trình Thiết Lập Từng Bước

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu TiDB Cloud Serverless
1. Truy cập [TiDB Cloud Console](https://tidbcloud.com/) và đăng ký tài khoản (chọn đăng nhập bằng GitHub hoặc Google).
2. Tạo cụm cơ sở dữ liệu **TiDB Serverless**:
   - Chọn loại cụm: **Serverless**.
   - Chọn khu vực (Region): Gần nhất (ví dụ AWS `ap-southeast-1` Singapore hoặc `us-east-1`).
   - Đặt tên Database: `elearning_db`.
3. Nhấp nút **Connect** -> Chọn ngôn ngữ **Java** / công cụ **MySQL CLI**:
   - Lấy thông tin kết nối gồm: Host, Port (4000), Username (dạng `prefix.root`), Password.
4. Chuẩn hóa chuỗi kết nối JDBC:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:mysql://<gateway-host>:4000/elearning_db?sslMode=VERIFY_IDENTITY&useSSL=true&requireSSL=true&verifyServerCertificate=true&connectionCollation=utf8mb4_unicode_ci&characterEncoding=UTF-8&serverTimezone=UTC
   ```
   > [!IMPORTANT]
   > Tham số `connectionCollation=utf8mb4_unicode_ci` là bắt buộc vì schema dự án sử dụng `utf8mb4_unicode_ci`. Nếu thiếu, các so sánh ký tự trong Flyway migration sẽ phát sinh lỗi 1267 (Illegal mix of collations).

### Bước 2: Triển Khai Backend Web Service Trên Render
1. Đăng nhập [Render.com](https://render.com/) bằng GitHub.
2. Nhấp **New +** -> Chọn **Web Service** -> Kết nối repository `WebLearnChinese`.
3. Cấu hình dịch vụ:
   - **Name**: `elearning-backend` (hoặc tên tùy chọn).
   - **Runtime**: `Docker`.
   - **Dockerfile Path**: `./Dockerfile`.
   - **Instance Type**: `Free`.
   - **Health Check Path**: `/actuator/health`.
4. Khai báo các biến môi trường (Environment Variables):
   - `JAVA_OPTS`: `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`
   - `APP_DEMO_SEED_ACCOUNTS`: `false` (trên Production profile)
   - `JWT_SECRET`: Khóa ngẫu nhiên tối thiểu 32 ký tự (Render tự sinh hoặc dùng `openssl rand -base64 32`)
   - `SPRING_DATASOURCE_URL`: Chuỗi kết nối JDBC TiDB ở Bước 1
   - `SPRING_DATASOURCE_USERNAME`: Tên tài khoản TiDB
   - `SPRING_DATASOURCE_PASSWORD`: Mật khẩu tài khoản TiDB
   - `APP_CORS_ALLOWED_ORIGINS`: `https://<username>.github.io,http://localhost:3000`
   - `SPEECH_SERVICE_URL`: URL dịch vụ Speech Service (lấy sau khi tạo Bước 3)
   - `INTERNAL_SPEECH_TOKEN`: Token ngẫu nhiên dùng chung giữa Backend và Speech Service
5. Nhấp **Create Web Service**. Khi triển khai hoàn tất, Flyway sẽ tự động chạy tất cả migration từ `V1` đến `V30` trên TiDB.

### Bước 3: Triển Khai Speech Service Trên Render
1. Nhấp **New +** -> Chọn **Web Service** -> Kết nối repository `WebLearnChinese`.
2. Cấu hình dịch vụ:
   - **Name**: `speech-service`.
   - **Runtime**: `Docker`.
   - **Dockerfile Path**: `./speech-service/Dockerfile`.
   - **Build Context**: `./speech-service`.
   - **Health Check Path**: `/health`.
3. Khai báo biến môi trường:
   - `PORT`: `8000`
   - `INTERNAL_SPEECH_TOKEN`: Token trùng khớp với cấu hình ở Backend
4. Lưu URL của dịch vụ (ví dụ: `https://speech-service-xxxx.onrender.com`) và cập nhật ngược lại vào biến `SPEECH_SERVICE_URL` của Backend ở Bước 2.

### Bước 4: Triển Khai Frontend Lên GitHub Pages
1. Quy trình CI/CD đã được cấu hình sẵn trong `.github/workflows/deploy-pages.yml`.
2. Vào GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> tab **Variables**:
   - Nhấp **New repository variable**.
   - Tên biến: `BACKEND_API_URL`
   - Giá trị: `https://elearning-backend-xxxx.onrender.com/api/v1`
3. Vào tab **Actions** -> Chọn workflow **Deploy Frontend to GitHub Pages** -> Nhấp **Run workflow** (hoặc push commit lên nhánh `main`).
4. Truy cập giao diện tại: `https://<username>.github.io/<repo>/`.

> [!TIP]
> **Đổi URL Backend Động**: Người dùng hoặc reviewer có thể kiểm tra trực tiếp frontend với một backend khác mà không cần deploy lại, chỉ bằng cách thêm tham số vào URL:
> `https://<username>.github.io/<repo>/?apiUrl=https://your-backend.onrender.com/api/v1`
> Giá trị này sẽ tự động được lưu vào `localStorage` cho toàn bộ phiên duyệt web!

### Bước 5: Thiết Lập UptimeRobot Giữ Ấm 24/7 (Prevent Sleep & 0s Latency)
Trên gói Free của Render, web service sẽ tự động chuyển sang chế độ ngủ (Sleep) sau 15 phút không có lượt truy cập. Khi có yêu cầu mới, container cần 30-50 giây để khởi động lại (Cold Start).
1. Đăng ký tài khoản miễn phí tại [UptimeRobot.com](https://uptimerobot.com/).
2. Tạo Monitor thứ nhất cho Backend:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `WebLearnChinese Backend Probe`
   - **URL (or IP)**: `https://elearning-backend-xxxx.onrender.com/actuator/health`
   - **Monitoring Interval**: `Every 5 minutes`
3. Tạo Monitor thứ hai cho Speech Service:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `WebLearnChinese Speech Service Probe`
   - **URL (or IP)**: `https://speech-service-xxxx.onrender.com/health`
   - **Monitoring Interval**: `Every 5 minutes`
4. UptimeRobot sẽ tự động gửi HTTP GET request mỗi 5 phút, giữ container luôn thức 24/7 với thời gian phản hồi tức thì (0 giây chờ đợi).

---

## 3. Các Bất Biến & Rào Chắn Bảo Mật Khi Triển Khai

1. **Khóa Bí Mật JWT (Fail-Fast Rule)**:
   Trên môi trường Production, ứng dụng sẽ từ chối khởi động ngay lập tức (fail-fast) nếu `JWT_SECRET` bị bỏ trống hoặc có độ dài nhỏ hơn 32 ký tự (256-bit).
2. **Cấm Seeder Tài Khoản Mẫu (Demo Seed Guard)**:
   Thuộc tính `app.demo.seed-accounts` bắt buộc phải là `false` trên Production để ngăn chặn tự động ghi đè hoặc chèn tài khoản thử nghiệm vào hệ thống thực tế.
3. **Giới Hạn Tần Suất Đăng Nhập (Rate Limiting)**:
   Backend tự động giới hạn tối đa 10 lần thử đăng nhập sai trong 60 giây cho mỗi IP để phòng chống brute-force mật khẩu.
4. **Tương Thích Khóa Phân Tán TiDB**:
   Migration `V24` đã cấu hình `NONCLUSTERED` primary key cho bảng `vocab_radical`. Không chạy DDL bỏ khóa chính cụm trên TiDB đang vận hành.
