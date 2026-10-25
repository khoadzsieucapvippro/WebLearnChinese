# Postman REST API Test Suite

Bộ tài liệu và kiểm thử tự động API bằng Postman dành cho nền tảng E-Learning (214 Bộ thủ Khang Hy, Từ vựng HSK, Hệ thống lặp lại ngắt quãng SM-2 SRS, Phân quyền RBAC 4 vai trò, Quản trị nội dung và Nhập giáo trình Excel hai bước).

---

## 1. Cấu trúc thư mục

```
tests/postman/
├── elearning-api.postman_collection.json  # Postman Collection v2.1 (83 requests nghiêm ngặt)
├── local.postman_environment.json        # Postman Environment cấu hình biến local
├── generate-collection.mjs              # Script khởi tạo/cập nhật collection tự động
├── README.md                             # Hướng dẫn chi tiết import, cấu hình và chạy
└── fixtures/                             # Dữ liệu mẫu kiểm thử và test accounts
    ├── seed-test-accounts.sql            # Script SQL khởi tạo tài khoản test an toàn, idempotent
    ├── seed-test-accounts.mjs            # Gated runner Node.js (yêu cầu opt-in ALLOW_TEST_SEED=true & whitelist DB)
    ├── test-rate-limiter.mjs             # Script kiểm thử cô lập cơ chế Rate Limiter (HTTP 429)
    ├── sample-curriculum-valid.xlsx      # File Excel giáo trình chuẩn 5 từ vựng
    ├── sample-curriculum-invalid.xlsx    # File Excel lỗi thiếu trường bắt buộc
    └── sample-curriculum-bad-headers.xlsx# File Excel sai cấu trúc cột tiêu đề
```

---

## 2. Chuẩn bị tài khoản kiểm thử (Gated Test Fixtures)

Trên một cơ sở dữ liệu mới khởi tạo (với toàn bộ Flyway migration V1–V30), hệ thống khởi tạo 4 vai trò mặc định cùng 214 bộ thủ Khang Hy, 50 bài học giáo trình và danh mục từ vựng HSK. Để phục vụ kiểm thử môi trường local/test một cách an toàn và có thể tái lập:

```bash
# Cách 1: Chạy runner an toàn qua Node.js (yêu cầu opt-in tường minh, chỉ cho phép localhost & whitelist DB)
ALLOW_TEST_SEED=true node tests/postman/fixtures/seed-test-accounts.mjs

# Trên Windows PowerShell:
$env:ALLOW_TEST_SEED="true"; node tests/postman/fixtures/seed-test-accounts.mjs; Remove-Item Env:\ALLOW_TEST_SEED

# Cách 2: Nạp trực tiếp qua MySQL CLI
mysql -u root elearning_db < tests/postman/fixtures/seed-test-accounts.sql
```

### Đặc tính an toàn của Fixture:
- **Rào chắn môi trường (Safety Gates)**: Yêu cầu biến môi trường opt-in `ALLOW_TEST_SEED=true` hoặc `NODE_ENV=test/local`. Từ chối thực thi fail-closed nếu thiếu cấu hình hoặc phát hiện cờ production. Kiểm tra whitelist tên database (`elearning_db`, `elearning_test_db`, `elearning_dev`).
- **100% Idempotent**: Sử dụng `INSERT ... SELECT ... WHERE NOT EXISTS`, không bao giờ ghi đè hay xóa dữ liệu người dùng có sẵn.
- **Tự động đối soát (Reconciliation)**: Nếu tài khoản kiểm thử đã tồn tại nhưng thiếu vai trò hoặc mật khẩu bị sửa, fixture tự động cập nhật về trạng thái `Active` và mật khẩu `Password123!`.
- **Tuân thủ mã hóa**: Sử dụng chuẩn băm BCrypt (`$2a$10$UPN3ubt5uNRTKHbXcMsEgOjsd70AqQ.EMiekc6.7ngAuynlOFuFCm`) tương thích tuyệt đối với `PasswordEncoder` của Spring Security cho mật khẩu `Password123!`.
- **Phân định rõ ràng**:
  - `admin@test.com`: Vai trò `Learner`, `Admin`
  - `moderator@test.com`: Vai trò `Learner`, `Moderator`
  - `creator@test.com`: Vai trò `Learner`, `Creator`
  - `learner@test.com`: Vai trò `Learner`
- **Tuyệt đối bảo mật**: Không in mật khẩu, hash hay token ra log.

---

## 3. Danh mục phân hệ & số lượng request (83 Requests Nghiêm ngặt)

