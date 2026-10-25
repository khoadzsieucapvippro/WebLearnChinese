# Hướng Dẫn Phát Triển & Cấu Hình Local (Development Guide)

Tài liệu này hướng dẫn thiết lập môi trường, cấu hình và vận hành dự án **WebLearnChinese** dành cho nhà phát triển (Developers) và Coding Agents.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

| Công cụ | Phiên bản yêu cầu | Mục đích |
| :--- | :--- | :--- |
| **Java JDK** | 21 (Eclipse Temurin khuyên dùng) | Biên dịch và chạy Backend Spring Boot |
| **Apache Maven** | 3.9.x trở lên | Quản lý dependency và đóng gói Backend |
| **Node.js** | 18.x trở lên (khuyên dùng Node 20 LTS) | Chạy static server và bộ kiểm thử frontend/e2e |
| **Python** | 3.11.x | Microservice phân tích ngữ âm Chao 5-scale |
| **MySQL / MariaDB** | 8.0+ / 8.4 LTS | Cơ sở dữ liệu quan hệ (hoặc dùng Docker) |
| **Docker & Compose** | Khuyên dùng cho local | Chạy nhanh cụm MySQL và microservices |

---

## 2. Bản Đồ Cấu Trúc Repository (Repository Map)

```
WebLearnChinese/
├── backend/                       # Spring Boot 3.3.5 Backend (Java 21)
│   ├── src/main/java/             # Controllers, Services, Repositories, DTOs, Security
│   ├── src/main/resources/        # application.yml, db/migration/ (V1..V30)
│   ├── src/test/java/             # JUnit 5 & Testcontainers integration tests
│   └── pom.xml                    # Maven build file
├── frontend/                      # Zero-Build Vanilla Web Application
│   ├── *.html                     # 25 trang semantic HTML5 (index, login, srs, admin...)
│   ├── css/                       # Hệ thống CSS design tokens, layout & responsive styles
│   ├── js/                        # ES Modules: api/, auth/, pages/, srs/, ui/
│   └── assets/                    # Icons, hình ảnh và dữ liệu nét chữ Hán strokes/
├── speech-service/                # Python 3.11 FastAPI Speech Microservice
│   ├── app/                       # Thuật toán âm học Chao 5-scale, Librosa F0 tracking
│   ├── run_service.py             # Script khởi động Uvicorn server cổng 8000
│   └── requirements.txt           # Thư viện Python
├── tests/                         # Hệ thống kiểm thử tự động nhiều tầng
│   ├── frontend/                  # Runner 940 test: static, unit, browser, accessibility
│   ├── e2e/                       # Runner 74 test E2E Opaque-Box (Tiers 1-4)
│   ├── fullstack/                 # Kịch bản tích hợp toàn bộ stack
│   ├── postman/                   # Bộ Postman Collection v2.1 (83 request, 11 module)
│   └── screenshots/               # Ảnh chụp minh chứng kiểm thử
├── scripts/                       # Scripts phụ trợ dữ liệu và kiểm tra chuẩn hóa
├── docs/                          # Hệ thống tài liệu kỹ thuật chuẩn hoá
│   ├── ARCHITECTURE.md            # Đặc tả kiến trúc hệ thống
│   ├── DEVELOPMENT.md             # Hướng dẫn phát triển và cấu hình local (Tài liệu này)
│   ├── TESTING.md                 # Hướng dẫn chi tiết hệ thống kiểm thử
│   ├── DEPLOYMENT.md              # Cẩm nang triển khai 100% Free-Tier Cloud 24/7
│   └── curriculum-manifest.md     # Danh mục 50 bài học & 1,000 từ vựng chuẩn hoá
├── data/                          # Dữ liệu tra cứu gốc (MakeMeAHanzi, HSK 3.0 raw)
├── bo_thu_214.csv                 # Dataset 214 bộ thủ (dùng cho scripts/verify_hsk...)
├── tu_vung_1000.csv               # Dataset 1,068 từ vựng (dùng cho scripts/verify_hsk...)
├── data_kiem_tra_all.json         # Dataset tổng hợp (dùng cho scripts/verify_hsk...)
├── data_kiem_tra_tom_tat.txt      # Báo cáo tóm tắt dataset
├── docker-compose.yml             # Cấu hình khởi chạy cụm container cục bộ
├── Dockerfile                     # Dockerfile đóng gói Backend cho Render/Cloud
├── render.yaml                    # Blueprint Render triển khai Cloud Free-Tier
├── run.bat                        # Script khởi động 1-click full-stack trên Windows
├── SECURITY.md                    # Chính sách bảo mật & báo cáo lỗ hổng
├── README.md                      # Tài liệu tổng quan dự án
└── AGENTS.md                      # Quy tắc bất biến dành cho Coding Agent
```

> [!NOTE]
> Các tệp dữ liệu tại thư mục gốc (`bo_thu_214.csv`, `tu_vung_1000.csv`, `data_kiem_tra_all.json`, `data_kiem_tra_tom_tat.txt`) là fixture chuẩn hóa được kiểm định chéo bởi `scripts/verify_hsk_radical_standardization.py` và `scripts/export_audit_dataset.py`. Chúng được duy trì tại vị trí này để bảo toàn tính tương thích với các script kiểm thử.

