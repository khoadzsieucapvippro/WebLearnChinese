# Hướng Dẫn Kiểm Thử Toàn Diện (Testing Guide)

Tài liệu này là đặc tả đầy đủ về chiến lược kiểm thử, cấu trúc các tầng test, các lệnh thực thi và cẩm nang chẩn đoán lỗi trong dự án **WebLearnChinese**.

---

## 1. Triết Lý Kiểm Thử (Testing Philosophy)

- **Hộp đen & Hướng yêu cầu (Opaque-Box & Requirement-Driven)**: Các kịch bản kiểm thử độc lập với mã nguồn cài đặt nội bộ, tập trung vào hành vi thực tế của hệ thống đối với 4 vai trò người dùng (Learner, Creator, Moderator, Admin).
- **Hồi quy tích lũy nhanh (Fast Cumulative Regression)**: Bộ kiểm thử frontend và E2E được tối ưu hóa thực thi trong vài giây, ngăn chặn triệt để hiện tượng hồi quy mã nguồn.
- **Không dung thứ cho kết quả giả mạo (Zero False Passes)**: Mọi kết quả kiểm thử đều phải được thực thi trực tiếp qua lệnh runner và có bằng chứng định lượng rõ ràng.

---

## 2. Tháp Kiểm Thử Đa Tầng (Test Pyramid)

```text
[Tầng 4] Kịch bản Thực tế & E2E Workloads (Tiers 1–4, 74 tests)
             ↑
[Tầng 3] Kiểm thử Trực quan & Accessibility (WCAG 2.2 SC 2.4.1, SC 2.5.8)
             ↑
[Tầng 2] Browser Smoke & Layout 25 Trang (Headless Chromium, Mobile 375px)
             ↑
[Tầng 1] Unit & Contract Tests (API Client, Auth State, SRS SM-2, Form Validation)
             ↑
[Tầng 0] Static Invariants (Strict CSP, SRI Hashes, Safe DOM Sinks, CSS Tokens)
```

---

## 3. Danh Mục Lệnh Kiểm Thử Chuẩn (Verification Commands)

Thực thi tất cả các lệnh từ thư mục gốc của repository:

### 3.1. Kiểm thử Frontend & Logic (Node.js Runner)
```bash
# 1. Chạy tầng kiểm thử nhanh (L0 Static + L1 Unit: 940 tests) — ~8 giây
npm run verify:frontend:fast

# 2. Chạy riêng tầng kiểm tra bất biến tĩnh (L0 Static: 224 tests) — ~0.6 giây
npm run verify:frontend:static

# 3. Chạy riêng tầng kiểm thử đơn vị & contracts (L1 Unit: 716 tests) — ~7 giây
npm run verify:frontend:unit

# 4. Chạy kiểm thử trình duyệt thực tế (L2 Browser Smoke)
npm run verify:frontend:browser

# 5. Chạy kiểm thử khả năng tiếp cận WCAG 2.2 AA (L3 Accessibility)
npm run verify:frontend:a11y

# 6. Chạy toàn bộ cổng kiểm duyệt frontend (L0 + L1 + L2 + L3)
npm run verify:frontend:gate

# 7. Chạy bộ kiểm thử hồi quy đầy đủ
npm run verify:frontend
```

### 3.2. Kiểm thử E2E Hộp Đen Nghiệp Vụ (Opaque-Box E2E Runner)
```bash
# Chạy toàn bộ 74 test cases qua 4 Tiers (Tier 1 đến Tier 4) — ~0.75 giây
node tests/e2e/runner.mjs --tier=all

# Chạy riêng từng Tier:
node tests/e2e/runner.mjs --tier=1   # Feature Coverage (F1–F20)
node tests/e2e/runner.mjs --tier=2   # Boundary & Corner Cases
node tests/e2e/runner.mjs --tier=3   # Cross-Feature Combinations
node tests/e2e/runner.mjs --tier=4   # Real-World Workloads
```

### 3.3. Kiểm thử Backend Spring Boot (Maven)
```bash
# Chạy toàn bộ bộ test backend (yêu cầu Docker daemon đang chạy cho Testcontainers)
mvn -f backend/pom.xml test

# Chạy riêng các unit tests (không phụ thuộc Testcontainers)
mvn -f backend/pom.xml test -Dtest=*Test,!*IntegrationTest*,!*IT
```

