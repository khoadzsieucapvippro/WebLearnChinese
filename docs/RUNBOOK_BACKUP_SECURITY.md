# Sổ Tay Vận Hành: Sao Lưu, Khôi Phục Thảm Họa & Bảo Mật Quản Trị
# (Disaster Recovery Runbook & Admin Security Operations)

Tài liệu này đặc tả quy trình vận hành sản xuất (Production Operations Runbook) cho hệ thống **WebLearnChinese**, bao gồm:
1. Quy chuẩn sao lưu định kỳ cơ sở dữ liệu **TiDB Cloud Serverless Starter** (100% Free Tier).
2. Quy trình 4 bước khôi phục sau thảm họa (Disaster Recovery - DR) đáp ứng **RPO $\le$ 24 giờ** và **RTO $\le$ 15 phút**.
3. Bộ 5 truy vấn SQL kiểm chứng toàn vẹn dữ liệu học thuật và quyền hạn.
4. Quy trình khởi tạo tài khoản quản trị (Bootstrap Admin) và bắt buộc đổi mật khẩu an toàn.
5. Các rào chắn bảo mật bất biến trên môi trường sản xuất (Production Security Invariants).

---

## 1. Mục Tiêu Vận Hành & Khôi Phục (SLA & Objectives)

| Chỉ số | Mục tiêu cam kết | Giải pháp kỹ thuật |
| :--- | :--- | :--- |
| **RPO** (Recovery Point Objective) | **$\le$ 24 giờ** | Tự động sao lưu logical dump hàng ngày vào lúc **02:00 UTC** qua GitHub Actions. |
| **RTO** (Recovery Time Objective) | **$\le$ 15 phút** | Khôi phục trực tiếp qua luồng đường ống MySQL client (`gunzip \| mysql`). |
| **Chi phí lưu trữ & tính toán** | **0 VNĐ (100% Free)** | TiDB Serverless 5GB vĩnh viễn + GitHub Actions Artifacts lưu trữ 30 ngày. |
| **Tính toàn vẹn mã hóa** | **100% UTF-8** | Cưỡng chế `utf8mb4_unicode_ci` bảo toàn 214 Bộ thủ Khang Hy và HSK 1–3. |

---

## 2. Quy Chuẩn Lệnh Sao Lưu TiDB Cloud Serverless (`mysqldump`)

TiDB Cloud Serverless là hệ quản trị cơ sở dữ liệu phân tán tương thích giao thức MySQL. Do đặc thù kiến trúc phân tán (Distributed MVCC), các lệnh sao lưu chuẩn của MySQL truyền thống cần được điều chỉnh chính xác bằng **5 cờ kỹ thuật bắt buộc**:

```bash
mysqldump \
  -h <gateway-host>.tidbcloud.com \
  -P 4000 \
  -u '<cluster-prefix>.root' \
  -p'<your-database-password>' \
  --ssl-mode=REQUIRED \
  --default-character-set=utf8mb4 \
  --single-transaction \
  --skip-lock-tables \
  --set-gtid-purged=OFF \
  --databases elearning_db | gzip > backup_elearning_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Ý Nghĩa Kỹ Thuật Của 5 Cờ Bắt Buộc:

1. **`--single-transaction`**:
   Kích hoạt cơ chế Snapshot Isolation thông qua Multi-Version Concurrency Control (MVCC) của TiDB. Cho phép trích xuất toàn bộ dữ liệu tại một thời điểm nhất quán duy nhất mà **không làm gián đoạn hoặc chặn các giao dịch đọc/ghi** của người học (Zero Downtime Backup).
2. **`--skip-lock-tables`**:
   TiDB là hệ thống phân tán không hỗ trợ cơ chế khóa cấp bảng cổ điển (`LOCK TABLES`). Nếu thiếu cờ này, tiến trình `mysqldump` sẽ bị cảnh báo hoặc dừng đột ngột.
3. **`--ssl-mode=REQUIRED`**:
   Bắt buộc thiết lập mã hóa kênh truyền TLS/SSL khi kết nối tới cổng `4000` của cổng giao tiếp TiDB Cloud Gateway, bảo vệ thông tin đăng nhập và dữ liệu nhạy cảm trên đường truyền Internet.
4. **`--default-character-set=utf8mb4`**:
   Đảm bảo toàn bộ 214 Bộ thủ Khang Hy (Unicode `U+2F00..U+2FDF`, `U+2E80..U+2EFF`) và 1.068 từ vựng tiếng Trung cùng các ký tự phiên âm Pinyin 4 thanh điệu được trích xuất nguyên vẹn, không bị lỗi gãy font hoặc mất byte.
5. **`--set-gtid-purged=OFF`**:
   Ngăn chặn xuất lệnh ghi đè `gtid_purged` - vốn yêu cầu quyền `SUPER` (không được cấp trên các môi trường DBaaS Serverless như TiDB Cloud).

---

## 3. Quy Trình Khôi Phục Thảm Họa 4 Bước (4-Step DR Runbook)

Khi phát sinh sự cố mất dữ liệu, hỏng ổ cứng hoặc cần di chuyển sang cluster TiDB mới, người vận hành thực hiện tuần tự 4 bước sau:

```
[Bản sao lưu .sql.gz]
         |
         v