| STT | Phân hệ (Folder) | Số request | Phạm vi kiểm thử chính |
| :--- | :--- | :---: | :--- |
| **00** | **Health & System Probe** | 1 | Probe kiểm tra trạng thái vận hành `/actuator/health` (HTTP 200, status `UP`). |
| **01** | **Authentication & RBAC Baseline** | 9 | Đăng ký học viên mới (201), kiểm tra trùng email (409), thiếu trường bắt buộc (400), đăng nhập các vai trò Learner, Creator, Moderator, Admin (200), mật khẩu sai (401 Unauthorized nghiêm ngặt), payload rỗng (400). |
| **02** | **Kangxi Radicals Catalog** | 3 | Tra cứu danh mục 214 bộ thủ phân trang (200), tra cứu chi tiết bộ thủ theo ID (200), bắt lỗi 404 cho ID không tồn tại. |
| **03** | **Chinese Vocabulary Catalog** | 5 | Tra cứu từ vựng phân trang (200), tìm kiếm theo từ khóa (200), lọc theo cấp độ HSK (200), chi tiết từ vựng kèm bộ thủ cấu thành (200), bắt lỗi 404 cho ID không tồn tại. |
| **04** | **Public Lessons Catalog** | 3 | Danh mục bài học công khai (chỉ hiển thị trạng thái `Approved`), chi tiết bài học kèm từ vựng sắp xếp theo `orderIndex`, bắt lỗi 404 cho ID không tồn tại. |
| **05** | **User Profile & Settings** | 7 | Xem hồ sơ cá nhân (200), cập nhật thông tin cá nhân (200), từ chối khi không có token (401), từ chối khi token sai định dạng (401), xem cấu hình học tập SRS (200), cập nhật cấu hình SRS (200), bắt lỗi 400 khi tham số SRS không hợp lệ. |
| **06** | **Personal Vocabulary Notes** | 4 | Danh sách ghi chú cá nhân theo từ vựng (200), tạo ghi chú mới (201), cập nhật nội dung ghi chú (200), xóa ghi chú (200). |
| **07** | **Spaced Repetition System (SRS)** | 6 | Lấy danh sách thẻ đến hạn ôn tập (200), lấy thẻ học mới theo bài học (200), lấy danh sách thẻ luyện tập tự do (200), nộp kết quả ôn tập thuật toán SM-2 (200), bắt lỗi 400 khi rating ngoài khoảng 1..4, thống kê phiên học (200). |
| **08** | **Creator Studio & Curriculum Authoring** | 22 | Tạo bài học nháp `Draft` (201), danh sách bài học tác giả (200), chi tiết bài học (200), sửa tiêu đề bài học (200), thêm từ vựng 1 và 2 (200), sắp xếp lại thứ tự từ vựng (200), xóa từ vựng (200), nộp bài học kiểm duyệt `Pending` (200), RBAC Learner bị chặn (403), **Xem trước file Excel import hợp lệ (200, isValid: true)**, **Xem trước file Excel sai cột tiêu đề (200, HEADER_ERROR)**, **Xem trước không có token (401)**, **Xác nhận import tạo bài học mới (201)**, **Xác nhận import tiêu đề rỗng (400)**, **Xác nhận import file sai định dạng (422)**, **Xóa bài học import (204)**, **Tạo bài học nháp test xóa (201)**, **Xóa bài học nháp thành công (204)**, **Xác nhận bài học đã xóa trả về 404**, **Xóa bài học ID không tồn tại (404)**, **Learner xóa bài học bị chặn (403)**. |
| **09** | **Content Moderation & Quality Review** | 9 | Danh sách hàng đợi chờ duyệt `Pending` (200), chi tiết bài học chờ duyệt (200), từ chối bài học kèm lý do và cờ phản hồi (200), tác giả nộp lại bài sau chỉnh sửa (200), phê duyệt bài học sang `Approved` (200), **Tác giả cố tình xóa bài học đã duyệt bị chặn (409 Conflict)**, lịch sử kiểm duyệt `MODERATION_LOG` (200), RBAC Learner bị chặn (403), RBAC Creator bị chặn (403). |
| **10** | **System Administration & Content Governance** | 14 | Quản lý danh sách tài khoản (200), danh mục vai trò hệ thống (200), cập nhật trạng thái tài khoản (200), phân quyền tài khoản (200), giám sát bài học toàn hệ thống (200), CRUD bộ thủ Khang Hy (201, 200, 204), CRUD từ vựng (201, 200, 204), RBAC Learner bị chặn (403), RBAC Moderator bị chặn (403), RBAC Creator bị chặn (403). |
| **Tổng** | | **83** | **Toàn diện 100% các REST controllers, multipart file imports, deletion và security boundaries** |

---

## 4. Biến môi trường (Environment Variables)

File `local.postman_environment.json` định nghĩa các biến:

