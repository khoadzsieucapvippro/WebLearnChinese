# KỊCH BẢN TRÌNH BÀY & BỘ DỮ LIỆU KIỂM THỬ DEMO (DÀNH CHO BUỔI BÁO CÁO)

Tài liệu này cung cấp **kịch bản trình bày trọn vẹn từng bước** cùng **bộ dữ liệu kiểm thử mới (Chủ đề Công Nghệ 4.0 & Đời Sống Hiện Đại)** để bạn tự tin demo trực tiếp từ A đến Z trước hội đồng hoặc khách hàng.

---

## 📦 1. DANH SÁCH BỘ DỮ LIỆU KIỂM THỬ MỚI (TRONG THƯ MỤC `test_materials/`)

Bộ từ vựng demo gồm các từ vựng hiện đại hoàn toàn mới (chưa có trong giáo trình HSK 1–3 cũ):

| STT | Chữ Hán | Pinyin | Hán-Việt | Nghĩa tiếng Việt | Câu ví dụ | Dịch câu ví dụ | Tệp Âm thanh MP3 |
|---|---|---|---|---|---|---|---|
| 1 | **人工智能** | réngōng zhìnéng | Nhân Công Trí Năng | Trí tuệ nhân tạo (AI) | 人工智能正在深刻改变人类的生活方式。 | Trí tuệ nhân tạo đang làm thay đổi sâu sắc lối sống của nhân loại. | `rengongzhineng.mp3` |
| 2 | **智能手机** | zhìnéng shǒujī | Trí Năng Thủ Cơ | Điện thoại thông minh (Smartphone) | 现代人的日常工作离不开智能手机。 | Công việc hàng ngày của người hiện đại không thể thiếu chiếc điện thoại thông minh. | `zhinengshouji.mp3` |
| 3 | **新能源** | xīn néngyuán | Tân Năng Nguyên | Năng lượng mới, năng lượng xanh | 发展新能源汽车有助于实现绿色减排。 | Phát triển xe năng lượng mới góp phần đạt được mục tiêu giảm phát thải xanh. | `xinnengyuan.mp3` |

### Các tệp đính kèm sẵn sàng sử dụng:
1. **`bai_hoc_cong_nghe_40.xlsx`** (Khuyên dùng): File Excel 6 cột chuẩn. Âm thanh sẽ được hệ thống phát âm giọng Bắc Kinh chuẩn `zh-CN` hoặc bạn có thể tải MP3 lên lúc chỉnh sửa.
2. **`bai_hoc_cong_nghe_40_co_audio.xlsx`**: File Excel 7 cột đã gắn sẵn đường dẫn MP3 `/assets/audio/custom/...`.
3. **3 Tệp MP3 giọng chuẩn Bắc Kinh**:
   - `rengongzhineng.mp3`
   - `zhinengshouji.mp3`
   - `xinnengyuan.mp3`

---

## 🎯 2. KỊCH BẢN TRÌNH DIỄN 5 BƯỚC (CREATOR ➔ MODERATOR ➔ ADMIN ➔ HỌC VIÊN ➔ SRS)

### BƯỚC 1: Tác Giả (Creator) - Nhập bài học từ Excel & Tải MP3
* **Tài khoản đăng nhập:** `creator@test.com` / Mật khẩu: `Password123!`
* **Địa chỉ:** `http://localhost:3000/creator-import.html` (hoặc trên bản Online: `https://khoadzsieucapvippro.github.io/WebLearnChinese/login.html`)
* **Thao tác trình bày:**
  1. Đăng nhập với vai trò **Tác Giả (Creator)**. Hệ thống tự động mở Không gian Tác giả.
  2. Chọn menu **"Nhập bài học từ Excel"**.
  3. Nhập tiêu đề bài học: `Chủ đề Công Nghệ 4.0: AI & Đời Sống`.
  4. Bấm chọn tệp và chọn tệp **`bai_hoc_cong_nghe_40.xlsx`**.
  5. Bấm **"Xem trước dữ liệu"** ➔ Hệ thống phân tích bảng tính ngay tức thì, hiển thị bảng xem trước 3 từ vựng với đầy đủ Chữ Hán, Pinyin, Hán Việt, Nghĩa tiếng Việt và Ví dụ.
  6. *(Tùy chọn tải MP3)*: Tại từng hàng từ vựng, bấm **"Tải tệp MP3"** và chọn tệp MP3 tương ứng (`rengongzhineng.mp3`, `zhinengshouji.mp3`, `xinnengyuan.mp3`). Bấm nút **"Nghe thử"** có loa phát âm thanh trực tiếp.
  7. Bấm **"Lưu bài học"** ➔ Bài học được tạo thành công ở trạng thái **Bản nháp (Draft)**.
  8. Vào **"Quản lý bài học"** (`creator-lessons.html`), bấm **"Gửi duyệt"** ➔ Bài học chuyển sang trạng thái **Chờ duyệt (Pending)** trên Hàng đợi kiểm duyệt.