+------------------------------------+
| Bước 1: Khởi tạo Database Đích    | -> UTF-8 mb4 unicode ci
+------------------------------------+
         |
         v
+------------------------------------+
| Bước 2: Nạp dữ liệu qua Stream     | -> gunzip < file.sql.gz | mysql
+------------------------------------+
         |
         v
+------------------------------------+
| Bước 3: Khởi động Backend Spring   | -> Xác nhận Flyway Checksum V1..V30
+------------------------------------+
         |
         v
+------------------------------------+
| Bước 4: Chạy 5 SQL Verification    | -> Bộ thủ, Từ vựng, Bài học, Admin
+------------------------------------+
```

### Bước 1: Khởi Tạo hoặc Làm Sạch Cơ Sở Dữ Liệu Đích
Đăng nhập vào TiDB SQL console và đảm bảo cơ sở dữ liệu đích được thiết lập chuẩn xác bảng mã `utf8mb4` và collation `utf8mb4_unicode_ci`:

```sql
CREATE DATABASE IF NOT EXISTS elearning_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elearning_db;
```

### Bước 2: Phục Hồi Dữ Liệu Từ Bản Sao Lưu Nén
Giải nén và nạp trực tiếp dữ liệu qua pipeline của MySQL client:

```bash
gunzip < backup_elearning_db_YYYYMMDD_HHMMSS.sql.gz | \
mysql \
  -h <gateway-host>.tidbcloud.com \
  -P 4000 \
  -u '<cluster-prefix>.root' \
  -p'<your-database-password>' \
  --ssl-mode=REQUIRED \
  --default-character-set=utf8mb4 \
  elearning_db
```

### Bước 3: Khởi Động Lại Backend & Xác Nhận Flyway Schema History
Khởi động container Spring Boot backend. Kiểm tra nhật ký khởi động (Logs) để xác nhận hệ thống Flyway kiểm toán thành công toàn bộ migration:

```
[INFO] org.flywaydb.core.Flyway - Successfully validated 30 migrations (execution time 00:00.120s)
[INFO] org.flywaydb.core.Flyway - Current version of schema `elearning_db`: 30
[INFO] org.flywaydb.core.Flyway - Schema `elearning_db` is up to date. No migration necessary.
```

### Bước 4: Chạy 5 Câu Truy Vấn Kiểm Chứng Toàn Vẹn Dữ Liệu (Integrity Queries)
Người vận hành thực thi đúng 5 truy vấn SQL sau để nghiệm thu hệ thống sau khôi phục:

#### Query 1: Đủ 214 Bộ Thủ Khang Hy
```sql
SELECT COUNT(*) AS total_radicals FROM radical;
-- Kết quả bắt buộc: 214
```

#### Query 2: Bộ Thủ #69 Mang Âm Hán-Việt Chuẩn "Cân"
```sql
SELECT radical_id, `character`, meaning_han_viet 
FROM radical 
WHERE radical_id = 69;
-- Kết quả bắt buộc: radical_id = 69 | character = 斤 | meaning_han_viet = Cân
```

#### Query 3: Đủ 1.068 Từ Vựng HSK 1–3 và Bổ Sung Giáo Trình
```sql
SELECT COUNT(*) AS total_vocabularies FROM vocabulary;
-- Kết quả bắt buộc: 1068 (gồm 300 HSK 1, 200 HSK 2, 500 HSK 3, 68 HSK 0)
```

#### Query 4: Đủ 50 Bài Học Chuẩn Hóa
```sql
SELECT COUNT(*) AS total_lessons FROM lesson;
-- Kết quả bắt buộc: 50
```

#### Query 5: Duy Trì Ít Nhất 1 Tài Khoản Quản Trị Viên (Admin) Đang Hoạt Động
```sql
SELECT COUNT(DISTINCT a.account_id) AS active_admins
FROM account a
JOIN account_role ar ON a.account_id = ar.account_id
JOIN role r ON ar.role_id = r.role_id
WHERE (LOWER(r.role_name) = 'admin' OR LOWER(r.role_name) = 'role_admin')
  AND a.status = 'Active';