| Tên biến | Kiểu | Giá trị mặc định | Mục đích |
| :--- | :--- | :--- | :--- |
| `baseUrl` | default | `http://localhost:8080` | URL gốc của backend REST API |
| `adminEmail` | default | `admin@test.com` | Tài khoản quản trị viên kiểm thử |
| `adminPassword` | secret | `Password123!` | Mật khẩu tài khoản quản trị |
| `creatorEmail` | default | `creator@test.com` | Tài khoản tác giả nội dung kiểm thử |
| `creatorPassword` | secret | `Password123!` | Mật khẩu tác giả |
| `moderatorEmail` | default | `moderator@test.com` | Tài khoản kiểm duyệt viên kiểm thử |
| `moderatorPassword` | secret | `Password123!` | Mật khẩu kiểm duyệt viên |
| `learnerEmail` | default | `learner@test.com` | Tài khoản học viên kiểm thử tiêu chuẩn |
| `learnerPassword` | secret | `Password123!` | Mật khẩu học viên tiêu chuẩn |
| `learnerToken` | secret | *(Tự động trích xuất)* | JWT Bearer token của học viên sau khi đăng ký hoặc đăng nhập |
| `creatorToken` | secret | *(Tự động trích xuất)* | JWT Bearer token của tác giả sau khi đăng nhập |
| `moderatorToken` | secret | *(Tự động trích xuất)* | JWT Bearer token của kiểm duyệt viên sau khi đăng nhập |
| `adminToken` | secret | *(Tự động trích xuất)* | JWT Bearer token của quản trị viên sau khi đăng nhập |
| `learnerAccountId` | default | *(Tự động trích xuất)* | ID tài khoản học viên để kiểm thử Admin quản lý |
| `createdNoteId` | default | *(Tự động trích xuất)* | ID ghi chú được tạo để kiểm thử PUT / DELETE |
| `createdLessonId` | default | *(Tự động trích xuất)* | ID bài học nháp được tạo để kiểm thử quy trình Creator / Moderator |
| `importedLessonId` | default | *(Tự động trích xuất)* | ID bài học được tạo qua quy trình import Excel |
| `lessonToDeleteId` | default | *(Tự động trích xuất)* | ID bài học nháp dành riêng cho kiểm thử xóa bài học |
| `createdRadicalId` | default | *(Tự động trích xuất)* | ID bộ thủ được tạo bởi Admin để kiểm thử PUT / DELETE |
| `createdVocabId` | default | *(Tự động trích xuất)* | ID từ vựng được tạo bởi Admin để kiểm thử PUT / DELETE |

---

## 5. Hướng dẫn sử dụng

### 5.1. Import vào Postman Desktop hoặc Postman Web

1. Mở ứng dụng **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái.
3. Kéo thả hoặc chọn 2 tệp:
   - `tests/postman/elearning-api.postman_collection.json`
   - `tests/postman/local.postman_environment.json`
4. Ở góc trên bên phải của Postman, chuyển môi trường hoạt động sang **Local Environment (Spring Boot 8080)**.
5. Đảm bảo ứng dụng Spring Boot đang chạy tại `http://localhost:8080`.
6. Mở collection, chọn **Run collection** để chạy tuần tự theo thứ tự folder từ 00 đến 10.

### 5.2. Chạy tự động qua Newman CLI

Dự án hỗ trợ chạy không cần giao diện thông qua Newman:

```bash
# Chạy toàn bộ 83 requests chức năng tự động (100% assertions nghiêm ngặt)
npx newman run tests/postman/elearning-api.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  --reporters cli

# Chạy kiểm thử cô lập cơ chế Rate Limiter (HTTP 429 Too Many Requests)
node tests/postman/fixtures/test-rate-limiter.mjs
```

Nếu muốn xuất báo cáo HTML:
```bash
npx newman run tests/postman/elearning-api.postman_collection.json \
  -e tests/postman/local.postman_environment.json \
  --reporters cli,html --reporter-html-export tests/postman/report.html
```

---

## 6. Đặc điểm kỹ thuật & Chuẩn kiểm thử

- **Không hard-code token**: Các token (`learnerToken`, `creatorToken`, `moderatorToken`, `adminToken`) được tự động trích xuất từ phản hồi đăng nhập/đăng ký qua Post-response Script.
- **Tránh xung đột dữ liệu**: Các request tạo mới tài khoản sử dụng Pre-request Script sinh email duy nhất dạng `learner_pm_<timestamp>@test.com`.
- **Dọn dẹp tài nguyên**: Các request tạo dữ liệu tạm thời (Radical, Vocabulary, Personal Note, Lesson Nháp, Lesson Import) đều có bước xóa (DELETE) tương ứng ở cuối quy trình để bảo toàn tính toàn vẹn của cơ sở dữ liệu.
- **Quy trình nhập Excel hai bước**:
  - Bước 1 (Preview): Upload file `.xlsx`, parse bằng Apache POI, kiểm tra schema cột, đếm từ mới / từ đã có trong từ điển, kiểm tra tính hợp lệ mà không sửa đổi database.
  - Bước 2 (Confirm): Upload file `.xlsx` kèm `title`, khởi tạo `Lesson` trong trạng thái `Draft`, tự động liên kết các từ vựng theo đúng thứ tự hiển thị.
- **Kiểm thử xóa bài học chuyên sâu**: Kiểm tra toàn diện các khía cạnh: xóa thành công bài học `Draft` (204 No Content), xác nhận bài học biến mất (404), xóa ID không tồn tại (404), học viên không có quyền xóa (403), và tác giả bị cấm xóa bài học đã duyệt `Approved` (409 Conflict).
- **Kiểm thử phân quyền chặt chẽ (RBAC)**: Có đầy đủ các ca kiểm thử tiêu cực (Negative tests) xác minh rằng tài khoản Learner không thể gọi API Creator/Moderator/Admin (bị chặn 403 Forbidden), tài khoản Creator không thể gọi API Moderator/Admin, và Moderator không thể gọi API Creator/Admin.