---

### BƯỚC 2: Kiểm Duyệt Viên (Moderator) - Thẩm Định & Phê Duyệt
* **Tài khoản đăng nhập:** `moderator@test.com` / Mật khẩu: `Password123!`
* **Địa chỉ:** `http://localhost:3000/moderator-queue.html`
* **Thao tác trình bày:**
  1. Đăng xuất Creator và đăng nhập tài khoản **Kiểm Duyệt Viên (Moderator)**.
  2. Mở menu **"Hàng đợi kiểm duyệt"**. Bài học `Chủ đề Công Nghệ 4.0: AI & Đời Sống` đang nằm chờ duyệt.
  3. Bấm **"Thẩm định chi tiết"** ➔ Xem từng từ vựng, nghe thử phát âm âm thanh, đọc nghĩa và câu ví dụ.
  4. *(Điểm nhấn an toàn)*: Giới thiệu quy tắc **Không được tự duyệt (Self-Review Invariant)**: Creator không thể tự duyệt bài của mình; chỉ Moderator hoặc Admin mới có quyền duyệt.
  5. Nhập ghi chú thẩm định: `Nội dung chuẩn xác, ngữ nghĩa sư phạm đạt chuẩn.` và bấm **"Phê duyệt (Approve)"**.
  6. Bài học lập tức được cập nhật trạng thái **Đã duyệt (Approved)** và đồng bộ ngay lên danh mục học tập công khai.

---

### BƯỚC 3: Quản Trị Viên (Admin) - Giám Sát & Quản Trị Hệ Thống
* **Tài khoản đăng nhập:** `admin@test.com` / Mật khẩu: `Password123!`
* **Địa chỉ:** `http://localhost:3000/management.html`
* **Thao tác trình bày:**
  1. Đăng nhập tài khoản **Quản Trị Viên (Admin)**.
  2. Mở **"Giám sát bài học"** (`admin-lessons.html`) ➔ Bài học mới đã có mặt với nhãn xanh "Đã kiểm duyệt".
  3. Mở **"Quản trị từ vựng"** (`admin-vocabulary.html`) ➔ 3 từ mới `人工智能`, `智能手机`, `新能源` đã được đồng bộ vào kho từ vựng toàn hệ thống.
  4. Bấm nút **"Sửa"** bất kỳ từ nào:
     * *(Điểm nhấn tính năng đã sửa)*: Thử bấm nút **"Hủy"** trong modal chỉnh sửa ➔ Modal quay về trạng thái danh sách an toàn, không bị văng trắng màn hình.
     * Bấm **"Tải tệp MP3"** hoặc **"Nghe thử"** ➔ Quản trị viên có toàn quyền cập nhật tệp ghi âm giọng chuẩn cho bất kỳ từ nào.

---