---

## 3. Cấu Hình Môi Trường Cục Bộ (Local Configuration)

### 3.1. Thiết lập Database Local
1. Khởi động MySQL trên cổng `3306`.
2. Tạo cơ sở dữ liệu `elearning_db` với bảng mã UTF-8 chuẩn:
   ```sql
   CREATE DATABASE IF NOT EXISTS elearning_db 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```
3. Khi Backend khởi động lần đầu, Flyway sẽ tự động chạy tất cả migration từ `V1` đến `V30` để khởi tạo toàn bộ bảng, nạp 214 bộ thủ Khang Hy và 50 bài học chuẩn.

### 3.2. Cấu hình file `application-local.yml` (Tùy chọn)
Nếu cấu hình MySQL của bạn khác mặc định, tạo tệp `backend/src/main/resources/application-local.yml` (tệp này đã được cấu hình trong `.gitignore` để không bao giờ bị commit):
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/elearning_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: your_local_password

jwt:
  secret: dev-local-jwt-secret-key-minimum-256-bits-length-for-development-only!

app:
  demo:
    seed-accounts: true
```

---

## 4. Khởi Chạy Dự Án Cục Bộ (Running Locally)

### Cách 1: 1-Click trên Windows bằng `run.bat` (Khuyên dùng)
Chạy tệp `run.bat` tại thư mục gốc:
```cmd
.\run.bat
```
Script sẽ tự động:
1. Kiểm tra cổng 3306 của MySQL.
2. Khởi chạy Speech Service (FastAPI cổng 8000) trong cửa sổ riêng.
3. Khởi chạy Spring Boot Backend (cổng 8080) trong cửa sổ riêng.
4. Khởi chạy Frontend Server (Node.js cổng 3000) và tự động mở trình duyệt tại `http://localhost:3000`.

### Cách 2: Sử dụng Docker Compose
```bash
docker compose up -d
```
Docker Compose sẽ khởi chạy MySQL, Speech Service và Backend. Sau đó bạn chỉ cần khởi chạy frontend:
```bash
npm run serve
```

### Cách 3: Khởi chạy thủ công từng dịch vụ
1. **Khởi chạy Speech Service**:
   ```bash
   cd speech-service
   pip install -r requirements.txt
   python run_service.py
   ```
   Kiểm tra tại: `http://127.0.0.1:8000/health`
2. **Khởi chạy Backend Spring Boot**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Kiểm tra tại: `http://localhost:8080/actuator/health`
3. **Khởi chạy Frontend**:
   ```bash
   npm run serve
   ```
   Truy cập ứng dụng tại: `http://localhost:3000`

---

## 5. Tài Khoản Kiểm Thử Mẫu (Standard Demo Accounts)

Khi bật `app.demo.seed-accounts=true` trên môi trường phát triển, hệ thống tự động cung cấp 4 tài khoản với mật khẩu chung: `Password@123`:

| Vai trò | Email đăng nhập | Mật khẩu chung | Mục đích kiểm thử |
| :--- | :--- | :--- | :--- |
| **Learner** (Học viên) | `learner@gmail.com` | `Password@123` | Tra cứu bộ thủ, từ vựng, học SRS, HanziWriter |
| **Creator** (Biên soạn) | `creator@gmail.com` | `Password@123` | Tạo bài học mới, nhập từ vựng Excel, gửi duyệt |
| **Moderator** (Kiểm duyệt) | `moderator@gmail.com` | `Password@123` | Duyệt bài học, từ chối kèm lý do |
| **Admin** (Quản trị viên) | `admin@gmail.com` | `Password@123` | Quản lý tài khoản, phân quyền RBAC, xem Audit Log |

---

## 6. Quy Chuẩn Lập Trình & An Toàn Mã Nguồn (Coding Standards)

1. **An Toàn DOM (Strict Anti-XSS Invariant)**:
   - Nghiêm cấm sử dụng `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML` khi chèn dữ liệu động.
   - Luôn sử dụng DOM APIs an toàn: `document.createElement()`, `element.textContent`, `element.setAttribute()`.
   - Mọi URL điều hướng hoặc tài nguyên media phải đi qua hàm `sanitizeNavigationUrl()` hoặc `sanitizeResourceUrl()` trong `frontend/js/ui/security.js`.
2. **Thiết Kế Giao Diện & Design Tokens**:
   - Tuân thủ bảng màu Scholarly Cinnabar: màu nhấn chính `--color-primary: #8B2635` / hover `--color-primary-dark: #701E2B`.
   - Phông chữ chữ Hán bắt buộc dùng stack: `"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`.
   - Hỗ trợ đầy đủ `prefers-reduced-motion` và responsive trên màn hình mobile nhỏ nhất (375px) không bị tràn ngang.
3. **Quy Định Flyway Migration**:
   - Tuyệt đối không sửa đổi hay đánh số lại các tệp migration `V1` đến `V30` đã có.
   - Schema mới phải nằm trong tệp mới `V31__...sql` và tương thích cả MySQL 8 và TiDB Cloud Serverless.
   - Thuộc tính `spring.jpa.hibernate.ddl-auto` luôn giữ giá trị `none`.
