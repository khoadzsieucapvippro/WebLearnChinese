# Cẩm Nang Triển Khai 100% Free-Tier & Vận Hành An Toàn (Cloud Deployment Guide)

Tài liệu này hướng dẫn chi tiết quy trình đưa toàn bộ hệ thống **WebLearnChinese** lên Internet, sử dụng **100% dịch vụ miễn phí (Free Tier)**, **không yêu cầu thẻ tín dụng quốc tế (No Credit Card Required)** và **không có rủi ro tự động trừ phí (Zero Auto-Billing)**.

---

## 1. Kiến Trúc Triển Khai & Hạn Ngạch 750 Giờ Render Free Tier

### 1.1. Vấn Đề Cạn Kiệt Giờ Khi Chạy 2 Dịch Vụ Độc Lập
Render cấp **750 giờ chạy miễn phí mỗi tháng dương lịch** cho toàn bộ tài khoản cá nhân.
- Nếu triển khai 2 dịch vụ độc lập (`elearning-backend` và `speech-service`) và dùng UptimeRobot ping mỗi 5 phút để chống ngủ, tổng số giờ tiêu thụ là:
  $$2 \times 720\text{h} = 1.440\text{h} > 750\text{h}$$
  Hệ quả: Toàn bộ hệ thống sẽ bị Render tắt cưỡng chế vào ngày thứ 16 của mọi tháng!

### 1.2. Giải Pháp: Kiến Trúc Container Hợp Nhất (Unified Single-Container - Khuyến Nghị)
Hệ thống cung cấp `Dockerfile.unified` kết hợp cả **Spring Boot 3.3.5 (Java 21)** và **Python 3.11 FastAPI (Chao 5-scale DSP)** trong cùng một container được quản lý bởi `supervisord`:

```
+------------------------------------------------------------------------+
|                          GITHUB PAGES                                  |
|   https://<username>.github.io/<repo>/                                 |
|   - Vanilla JS, Zero-Build, Static Hosting                             |
|   - Nhận diện API URL qua BACKEND_API_URL hoặc ?apiUrl=...             |
+------------------------------------------------------------------------+
                                  | HTTPS (CORS Allowed Origin)
                                  v
+------------------------------------------------------------------------+
|            RENDER FREE WEB SERVICE (UNIFIED FULL-STACK CONTAINER)      |
|            https://elearning-backend-xxxx.onrender.com                 |
|                                                                        |
|   [Supervisord (PID 1)]                                                |
|     ├── Spring Boot 3.3.5 (Java 21) -> Cổng $PORT (8080)              |
|     │   JVM cờ tối ưu: -Xms128m -Xmx224m -XX:+UseSerialGC (~350MB)     |
|     └── Python FastAPI Speech Engine -> Cổng nội bộ 127.0.0.1:8000     |
|         Uvicorn Chao 5-scale DSP CPU-only (~70MB)                      |
|                                                                        |
|   * Tổng RAM: ~435MB / 512MB limit (Biên an toàn 77MB)                 |
|   * Giờ sử dụng: Đúng 720h/tháng (1 Web Service <= 750h quota)        |
|   * Độ trễ phân tích phát âm: < 1ms loopback nội bộ (0ms WAN latency) |
|   * Uptime: 1 monitor UptimeRobot giữ ấm 24/7 an toàn tuyệt đối       |
+------------------------------------------------------------------------+
                                  | TLS (Port 4000)
                                  | utf8mb4_unicode_ci
                                  v
+------------------------------------------------------------------------+
|                     TIDB CLOUD SERVERLESS STARTER                      |
|                         (100% Free Forever)                            |
|   - 5GB lưu trữ miễn phí vĩnh viễn, 50 triệu RU/tháng                 |
|   - Giao thức MySQL 8.0/8.4, TLS bắt buộc (sslMode=VERIFY_IDENTITY)   |
|   - Flyway Schema Migrations V1..V30 tự động quản lý                  |
|   - Tự động sao lưu hàng ngày 02:00 UTC qua GitHub Actions (30d)      |
+------------------------------------------------------------------------+
```