### 3.4. Kiểm thử REST API (Postman Collection)
Chi tiết xem tại `tests/postman/README.md`. Bộ Postman v2.1 bao gồm **83 requests nghiêm ngặt** chia thành 11 module kiểm tra: Health, Auth/RBAC, Radical Catalog, Vocabulary Catalog, Curriculum Lessons, Creator Import (Excel 2 bước), Moderator Queue, SRS Reviews, User Profile, Personal Notes, và Management Audit Log.

---

## 4. Ma Trận Kiểm Thử E2E 4 Tầng (Tiers 1–4 Matrix)

| Tier | Tên Tầng | Phạm vi Trọng tâm | Số Tests | Thời gian |
|:---:|:---|:---|:---:|:---:|
| **Tier 1** | **Feature Coverage (F1–F20)** | Vô hiệu hóa seeder trên Prod, fail-fast JWT secret, cảnh báo demo fallback, cấm tự duyệt bài, bảo vệ Admin cuối cùng, giới hạn thẻ SRS [1..100], hệ thống Audit Log (migration, entity, sanitizer, REST API, UI), điều hướng khu vực quản lý, đổi mật khẩu. | 32 | ~0.15s |
| **Tier 2** | **Boundary & Corner Cases** | Giới hạn độ dài JWT (31 vs 32 byte), đếm byte UTF-8, biên giới hạn thẻ SRS (0, 1, 100, 101, NaN), khóa bi quan chống race condition khi hạ quyền 2 Admin đồng thời, khử trừ sâu 6 cấp nhạy cảm trong Audit Log, mật khẩu 5 vs 6 ký tự. | 30 | ~0.16s |
| **Tier 3** | **Cross-Feature Combinations** | Creator tự duyệt bài bị chặn kèm ghi log thất bại; Hạ quyền Admin cuối cùng thất bại kèm ghi log; Phân quyền khu vực quản lý kết hợp RBAC API; Đổi mật khẩu kèm kiểm tra không rò rỉ Web Storage; Hoàn tác thay đổi cấu hình SRS. | 6 | ~0.12s |
| **Tier 4** | **Real-World Workloads** | Scenario 1: Vòng đời Creator - Moderator soạn và duyệt bài;<br>Scenario 2: Race condition hạ quyền 2 Admin đồng thời;<br>Scenario 3: Cách ly giao diện học viên và quản trị;<br>Scenario 4: Chu trình cập nhật thông tin và đổi mật khẩu;<br>Scenario 5: Toàn bộ vòng đời kiểm toán tài nguyên Admin;<br>Scenario 6: Khởi động container an toàn trong môi trường Production. | 6 | ~0.12s |
| **TỔNG** | **All Tiers (1–4)** | **Bộ kiểm thử hồi quy hộp đen hoàn chỉnh** | **74** | **~0.75s** |

---

## 5. Chẩn Đoán Lỗi & Xử Lý Sự Cố (Troubleshooting)

### 5.1. Lỗi Testcontainers khi chạy `mvn test`: `Could not find a valid Docker environment`
- **Nguyên nhân**: Các bài kiểm thử tích hợp backend (`*IntegrationTests`) sử dụng Testcontainers để tự động kéo container MySQL 8.0 nhằm đảm bảo môi trường cô lập. Nếu Docker Desktop hoặc Docker daemon chưa chạy trên máy, Testcontainers sẽ báo lỗi.
- **Khắc phục**:
  1. Khởi động Docker Desktop trước khi chạy `mvn test`.
  2. Hoặc nếu muốn kiểm thử nhanh logic mà không cần Docker:
     ```bash
     mvn -f backend/pom.xml test -Dtest=*Test,!*IntegrationTest*,!*IT
     ```

### 5.2. Lỗi Static CSP Audit: `Policy Specification Compliance`
- **Nguyên nhân**: Thêm domain hoặc tài nguyên ngoại vi vào HTML mà chưa cập nhật đồng bộ thẻ `<meta http-equiv="Content-Security-Policy">` trên toàn bộ 25 tệp HTML tại `frontend/*.html`.
- **Khắc phục**: Đảm bảo tất cả 25 tệp HTML có directive CSP giống nhau và cập nhật `tests/frontend/static/csp-resource-graph.test.mjs` nếu có chính sách nguồn tin cậy mới.

### 5.3. Lỗi DOM Sinks Policy: `prohibits dangerous execution sinks in JS`
- **Nguyên nhân**: Đoạn mã JavaScript mới chứa `innerHTML`, `outerHTML` hoặc gán thuộc tính `onclick`.
- **Khắc phục**: Chuyển sang sử dụng các phương thức DOM chuẩn: `document.createElement()`, `element.textContent`, và `element.addEventListener('click', ...)`.