### BƯỚC 4: Trải Nghiệm Học Viên & TÍNH NĂNG "TỰ ĐỘNG SINH NÉT VECTOR"
* **Tài khoản đăng nhập:** `hocvien_test@test.com` / Mật khẩu: `Password123!` (hoặc đăng ký mới)
* **Địa chỉ:** `http://localhost:3000/lessons.html`
* **Thao tác trình bày (ĐÂY LÀ ĐIỂM SÁNG NHẤT CỦA BÀI BÁO CÁO):**
  1. Vào danh mục **Bài học** (`lessons.html`), chọn bài học vừa duyệt: `Chủ đề Công Nghệ 4.0: AI & Đời Sống`.
  2. Bấm vào chi tiết bài học (`lesson-detail.html`).
  3. **Demo Phát âm:** Bấm nút biểu tượng Loa 🔊 tại từ `人工智能` ➔ Phát giọng đọc chuẩn.
  4. **Demo TỰ ĐỘNG SINH NÉT VECTOR:**
     * Bấm vào biểu tượng cây bút viết ✍️ tại từ `人工智能 [réngōng zhìnéng]`.
     * Modal **"✍️ Luyện Viết Chữ Hán"** mở lên:
       * Hệ thống tự động phân tách từ thành 4 chữ: `Chữ 1: 人`, `Chữ 2: 工`, `Chữ 3: 智`, `Chữ 4: 能`.
       * Chữ `智` (trí) là từ mới toanh ngoài HSK 1–3, nhưng **hệ thống tự động sinh nét vector 100%** trong ô Mễ (米字格) màu đỏ nổi bật bộ thủ `日` (nhật).
       * Chuyển tab **"Cách viết"** ➔ Hoạt ảnh động từng nét vẽ thứ tự chuẩn xác.
       * Chuyển tab **"Luyện nét"** ➔ Dẫn hướng viết nét theo từng bước.
       * Chuyển tab **"Luyện viết"** ➔ Kiểm tra viết chữ tự do chấm điểm thông minh.

---

### BƯỚC 5: ĐỒNG BỘ HOÀN HẢO VỚI PHÒNG "ÔN TẬP SRS" (SPACED REPETITION)
* **Thao tác trình bày:**
  1. Ngay trên đầu trang chi tiết bài học, giới thiệu 4 phòng luyện tập hiện đại:
     * **Luyện Flashcard**
     * **Tập viết từng nét**
     * **Luyện nghe phát âm**
     * **Luyện đọc nhận diện**
  2. Bấm nút **"Tập viết từng nét"** (hoặc `srs-review.html?mode=writing&lessonId=...`):
     * Giao diện phòng học SRS xuất hiện thanh tiến độ: `← Quay lại | Bài 01 | Thẻ 1 / 3`.
     * Cả 3 từ vựng mới (`人工智能`, `智能手机`, `新能源`) được nạp tuần tự vào lộ trình ghi nhớ lặp lại ngắt quãng.
     * Từng chữ được bố trí ô Mễ chuẩn mực giúp học sinh luyện viết và nhớ mặt chữ sâu sắc.
  3. Bấm đánh giá độ nhớ (Lặp lại, Khó, Tốt, Dễ) ➔ Thuật toán SuperMemo SM-2 tự động tính toán chu kỳ ôn tập tiếp theo trên nền tảng cơ sở dữ liệu TiDB Cloud.

---

## 🏆 TỔNG KẾT CÁC ĐIỂM NHẤN CÔNG NGHỆ ĐỂ NHẤN MẠNH TRƯỚC HỘI ĐỒNG
1. **Kiến trúc Zero-Build Semantic HTML5:** Tốc độ tải trang cực nhanh, không phụ thuộc bundler cồng kềnh, chuẩn Accessibility WCAG 2.2.
2. **Quy trình 3 bên đồng bộ khép kín:** Creator soạn thảo ➔ Moderator thẩm định ➔ Admin quản trị ➔ Học viên ôn tập tức thì.
3. **Tự động sinh nét chữ Hán vector (Dynamic Vector Hanzi Stroke Engine):** Không cần lập trình viên tải tệp nét thủ công, tự động nhận diện và vẽ nét cho mọi chữ Hán giản thể/phồn thể từ kho hơn 9.500 ký tự.
4. **Phòng ôn tập 4 kỹ năng SRS chuẩn thuật toán SuperMemo SM-2:** Đồng bộ dữ liệu thẻ học thông minh, hỗ trợ cá nhân hóa cài đặt học tập.