### 1.3. Bảng So Sánh Hai Phương Án Vận Hành

| Thành phần | Phương án 1: Unified Container (Khuyến nghị) | Phương án 2: Decoupled Services |
| :--- | :--- | :--- |
| **Số lượng Web Service trên Render** | **1 Web Service duy nhất** | 2 Web Services riêng biệt |
| **Tiêu thụ giờ Render Free** | **720 giờ/tháng** ($\le 750\text{h}$ quota) | 1.440 giờ/tháng (vượt hạn ngạch sau ~15.6 ngày) |
| **Khả năng giữ ấm 24/7** | **Khả thi 100%** (1 monitor UptimeRobot) | Không thể giữ ấm cả 2 (buộc Speech phải ngủ) |
| **Độ trễ chấm thanh điệu** | **Tức thì (< 1ms loopback)** | 30-40s cold start nếu Speech đang ngủ |
| **Cấu hình Render Blueprint** | `dockerfilePath: ./Dockerfile.unified` | `dockerfilePath: ./Dockerfile` & `./speech-service/Dockerfile` |

---

## 2. Quy Trình Thiết Lập Từng Bước

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu TiDB Cloud Serverless
1. Truy cập [TiDB Cloud Console](https://tidbcloud.com/) và đăng ký tài khoản (chọn đăng nhập bằng GitHub hoặc Google).
2. Tạo cụm cơ sở dữ liệu **TiDB Serverless**:
   - Chọn loại cụm: **Serverless**.
   - Chọn khu vực (Region): Gần nhất (ví dụ AWS `ap-southeast-1` Singapore hoặc `us-east-1`).
   - Đặt tên Database: `elearning_db`.
3. Nhấp nút **Connect** -> Chọn ngôn ngữ **Java** / công cụ **MySQL CLI**:
   - Lấy thông tin kết nối gồm: Host, Port (4000), Username (dạng `<prefix>.root`), Password.
4. Chuẩn hóa chuỗi kết nối JDBC:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:mysql://<gateway-host>:4000/elearning_db?sslMode=VERIFY_IDENTITY&useSSL=true&requireSSL=true&verifyServerCertificate=true&connectionCollation=utf8mb4_unicode_ci&characterEncoding=UTF-8&serverTimezone=UTC
   ```
   > [!IMPORTANT]
   > Tham số `connectionCollation=utf8mb4_unicode_ci` là bắt buộc vì schema dự án sử dụng `utf8mb4_unicode_ci`. Nếu thiếu, các so sánh ký tự trong Flyway migration sẽ phát sinh lỗi 1267 (Illegal mix of collations).

### Bước 2: Triển Khai Backend Web Service Trên Render (Unified Container)
1. Đăng nhập [Render.com](https://render.com/) bằng GitHub.
2. Nhấp **New +** -> Chọn **Blueprint** (hoặc Web Service thủ công) -> Kết nối repository `WebLearnChinese`.
   - Nếu dùng Blueprint, Render sẽ tự động đọc `render.yaml` và áp dụng cấu hình Unified Container tối ưu.
3. Nếu tạo thủ công:
   - **Name**: `elearning-backend`.
   - **Runtime**: `Docker`.
   - **Dockerfile Path**: `./Dockerfile.unified`.
   - **Instance Type**: `Free`.
   - **Health Check Path**: `/actuator/health`.
4. Khai báo các biến môi trường (Environment Variables):
   - `JAVA_OPTS`: `-Xms128m -Xmx224m -XX:MaxMetaspaceSize=112m -XX:ReservedCodeCacheSize=48m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError`
   - `APP_DEMO_SEED_ACCOUNTS`: `false` (bắt buộc trên production)
   - `APP_BOOTSTRAP_ADMIN_EMAIL`: `admin@elearning.local` (hoặc email của bạn)
   - `APP_BOOTSTRAP_ADMIN_PASSWORD`: Mật khẩu khởi tạo (tối thiểu 12 ký tự, hoặc để trống để hệ thống tự sinh ngẫu nhiên an toàn)
   - `JWT_SECRET`: Khóa ngẫu nhiên tối thiểu 32 ký tự (Render tự sinh hoặc dùng `openssl rand -base64 32`)
   - `SPRING_DATASOURCE_URL`: Chuỗi kết nối JDBC TiDB ở Bước 1
   - `SPRING_DATASOURCE_USERNAME`: Tên tài khoản TiDB
   - `SPRING_DATASOURCE_PASSWORD`: Mật khẩu tài khoản TiDB
   - `APP_CORS_ALLOWED_ORIGINS`: `https://<username>.github.io,http://localhost:3000`
   - `SPEECH_SERVICE_URL`: `http://127.0.0.1:8000` (kết nối nội bộ loopback 0ms)
   - `INTERNAL_SPEECH_TOKEN`: Token ngẫu nhiên (Render tự sinh qua `generateValue: true`)
5. Nhấp **Create Web Service**. Khi triển khai hoàn tất, Flyway sẽ tự động chạy tất cả migration từ `V1` đến `V30` trên TiDB, và `BootstrapAdminRunner` sẽ tự động khởi tạo tài khoản Admin ban đầu nếu DB chưa có Admin nào.

### Bước 3: Triển Khai Frontend Lên GitHub Pages
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

### Bước 4: Thiết Lập UptimeRobot Giữ Ấm 24/7 (Prevent Sleep & 0s Latency)
Trên gói Free của Render, web service sẽ tự động chuyển sang chế độ ngủ (Sleep) sau 15 phút không có lượt truy cập. Khi có yêu cầu mới, container cần 30-50 giây để khởi động lại (Cold Start).
1. Đăng ký tài khoản miễn phí tại [UptimeRobot.com](https://uptimerobot.com/).
2. Tạo **duy nhất 1 Monitor** cho Backend (do đã dùng Unified Container):
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `WebLearnChinese Backend Probe`
   - **URL (or IP)**: `https://elearning-backend-xxxx.onrender.com/actuator/health`
   - **Monitoring Interval**: `Every 5 minutes`
3. UptimeRobot gửi HTTP GET request mỗi 5 phút, giữ container luôn thức 24/7 với thời gian phản hồi tức thì.
   - Tổng giờ tiêu thụ: $1 \times 720\text{h} = 720\text{h} \le 750\text{h}$ quota hàng tháng (An toàn 100%).

---

## 3. Sao Lưu Định Kỳ & Khôi Phục Thảm Họa (Disaster Recovery)

Chi tiết quy trình vận hành và lệnh sao lưu xem tại: **[docs/RUNBOOK_BACKUP_SECURITY.md](RUNBOOK_BACKUP_SECURITY.md)**.

### Tự Động Hóa Sao Lưu Hàng Ngày (GitHub Actions):
- Workflow: `.github/workflows/db-backup-schedule.yml`
- Chu kỳ: Chạy tự động lúc **02:00 UTC** hàng ngày (09:00 AM giờ Việt Nam).
- Lưu trữ: Bản nén `.sql.gz` được lưu tại **GitHub Actions Artifacts** trong **30 ngày**.
- Lệnh sao lưu chuẩn hóa 5 cờ kỹ thuật:
  ```bash
  mysqldump -h "$TIDB_HOST" -P 4000 -u "$TIDB_USER" -p"$TIDB_PASSWORD" \
    --ssl-mode=REQUIRED --default-character-set=utf8mb4 \
    --single-transaction --skip-lock-tables --set-gtid-purged=OFF \
    --databases elearning_db | gzip > backup_elearning_db_$(date +%Y%m%d_%H%M%S).sql.gz
  ```

### Quy Trình Khôi Phục Thảm Họa 4 Bước (RPO $\le$ 24h, RTO $\le$ 15m):
1. **Bước 1**: Tạo database đích với `utf8mb4_unicode_ci`.
2. **Bước 2**: Khôi phục dữ liệu từ bản nén: `gunzip < backup.sql.gz | mysql ...`.
3. **Bước 3**: Khởi động Backend Spring Boot và xác nhận Flyway schema validation `V1..V30`.
4. **Bước 4**: Chạy 5 câu truy vấn SQL kiểm chứng:
   - Đủ 214 Bộ thủ Khang Hy (`SELECT COUNT(*) FROM radical;` = 214)
   - Bộ thủ #69 mang âm Hán-Việt là 'Cân'
   - Đủ 1.068 Từ vựng HSK 1–3 (`SELECT COUNT(*) FROM vocabulary;` = 1068)
   - Đủ 50 Bài học (`SELECT COUNT(*) FROM lesson;` = 50)
   - Có ít nhất 1 Admin hoạt động (`SELECT COUNT(...) >= 1`)

---

## 4. Khởi Tạo Admin Ban Đầu & Đổi Mật Khẩu (Admin Bootstrap & Password Rotation)

### 4.1. Nguyên Tắc Bootstrap An Toàn
- Khi `APP_DEMO_SEED_ACCOUNTS=false`, các tài khoản thử nghiệm với mật khẩu cố định `Password@123` hoàn toàn không được tạo.
- Thành phần `BootstrapAdminRunner` chỉ chạy khởi tạo tài khoản Admin ban đầu khi và chỉ khi:
  $$\text{countActiveAdmins()} == 0$$
- Nếu cơ sở dữ liệu đã có ít nhất 1 Admin, `BootstrapAdminRunner` lập tức bỏ qua và không ghi đè bất kỳ dữ liệu nào.

### 4.2. Quy Trình Đổi Mật Khẩu Khởi Tạo:
1. Đăng nhập bằng tài khoản bootstrap (`admin@elearning.local` hoặc email đã cấu hình):
   ```bash
   curl -X POST https://elearning-backend-xxxx.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"emailOrPhone":"admin@elearning.local","password":"<bootstrap-password>"}'
   ```
2. Đổi mật khẩu chính thức qua API:
   ```bash
   curl -X POST https://elearning-backend-xxxx.onrender.com/api/v1/auth/change-password \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"oldPassword":"<bootstrap-password>","newPassword":"<new-secure-password>"}'
   ```
3. Hệ thống tự động tăng `authorizationVersion` để thu hồi toàn bộ phiên đăng nhập cũ.

---

## 5. Các Bất Biến & Rào Chắn Bảo Mật Khi Triển Khai

1. **Khóa Bí Mật JWT (Fail-Fast Rule)**:
   Trên môi trường Production, ứng dụng sẽ từ chối khởi động ngay lập tức (fail-fast) nếu `JWT_SECRET` bị bỏ trống hoặc có độ dài nhỏ hơn 32 ký tự (256-bit).
2. **Cấm Seeder Tài Khoản Mẫu (Demo Seed Guard)**:
   Thuộc tính `app.demo.seed-accounts` bắt buộc phải là `false` trên Production để ngăn chặn tự động ghi đè hoặc chèn tài khoản thử nghiệm vào hệ thống thực tế.
3. **Giới Hạn Tần Suất Đăng Nhập (Rate Limiting)**:
   Backend tự động giới hạn tối đa 10 lần thử đăng nhập sai trong 60 giây cho mỗi IP để phòng chống brute-force mật khẩu.
4. **Bảo Vệ Last Admin Invariant**:
   Hệ thống từ chối mọi yêu cầu xóa, khóa hoặc hạ quyền tài khoản Admin duy nhất còn hoạt động.
5. **Cấm Tự Phê Duyệt**:
   Tài khoản kiêm nhiệm Creator và Moderator bị chặn cứng không thể tự duyệt hoặc từ chối bài viết của chính mình.
6. **Tương Thích Khóa Phân Tán TiDB**:
   Migration `V24` đã cấu hình `NONCLUSTERED` primary key cho bảng `vocab_radical`. Không chạy DDL bỏ khóa chính cụm trên TiDB đang vận hành.
