# E-Learning Platform: Kangxi Radicals & Chinese Vocabulary with SRS

## 🌐 Link Trải Nghiệm Trực Tuyến (Dành Cho Nhóm Trưởng / Giảng Viên)

[![Live Demo on GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://khoadzsieucapvippro.github.io/WebLearnChinese/)

- **Đường link truy cập trực tiếp**: [https://khoadzsieucapvippro.github.io/WebLearnChinese/](https://khoadzsieucapvippro.github.io/WebLearnChinese/)
- Trực quan, chạy 24/7 trực tiếp trên GitHub Pages với cơ chế Smart Zero-Backend Fallback tự vận hành, 0 giây chờ đợi, không bao giờ lỗi kết nối!

### Bảng 4 Tài Khoản Kiểm Thử Mẫu (Mật khẩu chung: `Password@123`)

| Vai trò (Role) | Email đăng nhập | Mật khẩu chung | Các chức năng chính cần kiểm tra |
| :--- | :--- | :--- | :--- |
| **Học viên (Learner)** | `learner@gmail.com`<br>`learner@elearning.local` | `Password@123` | Tra cứu 214 Bộ thủ, Từ vựng HSK, Luyện viết chữ Hán, Ôn tập Flashcard SRS (SM-2), Ghi chú cá nhân, Cài đặt |
| **Biên soạn (Creator)** | `creator@gmail.com`<br>`creator@elearning.local` | `Password@123` | Tạo bài học mới, Import từ vựng bằng file Excel 2 bước, Sắp xếp từ vựng, Gửi bài duyệt |
| **Kiểm duyệt (Moderator)** | `moderator@gmail.com`<br>`moderator@elearning.local` | `Password@123` | Xem hàng đợi duyệt bài, Xem chi tiết bài soạn, Phê duyệt / Từ chối bài học kèm lý do, Xem lịch sử kiểm duyệt |
| **Quản trị (Admin)** | `admin@gmail.com`<br>`admin@elearning.local` | `Password@123` | Quản lý tài khoản, Phân quyền RBAC 4 vai trò, Quản trị 214 Bộ thủ, Từ vựng & Bài học toàn hệ thống |

---

## ☁️ Hướng Dẫn Chủ Dự Án Kết Nối Railway / Render Trong 3 Phút

- **Bước 1**: Đăng nhập [Railway.app](https://railway.app/) -> Bấm **New Project** -> Chọn **Deploy from GitHub repo** -> Chọn repo `khoadzsieucapvippro/WebLearnChinese`.
- **Bước 2**: Bấm **+ New** -> Chọn **Database** -> **Add MySQL**. Railway tự động cấp các biến `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.
- **Bước 3**: Vào Service Backend vừa tạo -> Tab **Variables** -> Đảm bảo service đọc đúng các biến từ MySQL (hoặc gắn reference `${{MySQL.MYSQLHOST}}...`). Vào tab **Settings** -> **Generate Domain** để lấy domain công khai (ví dụ `https://elearning-backend.up.railway.app`).
- **Bước 4**: Kết nối với GitHub Pages:
  - Vào GitHub repo `khoadzsieucapvippro/WebLearnChinese` -> **Settings** -> **Secrets and variables** -> **Actions** -> Tab **Variables** -> Bấm **New repository variable**.
  - Tên: `BACKEND_API_URL`
  - Giá trị: `https://<DOMAIN_RAILWAY>/api/v1` (ví dụ `https://elearning-backend.up.railway.app/api/v1`).
  - Hoặc trên thanh địa chỉ trang GitHub Pages, chỉ cần thêm `?apiUrl=https://<DOMAIN_RAILWAY>/api/v1` một lần duy nhất, trang web sẽ tự lưu vào `localStorage`!

---

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=khoadzsieucapvippro%2FWebLearnChinese)

*(Nhóm trưởng/Reviewer có thể bấm trực tiếp nút trên, hoặc trên giao diện repo GitHub: Bấm nút xanh **Code** -> Chọn tab **Codespaces** -> Bấm **Create codespace on main**)*

An educational web platform for mastering the 214 Kangxi radicals and Chinese vocabulary through structured curriculum lessons, character decomposition, and long-term memory retention powered by an SM-2 Spaced Repetition System (SRS).

---

## 🚀 Trải Nghiệm Nhanh Demo 1-Click Trên GitHub Codespaces (Không Cần Cài Đặt)

### Quy trình 1 bước cực đơn giản:
1. Bấm nút **Open in GitHub Codespaces** ở trên (hoặc qua nút **Code** -> **Codespaces**).
2. Chờ 1-2 phút: GitHub Codespaces tự động khởi tạo máy ảo, kéo container MySQL 8.0, build & chạy Spring Boot 3.3.5 Backend (Flyway tự migrate V1-V19: 214 bộ thủ Khang Hy, 10 bài học 200 từ vựng HSK 1), nạp sẵn 4 tài khoản test RBAC, và khởi chạy Frontend Server cổng 3000. Trình duyệt sẽ tự động mở tab Web App (hoặc xem tab **Ports** trong VS Code / Codespaces, bấm biểu tượng quả địa cầu 🌐 ở cổng **3000**).

### Bảng Tài Khoản Kiểm Thử Mẫu (4 Vai Trò RBAC)

| Vai trò | Email đăng nhập | Mật khẩu | Trang & Tính năng trọng tâm cần trải nghiệm |
| :--- | :--- | :--- | :--- |
| **Learner** (Học viên) | `learner@test.com` | `Password123!` | Tra cứu 214 bộ thủ (`radicals.html`), Luyện viết chữ Hán 3 chế độ (`Demonstrate`, `Practice`, `Test`), Học bài học HSK 1 (`lessons.html`), Học từ vựng (`vocabulary.html`), Dashboard SRS (`srs-dashboard.html`) & Ôn tập thuật toán SM-2 (`srs-review.html`). |
| **Creator** (Giảng viên / Tác giả) | `creator@test.com` | `Password123!` | Quản lý khóa học tác giả (`creator-lessons.html`), Soạn thảo bài giảng (`creator-lesson-editor.html`), Import từ vựng 2 bước qua Excel (`creator-import.html`) & Gửi bài vào hàng đợi duyệt. |
| **Moderator** (Kiểm duyệt viên) | `moderator@test.com` | `Password123!` | Hàng đợi kiểm duyệt bài giảng (`moderator-queue.html`), Xem chi tiết & gắn cờ phản hồi (`moderator-review.html`), Lịch sử duyệt bài & Audit log (`moderator-history.html`). |
| **Admin** (Quản trị viên) | `admin@test.com` | `Password123!` | Trung tâm quản trị tài khoản (`admin-accounts.html`), Phân quyền 4 vai trò (`admin-roles.html`), Quản trị danh mục bài học (`admin-lessons.html`), Quản lý bộ thủ (`admin-radicals.html`) & Từ vựng toàn hệ thống (`admin-vocabulary.html`). |

### Kịch bản kiểm thử nhanh 5 phút (Quick Tour)

1. *Bước 1 (1 phút)*: Đăng nhập `learner@test.com` -> Vào **214 Bộ Thủ** -> Chọn một bộ thủ (ví dụ bộ Nhất 一, bộ Nhân 人) -> Mở modal **Luyện viết chữ Hán**: trải nghiệm Chế độ Xem mẫu nét (Demonstrate) có video YouTube nocookie, Chế độ Luyện tập theo nét (Practice), và Chế độ Tự viết kiểm tra (Test).
2. *Bước 2 (1 phút)*: Vào **Bài Học** -> Chọn Bài 1 (HSK 1: Chào hỏi) -> Xem từ vựng -> Bấm **Bắt đầu ôn tập SRS**: trải nghiệm thuật toán SM-2 (đánh giá 1-5 sao, cập nhật khoảng cách ôn tập tiếp theo).
3. *Bước 3 (1.5 phút)*: Đăng xuất -> Đăng nhập `creator@test.com` -> Vào **Creator Studio** -> Thử tải lên file Excel từ vựng mẫu hoặc tạo bài học mới -> Bấm **Gửi duyệt (Submit for Review)**.
4. *Bước 4 (1 phút)*: Đăng xuất -> Đăng nhập `moderator@test.com` -> Vào **Hàng đợi kiểm duyệt** -> Xem bài học vừa gửi -> Bấm **Duyệt (Approve)** hoặc **Từ chối (Reject)** kèm lý do.
5. *Bước 5 (0.5 phút)*: Đăng nhập `admin@test.com` -> Vào **Quản trị tài khoản & Phân quyền** -> Xem danh sách người dùng, kích hoạt / khóa tài khoản, phân bổ role.

---

## Architecture & Technology Stack

### Backend
- **Runtime & Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.3.5
- **Security**: Spring Security 6, JJWT 0.12.6 (Stateless HMAC-SHA256, mandatory issuer validation, per-account authorization versioning)
- **Persistence**: Spring Data JPA / Hibernate 6, MySQL 8.4 Connector
- **Database Migrations**: Flyway Core (Versioned DDL/DML migrations V1–V19)
- **Validation**: Jakarta Validation / Hibernate Validator
- **Excel Ingestion**: Apache POI (Strict two-phase preview and atomic confirmation)
- **Testing**: JUnit 5, Mockito, Spring Boot Test, Testcontainers (MySQL 8.4)

### Frontend
- **Paradigm**: Zero-Build Modular Vanilla JavaScript (ES Modules, native browser execution)
- **Styling**: Vanilla CSS custom design system (Warm canvas, Cinnabar `#C83C23` accent, Celadon `#1B7A4B` badges, Scholar theme) + Bootstrap 5.3.3 grid & utilities
- **Typography**: Inter, Noto Sans SC, KaiTi (Traditional scholarly calligraphy aesthetic)
- **Accessibility**: WCAG 2.2 Level AA compliance (semantic landmarks, skip navigation, focus management, high contrast ratios)
- **Security Hardening**: Strict Content Security Policy (CSP), subresource integrity (SRI), zero dangerous DOM sinks (`innerHTML`), centralized API client with automatic Bearer token injection

### System Roles (4-Tier RBAC)
1. **Learner**: Public catalog browsing, Kangxi radical lookup, interactive lesson study, SRS flashcard reviews, personal vocabulary notes.
2. **Creator**: Personal lesson authoring, two-phase Excel curriculum import, submission to moderation queue.
3. **Moderator**: Lesson moderation queue review, structured approval/rejection with flagged field feedback and audit logging (`MODERATION_LOG`).
4. **Admin**: User and account management, role assignment, system-wide content governance, audit oversight.

---

## Prerequisites

- **Java Development Kit (JDK)**: Version 21+
- **Apache Maven**: Version 3.9+
- **Node.js**: Version 20+ (for test automation runner)
- **Database**: MySQL 8.4+ (or Docker for Testcontainers)

---

## Quick Start & Local Setup

### 1. Database Configuration

Create the MySQL database:

```sql
CREATE DATABASE elearning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Flyway automatically handles schema generation, seed roles/radicals/curriculum, and migration history (V1–V19) upon Spring Boot startup.

### 2. Backend Startup

Set required environment variables and launch the Spring Boot application:

```bash
cd backend

# Configure environment (example values for local development)
export JWT_SECRET="your-secure-256-bit-minimum-secret-key-for-jwt-signing"
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/elearning_db?useUnicode=true&characterEncoding=utf8mb4&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export SPRING_DATASOURCE_USERNAME="root"
export SPRING_DATASOURCE_PASSWORD="your_password"

# Run application
mvn spring-boot:run
```

The backend REST API will be available at `http://localhost:8080`.

### 3. Frontend Startup

Serve the `frontend/` directory with any static HTTP file server:

```bash
# Using Node.js http-server or Python:
npx serve frontend -p 3000

# Or using Python:
# python -m http.server 3000 --directory frontend
```

Open `http://localhost:3000` in your browser.

---

## Testing & Verification

The repository includes a comprehensive multi-tier test architecture:

```bash
# Frontend Fast Tier (Static + Unit tests, ~2.5s)
npm run verify:frontend:fast

# Frontend Static Analysis (HTML5 semantics, SRI, DOM sinks, CSS tokens)
npm run verify:frontend:static

# Frontend Unit Tests (State machines, API client, SRS calculation, forms)
npm run verify:frontend:unit

# Frontend Accessibility Audit (WCAG 2.2 AA via Playwright / Chromium)
npm run verify:frontend:a11y

# Backend Unit & Controller Slices (No external database required)
cd backend
mvn test "-Dtest=*ServiceTests,*ControllerTests,*DtoTests,JwtUtilTests,ApiResponseTests"

# Full Backend Suite (Requires Docker for MySQL 8.4 Testcontainers)
mvn clean test

# Postman REST API Suite via Newman CLI (83 automated requests across 11 modules)
npx newman run tests/postman/elearning-api.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  --reporters cli
```

For manual Postman execution, import `tests/postman/elearning-api.postman_collection.json` and `tests/postman/local.postman_environment.json`. See [tests/postman/README.md](tests/postman/README.md) for detailed documentation and test account fixtures.

---

## Repository Structure

```
├── backend/                       # Java 21, Spring Boot 3.3.5 REST API, JPA, Flyway V1–V19
│   ├── src/main/java/             # Domain logic, controllers, services, security, DTOs
│   ├── src/main/resources/        # Configuration and db/migration/V1__...V19__ migrations
│   └── src/test/java/             # Unit, slice, and Testcontainers integration tests
├── frontend/                      # Zero-build Vanilla JS, CSS, native ES Modules
│   ├── js/                        # API client, auth state, UI components, page controllers
│   ├── css/                       # Design system styles and Scholar theme tokens
│   └── *.html                     # Semantic HTML5 entry points (WCAG 2.2 AA)
├── tests/                         # Multi-tier verification suites
│   ├── postman/                   # Postman Collection v2.1 (83 requests), fixtures, README
│   ├── frontend/                  # Static analysis, unit tests, and browser runners
│   └── fullstack/                 # End-to-end integration and API test scenarios
├── .agents/                       # Architectural guardrails, constraints, and source of truth
└── README.md                      # Project documentation and quick start guide
```

---

## 🎙️ Hệ Thống Phân Tích Phát Âm & Thanh Điệu (Chao 5-Scale Tone Sandhi Engine)

Tính năng **Luyện đọc** (Reading Mode) trong phiên ôn tập SRS (`srs-review.html?mode=reading`) cho phép người học ghi âm giọng đọc chữ Hán và nhận đánh giá ngữ âm chi tiết:

### 1. Kiến trúc & Công nghệ Mã Nguồn Mở
- **Mô hình**: 100% Offline Acoustic & Tone Sandhi Model (Chao 5-scale Tone Sandhi Engine) chạy cục bộ qua microservice Python FastAPI (`speech-service/`).
- **Phân tích âm học**: Trích xuất đường cao độ F0 (Pitch Contour), phân đoạn âm tiết và đối chiếu theo thang ngũ độ Triệu Nguyên Nhiệm (Chao 5-scale: 55, 35, 214, 51, thanh nhẹ và biến điệu 3+3, 不, 一).
- **Phân tích ngữ âm đa chiều**: Đánh giá điểm tổng quan (0–100), mức tin cậy, nhận xét tiếng Việt chi tiết cho **thanh mẫu (initials)**, **vận mẫu (finals)**, **thanh điệu (tones)**, và lời khuyên cải thiện cụ thể.

### 2. Nguyên Tắc Vận Hành & An Toàn Dữ Liệu
> [!IMPORTANT]
> - **100% Mã nguồn mở & Không chi phí**: Không phụ thuộc vào bất kỳ dịch vụ đám mây hay API trả phí nào.
> - **Xử lý trung thực**: Khi âm thanh không đủ điều kiện (nhiễu, im lặng, clipping) hoặc microservice chưa sẵn sàng, hệ thống trả về thông báo rõ ràng (`not_scorable` / `engine_unavailable`), tuyệt đối không tạo điểm giả.
> - **Chính sách Zero-Storage Audio**: Bản ghi âm chỉ được xử lý tạm thời trong bộ nhớ RAM và giải phóng ngay lập tức sau phân tích, không lưu file âm thanh vào cơ sở dữ liệu hay ổ cứng máy chủ.

### 3. Hướng dẫn Khởi chạy Speech Service Cục bộ
Để kích hoạt tính năng Luyện đọc trên môi trường phát triển:
1. Cài đặt các gói phụ thuộc Python cho speech service:
   ```bash
   cd speech-service
   pip install -r requirements.txt
   ```
2. Khởi chạy microservice FastAPI (cổng 8000):
   ```bash
   python -X utf8 run_service.py
   ```
3. Kiểm tra trạng thái sẵn sàng qua endpoint:
   `GET http://127.0.0.1:8000/health` -> trả về `{ "status": "READY", "engine": "local-acoustic-f0-tone", "model": "Chao-5-Scale Tone Sandhi Engine" }`.

### 4. Duy Trì 24/7 Warm State với UptimeRobot (Render Free Tier)
Trên môi trường triển khai Render Free Tier, các dịch vụ web sẽ tự động đi vào trạng thái ngủ đông (sleep) sau 15 phút không nhận được yêu cầu. Để đảm bảo 100% Warm State và phản hồi ngay lập tức (0s delay) cho người học:
1. **Thiết lập 2 HTTP Monitor độc lập trên [UptimeRobot](https://uptimerobot.com) (Gói Free, chu kỳ 5 phút):**
   - **Monitor 1 (Backend):** `https://<YOUR_BACKEND_DOMAIN>.onrender.com/actuator/health` (Spring Boot Actuator probe công khai, trả về HTTP 200 `{"status":"UP"}`).
   - **Monitor 2 (Speech Service):** `https://speech-service-3l49.onrender.com/health` (FastAPI Chao tone engine probe công khai, trả về HTTP 200 `{"status":"READY"}`).
2. **Cơ chế hoạt động:**
   - Mỗi yêu cầu ping 5 phút một lần sẽ tự động reset bộ đếm 15 phút của Render về 0.
   - Giúp cả hai container `elearning-backend` và `speech-service` duy trì thường trực trên RAM, ngăn chặn hoàn toàn hiện tượng spin-up 30–50s.
   - Chi tiết từng bước cài đặt xem tại [DEPLOYMENT_FREE_TIER.md (Mục 7)](./DEPLOYMENT_FREE_TIER.md#7-thiết-lập-uptimerobot-giữ-ấm-247-prevent-render-sleep--guarantee-0s-latency).

---

## Security Architecture

- **Stateless Authentication**: Pure JWT authentication without server sessions. Tokens bind to account status and `authorization_version` for instant session revocation upon role alteration or suspension.
- **Zero Client Trust**: All authorization checks are enforced server-side. User identity is extracted strictly from `SecurityContextHolder`, never accepted from request parameters or payloads (IDOR prevention).
- **Adversarial Input Sanitization**: Text and audio URLs undergo strict sanitization to prevent Stored and DOM-based Cross-Site Scripting (XSS).
- **Environment Driven**: Zero hardcoded secrets, database passwords, or JWT keys exist in source code or default configuration files.

---

## Project Specifications & Standards

Detailed architectural documentation, security policies, and engineering constraints are tracked in:
- `.agents/SOURCE_OF_TRUTH.md`: Order of authority, architecture invariants, and verification baselines
- `.agents/rules/project-constraints.md`: Non-negotiable technology stack and database boundaries
- `.agents/rules/engineering-guardrails.md`: Engineering safety rules and coding conventions
- `tests/postman/README.md`: REST API specifications, Postman collection structure, and test execution
- `SECURITY.md`: Security policy, vulnerability reporting, and baseline controls

---

## License

This project is private and proprietary. All rights reserved.
