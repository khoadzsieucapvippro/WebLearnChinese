# WebLearnChinese — Nền Tảng Học Bộ Thủ & Từ Vựng Tiếng Trung với SRS

[![Live Demo on GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://khoadzsieucapvippro.github.io/WebLearnChinese/)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-940%20PASS-brightgreen?style=for-the-badge)](docs/TESTING.md)
[![E2E Tests](https://img.shields.io/badge/E2E%20Regression-74%2F74%20PASS-brightgreen?style=for-the-badge)](docs/TESTING.md)
[![Database Migrations](https://img.shields.io/badge/Flyway-V1..V30-blue?style=for-the-badge)](docs/ARCHITECTURE.md)

**WebLearnChinese** là nền tảng học chữ Hán và tiếng Trung toàn diện, tập trung vào **214 Bộ thủ Khang Hy** và **1,000 từ vựng chuẩn HSK 1–3 (HSK 3.0 Standard)**. Hệ thống kết hợp phân rã cấu trúc chữ Hán, mô phỏng viết từng nét (HanziWriter), phân tích cao độ thanh điệu (Chao 5-scale Tone Sandhi DSP), cùng thuật toán lặp lại ngắt quãng **SM-2 (Spaced Repetition System)** giúp tối ưu hóa khả năng ghi nhớ dài hạn.

---

## 🌟 Trải Nghiệm Trực Tiếp (Live Demo & Test Accounts)

- **Đường link trải nghiệm 24/7**: [https://khoadzsieucapvippro.github.io/WebLearnChinese/](https://khoadzsieucapvippro.github.io/WebLearnChinese/)
- Trực quan, chạy trực tiếp trên GitHub Pages với cơ chế **Smart Zero-Backend Fallback**, tải ngay trong 0 giây và không bao giờ lỗi kết nối.

### Bảng 4 Tài Khoản Kiểm Thử Mẫu (Mật khẩu chung: `Password@123`)

| Vai trò (Role) | Email đăng nhập | Mật khẩu chung | Các chức năng chính |
| :--- | :--- | :--- | :--- |
| **Học viên (Learner)** | `learner@gmail.com`<br>`learner@elearning.local` | `Password@123` | Tra cứu 214 Bộ thủ, 1,068 từ vựng HSK, luyện viết chữ Hán, ôn tập Flashcard SRS 4 kỹ năng, ghi chú cá nhân |
| **Biên soạn (Creator)** | `creator@gmail.com`<br>`creator@elearning.local` | `Password@123` | Soạn giáo trình, nhập từ vựng từ Excel 2 bước, sắp xếp bài học, gửi duyệt nội dung |
| **Kiểm duyệt (Moderator)** | `moderator@gmail.com`<br>`moderator@elearning.local` | `Password@123` | Quản lý hàng đợi duyệt, kiểm duyệt chi tiết bài học, phê duyệt / từ chối kèm lý do, xem lịch sử duyệt |
| **Quản trị (Admin)** | `admin@gmail.com`<br>`admin@elearning.local` | `Password@123` | Quản trị tài khoản, phân quyền 4 vai trò RBAC, quản lý bộ thủ / từ vựng toàn hệ thống, tra cứu Audit Log |

---

## 🏗️ Kiến Trúc Tổng Quan (High-Level Architecture)

- **Frontend**: Zero-Build Vanilla JavaScript (ES2022 Native Modules), 25 trang semantic HTML5, CSS custom properties (phông CJK `Noto Sans SC`, màu Scholarly Cinnabar `#8B2635`), an toàn DOM chống XSS và mã hóa SRI.
- **Backend**: Java 21, Spring Boot 3.3.5 REST API, Spring Security với cơ chế Stateless JWT RBAC, Spring Data JPA / Hibernate (`ddl-auto: none`), Flyway migration engine (V1..V30 baseline).
- **Speech Service**: Microservice Python 3.11 FastAPI, xử lý âm thanh offline theo thang đo cao độ Chao 5-scale và tone sandhi, kết nối an toàn với Backend qua `X-Internal-Token`.
- **Cơ sở dữ liệu**: MySQL 8.0+ / TiDB Cloud Serverless (5GB lưu trữ miễn phí, TLS bắt buộc, collation `utf8mb4_unicode_ci`, khóa chính phi phân cụm non-clustered PK).
- **Giữ ấm dịch vụ 24/7**: Cấu hình UptimeRobot tự động gửi HTTP probe mỗi 5 phút đến `/actuator/health` và `/health` để ngăn chặn Render Free Tier rơi vào trạng thái ngủ (Sleep).

---

## 🚀 Khởi Chạy Nhanh Dự Án Cục Bộ (Quick Start)

### Yêu Cầu Cài Đặt
- Java JDK 21+ & Maven 3.9+
- Node.js 18+ (khuyên dùng Node 20 LTS)
- Python 3.11+ (cho Speech Service)
- MySQL 8.0+ (trên cổng 3306) hoặc Docker Desktop

### Cách 1: 1-Click trên Windows
```cmd
.\run.bat
```
Script sẽ tự động khởi động Speech Service (cổng 8000), Backend Spring Boot (cổng 8080) và mở giao diện Web tại `http://localhost:3000`.

### Cách 2: Sử dụng Docker Compose
```bash
docker compose up -d
npm run serve
```

### Cách 3: Lệnh Kiểm Thử Quan Trọng
```bash
# 1. Chạy 940 bài kiểm thử frontend nhanh (Static + Unit):
npm run verify:frontend:fast

# 2. Chạy 74 bài kiểm thử E2E Hộp Đen (Tiers 1–4):
node tests/e2e/runner.mjs --tier=all

# 3. Chạy kiểm thử Backend Spring Boot (yêu cầu Docker cho Testcontainers):
mvn -f backend/pom.xml test
```

---

## 📚 Hệ Thống Tài Liệu Kỹ Thuật (Documentation Sitemap)

Để tìm hiểu sâu hơn về từng phân hệ, vui lòng tham khảo các tài liệu chuyên môn:

- 🏛️ **[Kiến Trúc Hệ Thống (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: Chi tiết topology thành phần, mô hình phân rã bộ thủ, cỗ máy SRS SM-2, hệ thống Audit Log và sơ đồ ERD database.
- 💻 **[Cẩm Nang Phát Triển (docs/DEVELOPMENT.md)](docs/DEVELOPMENT.md)**: Hướng dẫn chi tiết thiết lập môi trường, cấu hình local `application-local.yml`, coding standards và bản đồ mã nguồn.
- 🧪 **[Cẩm Nang Kiểm Thử (docs/TESTING.md)](docs/TESTING.md)**: Đặc tả tháp kiểm thử đa tầng, hướng dẫn chạy các bộ test L0–L4, ma trận kịch bản E2E và hướng dẫn chẩn đoán lỗi.
- ☁️ **[Hướng Dẫn Triển Khai 100% Free-Tier (docs/DEPLOYMENT.md)](docs/DEPLOYMENT.md)**: Toàn bộ quy trình triển khai lên GitHub Pages, Render Free Services, TiDB Cloud Serverless và UptimeRobot.
- 📖 **[Danh Mục Giáo Trình 50 Bài Học (docs/curriculum-manifest.md)](docs/curriculum-manifest.md)**: Bản kiểm kê chi tiết 50 bài học chuẩn hoá HSK 1–3 (1,000 từ vựng) và 214 Bộ thủ Khang Hy.
- 🛡️ **[Chính Sách Bảo Mật (SECURITY.md)](SECURITY.md)**: Quy trình báo cáo lỗ hổng có trách nhiệm và các bất biến an ninh nền tảng.
- 🤖 **[Quy Tắc Coding Agent (AGENTS.md)](AGENTS.md)**: Các bất biến kỹ thuật, quy tắc migration và lệnh chuẩn cho AI Coding Agents.