-- Kết quả bắt buộc: >= 1
```

---

## 4. Tự Động Hóa Sao Lưu Hàng Ngày Bằng GitHub Actions

Quy trình sao lưu đã được cấu hình tự động tại `.github/workflows/db-backup-schedule.yml`:
- **Chu kỳ chạy**: `0 2 * * *` (02:00 UTC mỗi ngày, tương đương 09:00 sáng giờ Việt Nam).
- **Kích hoạt thủ công**: Hỗ trợ nút `Run workflow` trong tab **Actions** bất cứ lúc nào.
- **Lưu trữ an toàn**: Bản nén `.sql.gz` được đẩy lên GitHub Artifacts với thời gian lưu trữ **30 ngày** (`retention-days: 30`).
- **Cơ chế tự kiểm tra**: Workflow tự động kiểm tra kích thước file; nếu file dump nhỏ hơn 10KB (dấu hiệu kết nối lỗi hoặc DB trống), job sẽ lập tức báo `FAILURE` và gửi email cảnh báo tới chủ repository.

### Cấu Hình Secrets Trên GitHub:
Vào GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> Thêm các repository secrets:
1. `TIDB_HOST`: Host cổng kết nối của TiDB (ví dụ: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
2. `TIDB_PORT`: `4000`
3. `TIDB_USER`: Tên tài khoản định dạng `<prefix>.root`
4. `TIDB_PASSWORD`: Mật khẩu tài khoản TiDB
5. `TIDB_DATABASE`: `elearning_db`

---

## 5. Quy Chuẩn Khởi Tạo Tài Khoản Admin & Đổi Mật Khẩu (Admin Bootstrap Protocol)

### 5.1. Cơ Chế Hoạt Động Của `BootstrapAdminRunner`
- Khi triển khai môi trường Production, biến `APP_DEMO_SEED_ACCOUNTS=false` ngăn chặn toàn bộ việc nạp tài khoản mẫu có mật khẩu mặc định `Password@123`.
- Nếu cơ sở dữ liệu TiDB hoàn toàn mới (chưa có tài khoản nào), thành phần `BootstrapAdminRunner` sẽ tự động kích hoạt với điều kiện kiểm tra nghiêm ngặt:
  $$\text{Số lượng Admin đang hoạt động} = 0$$
- Nếu hệ thống **đã có ít nhất 1 Admin hoạt động**, `BootstrapAdminRunner` **hoàn toàn bỏ qua** và không thực hiện bất kỳ thao tác ghi đè nào.

### 5.2. Các Bước Đổi Mật Khẩu Khởi Tạo:
1. **Thiết lập biến môi trường (Render Dashboard)**:
   - `APP_BOOTSTRAP_ADMIN_EMAIL`: Email quản trị viên (mặc định: `admin@elearning.local`).
   - `APP_BOOTSTRAP_ADMIN_PASSWORD`: Khóa bí mật quản trị viên (tối thiểu 12 ký tự).
   *Lưu ý*: Nếu để trống biến `APP_BOOTSTRAP_ADMIN_PASSWORD`, hệ thống sẽ tự sinh mật khẩu ngẫu nhiên an toàn 16 bytes base64url (`Admin!...`) và in ra nhật ký khởi động (Logs) của container một lần duy nhất.
2. **Đăng nhập và nhận JWT**:
   ```bash
   curl -s -X POST https://elearning-backend-xxxx.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"emailOrPhone":"admin@elearning.local","password":"<temporary-or-bootstrap-password>"}'
   ```
3. **Đổi mật khẩu ngay lập tức**:
   ```bash
   curl -s -X POST https://elearning-backend-xxxx.onrender.com/api/v1/auth/change-password \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "oldPassword":"<temporary-or-bootstrap-password>",
       "newPassword":"<your-official-super-secure-password-2026>"
     }'
   ```
4. **Cơ chế thu hồi phiên tức thì (Immediate Token Invalidation)**:
   API `change-password` tự động tăng trường `authorization_version` trong cơ sở dữ liệu, lập tức vô hiệu hóa token tạm thời trên toàn bộ các thiết bị.
5. **Gỡ bỏ biến môi trường**:
   Sau khi hoàn tất đổi mật khẩu, người quản trị có thể xóa hoặc để trống biến `APP_BOOTSTRAP_ADMIN_PASSWORD` trên Render Dashboard. Do `countActiveAdmins() >= 1`, các lần khởi động lại tiếp theo sẽ tự động bỏ qua.

---

## 6. Bất Biến Bảo Mật Sản Xuất (Production Invariants Checklist)

- [x] **Zero Hardcoded Secrets**: Toàn bộ mật khẩu DB, khóa JWT, token liên lạc microservice đều được nạp qua Environment Variables.
- [x] **Fail-Fast JWT Secret**: Ứng dụng từ chối khởi động trên profile production nếu `JWT_SECRET` nhỏ hơn 32 ký tự (256 bits).
- [x] **Cấm Seeder Tài Khoản Trên Prod**: `APP_DEMO_SEED_ACCOUNTS` bắt buộc là `false` trong `render.yaml` và `Dockerfile.unified`.
- [x] **Bảo Vệ Last Admin**: Ngăn chặn tuyệt đối hành vi hạ quyền hoặc khóa tài khoản Admin duy nhất còn hoạt động.
- [x] **Cấm Tự Phê Duyệt**: Creator kiêm Moderator không thể tự duyệt hoặc tự từ chối bài viết của chính mình.
- [x] **Audit Log Khử Nhạy Cảm**: Mọi nhật ký quản trị trong `management_audit_log` được làm sạch tự động, không chứa mật khẩu hoặc token.
