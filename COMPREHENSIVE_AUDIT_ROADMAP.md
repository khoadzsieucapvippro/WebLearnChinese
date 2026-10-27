# LỘ TRÌNH RÀ SOÁT TOÀN DIỆN TỪNG PHẦN HỆ THỐNG WEBLEARNCHINESE
**Tài liệu theo dõi tiến trình kiểm toán từng bước giữa Người Dùng (Reviewer & Quality Gate) và AI Coding Assistant**

---

## 1. NGUYÊN TẮC PHỐI HỢP & QUY TRÌNH TỪNG NHIỆM VỤ

Mỗi nhiệm vụ được phân rã vừa phải (modular & focused) để tập trung cao độ, phát hiện mọi lỗi nhỏ (giao diện, logic hiển thị, chữ Hán, phát âm, gõ bàn phím, responsive, xử lý biên).

```mermaid
flowchart TD
    A["Agent: Mở nhiệm vụ & Rà soát chuyên sâu (UI/Logic/Data/Test)"] --> B["Agent: Báo cáo phát hiện, điểm nghi vấn & lỗi tiềm ẩn"]
    B --> C["Người Dùng: Trực tiếp xem, góp ý, chỉ ra lỗi bổ sung"]
    C --> D["Agent: Tiếp nhận, kiểm chứng, viết test & sửa lỗi triệt để"]
    D --> E["Chạy kiểm thử xác minh (Fast Unit + E2E + Visual)"]
    E --> F["Cập nhật Tiến trình & Chuyển sang nhiệm vụ tiếp theo"]
```

---

## 2. MA TRẬN TIẾN TRÌNH RÀ SOÁT TỔNG THỂ (18 NHIỆM VỤ / 8 CHẶNG)

| Chặng | Mã | Nhiệm vụ | Phạm vi tệp liên quan | Trạng thái |
|---|---|---|---|---|
| **Chặng 1: Khám phá & Nhận diện** | `TASK-1.1` | Trang chủ & Nhận diện thương hiệu | `index.html`, `main.css`, `header.css` | ✅ Hoàn thành |
| | `TASK-1.2` | Xác thực, Đăng ký, Đăng nhập & Hồ sơ cá nhân | `login.html`, `register.html`, `profile.html`, `profile-page.js` | ✅ Hoàn thành |
| **Chặng 2: Thư viện Học liệu** | `TASK-2.1` | Danh mục & Chi tiết Từ vựng (1.068 từ HSK 1–3) | `vocabulary.html`, `vocabulary-page.js`, modal từ vựng | ✅ Hoàn thành |
| | `TASK-2.2` | Tra cứu 214 Bộ thủ Khang Hy & Cấu phần chữ Hán | `radicals.html`, `radicals-page.js`, modal bộ thủ | ✅ Hoàn thành |
| **Chặng 3: Chương trình Học** | `TASK-3.1` | 50 Bài học chuẩn HSK 3.0 & Chi tiết bài học | `lessons.html`, `lessons-page.js`, `lesson-detail.html` | ✅ Hoàn thành |
| **Chặng 4: Đấu trường Ôn tập SRS** | `TASK-4.1` | SRS Dashboard & Cài đặt học tập | `srs-dashboard.html`, `profile.html#settings` | ✅ Hoàn thành |
| | `TASK-4.2` | SRS Phòng Lật Thẻ Flashcard (SM-2 Algorithm) | `srs-review.html?mode=flashcard`, `srs-session.js` | 🔄 Đang xử lý & Bàn giao |
| | `TASK-4.3` | SRS Phòng Luyện Viết (Writing Room HanziWriter) | `srs-review.html?mode=writing`, `character-writing` | ⏳ Chờ duyệt |
| | `TASK-4.4` | SRS Phòng Luyện Nghe & Bàn phím ảo IME (Listening) | `srs-review.html?mode=listening`, virtual keyboard | ⏳ Chờ duyệt |
| | `TASK-4.5` | SRS Phòng Đọc hiểu & Chấm ngữ điệu (Reading) | `srs-review.html?mode=reading`, `speech-service` | ⏳ Chờ duyệt |
| **Chặng 5: Không gian Cá nhân** | `TASK-5.1` | Sổ tay Ghi chú Cá nhân (Personal Notes) | `personal-notes.html`, `notes-modal.js` | ⏳ Chờ duyệt |
| **Chặng 6: Quản lý Nội dung** | `TASK-6.1` | Cổng Điều phối & Creator Studio (Tạo bài, Import) | `management.html`, `creator-lessons.html`, `creator-import.html` | ⏳ Chờ duyệt |
| | `TASK-6.2` | Moderator Queue & Thẩm định bài học | `moderator-queue.html`, `moderator-review.html` | ⏳ Chờ duyệt |
| **Chặng 7: Quản trị Hệ thống** | `TASK-7.1` | Quản trị Tài khoản & Phân quyền Admin | `admin-accounts.html`, `admin-roles.html` | ⏳ Chờ duyệt |
| | `TASK-7.2` | Quản trị Bài học, Từ vựng & Bộ thủ (Admin) | `admin-lessons.html`, `admin-vocabulary.html`, `admin-radicals.html` | ⏳ Chờ duyệt |
| | `TASK-7.3` | Nhật ký Kiểm toán & Trung tâm Xác minh UI | `admin-audit-logs.html`, `verification-center.html` | ⏳ Chờ duyệt |
| **Chặng 8: Đám mây & Thực tế** | `TASK-8.1` | Triển khai GitHub Pages & Đường dẫn tĩnh Subpath | `deploy-pages.yml`, subpath URL resolver | ⏳ Chờ duyệt |
| | `TASK-8.2` | Kiến trúc Render Container & TiDB Cloud | `Dockerfile.unified`, `render.yaml`, TiDB schema | ⏳ Chờ duyệt |
| | `TASK-8.3` | Trải nghiệm Thực tế trên Điện thoại Di động Thật | LAN Wi-Fi `serve:mobile` / Tunnel công khai | ⏳ Chờ duyệt |

---

## 3. CHI TIẾT CÁC NHIỆM VỤ RÀ SOÁT TẬP TRUNG

### CHẶNG 1: KHÁM PHÁ & NHẬN DIỆN THƯƠNG HIỆU
#### `TASK-1.1`: Trang Chủ & Nhận Diện Thương Hiệu (`index.html`)
- **Mục tiêu**: Đảm bảo ấn tượng ban đầu hoàn hảo cho người học mới và người dùng quay lại.
- **Tiêu chí kiểm tra**:
  1. *Ngữ nghĩa & SEO*: Thẻ `<h1>` duy nhất, thẻ `<meta name="viewport">`, `lang="vi"`, `<title>` chuẩn.
  2. *Giao diện & Tokens*: Bảng màu Scholarly Cinnabar (`#8B2635`), font chữ Hán `Noto Sans SC` hiển thị nét sắc sảo, không vỡ layout trên mobile (360px, 375px, 412px) đến desktop (1024px+).
  3. *Điều hướng Navbar*: Đầy đủ liên kết: Trang chủ, Bộ thủ, Từ vựng, Bài học, Ôn tập SRS. Nút Đăng ký có nhãn đúng "Đăng ký" (không phải "Bắt đầu học").
  4. *Trạng thái Đăng nhập*: Hiển thị đúng Avatar/Tên người dùng khi đã đăng nhập, hiển thị nút Đăng nhập/Đăng ký khi là khách.
  5. *Liên kết hành động (CTA)*: Nút "Học thử ngay", "Khám phá từ vựng" chuyển trang đúng và không bị lỗi đường dẫn khi chạy trên subpath.

#### `TASK-1.2`: Xác Thực, Đăng Ký, Đăng Nhập & Hồ Sơ Cá Nhân (`login.html`, `register.html`, `profile.html`)
- **Mục tiêu**: Bảo mật và trải nghiệm đăng nhập mượt mà theo chuẩn quốc tế (NIST SP 800-63B, Nielsen Norman Group, OWASP), thông báo lỗi tiếng Việt dễ hiểu, tinh gọn giao diện hồ sơ theo đúng bản vẽ thiết kế người dùng.
- **Tiêu chí & Hạng mục đã hoàn thiện**:
  1. *Chuẩn Hóa Kênh Định Danh*: Nhãn và input đổi thành "Email đăng nhập" / "Email đăng ký" (placeholder: `name@example.com`), loại bỏ kỳ vọng SMS OTP khi hệ thống không có SMS gateway.
  2. *Nút Ẩn/Hiện Mật Khẩu (Show/Hide Toggle 👁️)*: Triển khai theo chuẩn NIST SP 800-63B & NN/g trên cả 3 trang: Đăng nhập (`login.html`), Đăng ký (`register.html`), Đổi mật khẩu (`profile.html`).
  3. *Lối Thoát Khi Quên Mật Khẩu*: Tích hợp liên kết và Modal "Khôi phục mật khẩu" chuẩn WCAG 2.2 trên `login.html`.
  4. *Tải Ảnh Đại Diện Trực Tiếp Từ Thư Mục Thiết Bị (Overhaul UI/UX)*:
     - Nghiên cứu tiêu chuẩn quốc tế (NN/g, Material Design, Apple HIG): Loại bỏ hoàn toàn ô nhập URL thô ráp (`#profileAvatarUrlInput`), người dùng hiện đại không lưu URL ảnh để dán vào profile.
     - Tải ảnh trực tiếp từ thiết bị (PNG, JPG, WebP tối đa 5MB) bằng `FileReader` + HTML5 Canvas tự động center-crop và nén về $160 \times 160\text{px}$ JPEG Data URL (~10KB).
     - Hỗ trợ Kéo & Thả (Drag and Drop) trực tiếp vào khung avatar với bộ đếm `dragCounter` chống hiện tượng nhấp nháy (flicker).
     - Lưu trữ an toàn trong `localStorage` (`weblearnchinese_custom_avatar_${accountId}`) và đồng bộ thời gian thực lên thanh Navbar.
     - Nút "Xóa ảnh" khôi phục ngay lập tức về chữ Hán mặc định ("学").
  5. *Tái Thiết Kế Giao Diện Hồ Sơ Theo Bản Vẽ Mockup Của Người Dùng*:
     - Loại bỏ toàn bộ khối hộp màu xám thừa thãi ở đầu trang (cả ảnh đại diện `(学)`, họ tên `1111`, huy hiệu `[HỌC VIÊN]` và email `th@gmail.com`) để tránh lặp lại thông tin 2 lần trên cùng một màn hình; ẩn metadata bằng `visually-hidden` bảo vệ chuẩn WCAG và kiểm thử tự động.
     - Thẻ hồ sơ bắt đầu trực tiếp từ 2 tab điều hướng: `[ 👤 Thông tin cá nhân ]` và `[ ⚙️ Cài đặt ]`.
     - Tab Cài đặt được áp dụng màu xám trung tính (`#6c757d`), triệt tiêu hoàn toàn màu xanh dương mặc định (`#0d6efd`) của Bootstrap ở cả trạng thái thường, `:hover` và `:focus`.
     - Mục "Ảnh đại diện" trong form được thiết kế nằm ngang: bên trái là khung xem trước ảnh, bên phải là cặp nút `[ Tải ảnh mới ]` (Cinnabar) & `[ Xóa ảnh ]` (viền xám) kèm thông tin định dạng.
     - Bố cục 2 cột trên desktop (`row g-3`): Cột 1 "Họ và tên *", Cột 2 "Email đăng nhập" readonly kèm icon ổ khóa và nhãn `(🔒 Không đổi)`.
     - Cặp nút hành động: `[ Lưu thay đổi ]` (Cinnabar `#8B2635`) và `[ Khôi phục ]` (viền xám `btn-outline-secondary`).
  6. *Dọn Dẹp Tab Cài Đặt*:
     - Xóa bỏ dòng ghi chú cảnh báo `alert-info` lưu trữ cục bộ (`#localSettingsNotice`).
     - Xóa bỏ khối thẻ "Tài khoản & Định danh hệ thống" (Email, Mã học viên, Mã tài khoản, Ngày tham gia hệ thống) để tab Cài đặt chỉ tập trung thuần túy vào cấu hình học tập thực tế (Mục tiêu thẻ SRS, Âm thanh & phát âm, Hiển thị & luyện viết, Đổi mật khẩu).
  7. *Bảo Vệ Giới Hạn SRS Thẻ*: Đồng bộ thuộc tính `max="100"` trên `profile.html` tuân thủ nghiêm ngặt Invariant 6 (`[1, 100]`).

---

### CHẶNG 2: THƯ VIỆN HỌC LIỆU CỐT LÕI
#### `TASK-2.1`: Danh Mục & Chi Tiết Từ Vựng (`vocabulary.html`)
- **Mục tiêu**: Tra cứu 1.068 từ vựng HSK 1–3 không một lỗi hiển thị hay phát âm.
- **Tiêu chí kiểm tra**:
  1. *Tìm kiếm & Lọc*: Tìm theo Hán tự, Pinyin, Tiếng Việt, lọc theo cấp độ HSK 1, 2, 3 và chủ đề.
  2. *Phân trang*: Thanh phân trang First/Last (`<< < 1 2 3 > >>`) hoạt động chính xác khi lọc hoặc tìm kiếm.
  3. *Modal Chi tiết Từ vựng*:
     - Phát âm thanh MP3 chuẩn (không lỗi 404 trên GitHub Pages nhờ `resolveSubpathAudioUrl`).
     - Hiển thị cấu phần bộ thủ: phân loại rõ `Bộ [Tên]` (tra cứu chính) vs `Thành phần [Tên]` (cấu tạo). Với từ đơn 1 chữ không hiển thị thừa nhãn `Chữ 机`.
     - Nút "Luyện viết chữ này" mở modal HanziWriter mượt mà.
     - Nút "Thêm vào sổ tay" lưu ghi chú nhanh.

#### `TASK-2.2`: Tra Cứu 214 Bộ Thủ Khang Hy (`radicals.html`)
- **Mục tiêu**: Tra cứu 214 bộ thủ Khang Hy chuẩn mực thư tịch và âm thanh phát âm.
- **Tiêu chí kiểm tra**:
  1. *Chuyển Tab*: Tab "50 Bộ thủ Thông dụng" (đúng 50 thẻ) và tab "214 Bộ thủ Đầy đủ" (đúng 214 thẻ).
  2. *Bộ lọc số nét*: Lọc chính xác từ 1 đến 17 nét, tìm kiếm theo tên Hán Việt/Pinyin.
  3. *Modal Chi tiết Bộ thủ*:
     - Phát âm MP3 tương ứng `radical_001.mp3` .. `radical_214.mp3`.
     - Giải nghĩa chiết tự sư phạm (`explanationVi`) rõ ràng, không có placeholder tạm bợ.
     - Hiển thị danh sách từ vựng HSK có chứa bộ thủ này kèm liên kết tra cứu nhanh.

---

### CHẶNG 3: CHƯƠNG TRÌNH HỌC HSK 3.0
#### `TASK-3.1`: 50 Bài Học Chuẩn HSK 3.0 & Chi Tiết Bài Học (`lessons.html`, `lesson-detail.html`)
- **Mục tiêu**: Đảm bảo 50 bài học hoạt động trơn tru, hiển thị đầy đủ 1.000 từ vựng cốt lõi, tinh gọn giao diện theo chỉ đạo người dùng và đồng bộ liên kết điều hướng trên thanh Navbar ngang.
- **Tiêu chí & Hạng mục đã hoàn thiện**:
  1. *Điều hướng Navbar*: Mục "Bài học" hiển thị chuẩn xác giữa "Từ vựng" và "Ôn tập" trên toàn bộ 25 trang, gán `active` khi truy cập bài học.
  2. *Tinh gọn Danh mục Bài học (`lessons.html`)*:
     - Xóa Breadcrumb đầu trang ("Trang chủ / Bài học") vì người dùng thao tác trực tiếp trên thanh Navbar ngang.
     - Xóa các ô rườm rà trên thanh công cụ: "Trung tâm Ôn tập →", "Xem theo Cấp độ HSK →", bộ chọn số bài "Hiển thị: [20 / trang]" và nhãn đếm "Hiển thị 1–20 / 50 bài học".
     - Chuẩn hóa phân trang First/Last (`<< < 1 2 3 > >>`) đồng bộ với Bộ thủ & Từ vựng, căn lề sang bên phải (`justify-content-end`).
  3. *Trang Chi tiết Bài học (`lesson-detail.html`)*:
     - Xóa Breadcrumb đầu trang, bảo toàn Single H1 và không gây lỗi runtime (`if (this.dom.breadcrumb...)`).
     - Xóa các huy hiệu tra cứu: Xóa badge link "Tra từ vựng ↗" và "Tra bộ thủ ↗" trên từng dòng để giao diện thoáng đãng.
     - Đồng bộ màu sắc 4 phòng SRS: Chuyển 3 nút Luyện Viết, Luyện Nghe, Luyện Đọc sang màu đỏ Cinnabar (`btn-chinese-primary`) đồng nhất với nút Luyện Flashcard.
     - Sửa lỗi nút loa phát âm: Gắn sự kiện click và kích hoạt `playPronunciation({ text, audioUrl, button })` cho toàn bộ từ vựng và bộ thủ cấu thành.
     - Xóa khối banner kêu gọi hành động cuối trang ("Sẵn sàng ghi nhớ và làm chủ nội dung này?").
     - Đồng bộ Ghi chú 2 chiều (Bidirectional Notes Sync): Modal ghi chú bài học (`notes-modal.js`) đồng bộ trực tiếp với thẻ Flashcard (`srs-review.html`) qua `localStorage` (`srs_vocab_note_${userId}_${vocabId}` và `srs_vocab_note_${vocabId}`), hỗ trợ lưu offline/lạc quan và phản ánh tức thì cả hai chiều.
     - Tinh gọn Modal Luyện Viết HanziWriter (`vocab-writing-orchestrator.js`): Chuyển dòng trạng thái tiến trình nét sang `visually-hidden` (WCAG 2.2 SC 4.1.3), xóa nút "Chữ kế →", xóa nút "✍️ Luyện viết từ này", xóa nhãn `#1: 谢` ở cả 3 tab (*Cách viết*, *Luyện nét*, *Luyện viết*).

---

### CHẶNG 4: ĐẤU TRƯỜNG ÔN TẬP LẶP LẠI NGẮT QUÃNG SRS
#### `TASK-4.1`: SRS Dashboard & Cài Đặt Học Tập (`srs-dashboard.html`, `srs-settings.html`)
- **Mục tiêu**: Bảng điều khiển tiến độ và cấu hình giới hạn thẻ học.
- **Tiêu chí kiểm tra**:
  1. *Dashboard*: Thống kê số thẻ mới (New), đang học (Learning), cần ôn (Due), đã thuộc (Mastered).
  2. *Cài đặt SRS*: Giới hạn `newCardsPerDay` trong khoảng `[1, 100]`. Nút "Hoàn tác thay đổi" khôi phục cài đặt gốc an toàn.
  3. *Chọn phòng ôn tập*: Chọn thẻ theo bài học HSK hoặc theo bộ thủ, liên kết chính xác sang 4 phòng chức năng.

#### `TASK-4.2`: SRS Phòng Lật Thẻ Flashcard (`srs-review.html?mode=flashcard`)
- **Mục tiêu**: Lật thẻ trực quan, phản hồi tức thì theo thuật toán SuperMemo SM-2.
- **Tiêu chí kiểm tra**:
  1. *Lật mặt thẻ*: Mặt trước (Hán tự, phát âm), mặt sau (Pinyin, Nghĩa Hán Việt, Nghĩa Việt, ví dụ).
  2. *4 Nút Chấm Điểm SM-2*: Lại (Again), Khó (Hard), Tốt (Good), Dễ (Easy) tính toán đúng chu kỳ ôn tiếp theo, không để Ease Factor rơi dưới 1.30.
  3. *Phím tắt*: Hỗ trợ phím Space để lật thẻ, phím `1`, `2`, `3`, `4` để chấm điểm nhanh trên máy tính.

#### `TASK-4.3`: SRS Phòng Luyện Viết Chữ Hán (`srs-review.html?mode=writing`)
- **Mục tiêu**: Luyện viết nét theo nét chuẩn mực của HanziWriter, responsive hoàn hảo trên di động.
- **Tiêu chí kiểm tra**:
  1. *Canvas Mễ Tự*: Kích thước 170x170px sắc nét, tự động xếp dọc (stacked) trên mobile hẹp (360px..412px) và xếp ngang trên desktop, không tràn màn hình ngang (0px horizontal overflow).
  2. *Từ đơn & Từ ghép*: Hỗ trợ từ vựng 1 chữ (`机`) và từ ghép 2 chữ (`爱好`, `电脑`), viết xong chữ thứ nhất tự động chuyển sang chữ thứ hai.
  3. *Gợi ý & Chấm nét*: Nút hiện nét mờ gợi ý, nút viết mẫu động animation, âm thanh khi viết đúng nét, fallback an toàn cho 9 dị thể bộ thủ (`牜` -> `牛`, `玊` -> `玉`...).

#### `TASK-4.4`: SRS Phòng Luyện Nghe & Bàn Phím Ảo Tiếng Trung (`srs-review.html?mode=listening`)
- **Mục tiêu**: Luyện nghe phát âm chuẩn và nhập câu trả lời tiếng Trung qua bàn phím ảo hoặc IME.
- **Tiêu chí kiểm tra**:
  1. *Âm thanh tự động*: Tự động phát âm thanh khi vào thẻ hoặc chuyển thẻ, nút bấm nghe lại.
  2. *Bàn phím ảo tiếng Trung*: Bàn phím ảo đầy đủ các phím pinyin và ký tự chọn chữ Hán, nút ẩn/hiện bàn phím ảo trên mobile.
  3. *Gõ chữ Hán & Latin Fallback*: Hỗ trợ cả gõ IME tiếng Trung thật trên điện thoại và gõ fallback bằng pinyin không dấu trên máy tính.

#### `TASK-4.5`: SRS Phòng Đọc Hiểu & Chấm Ngữ Điệu (`srs-review.html?mode=reading`)
- **Mục tiêu**: Đọc to bài khóa và chấm thanh điệu tiếng Trung qua microservice FastAPI.
- **Tiêu chí kiểm tra**:
  1. *Thu âm Micro*: Xin quyền micro an toàn, ghi âm định dạng WAV 16kHz mono.
  2. *Chấm điểm Ngữ điệu F0 Chao 5-scale*: Phân tích đường cong cao độ F0, so sánh với mẫu thanh điệu 1, 2, 3, 4, 5 (thanh nhẹ).
  3. *Hiển thị trực quan*: Biểu đồ thanh điệu giúp người học biết mình phát âm lệch ở đâu.

---

### CHẶNG 5: KHÔNG GIAN CÁ NHÂN & GHI CHÚ
#### `TASK-5.1`: Sổ Tay Ghi Chú Cá Nhân (`personal-notes.html`)
- **Mục tiêu**: Quản lý ghi chú học tập an toàn, tiện lợi.
- **Tiêu chí kiểm tra**:
  1. *Thao tác Ghi chú*: Thêm, sửa, xóa ghi chú gắn liền với từ vựng hoặc bài học.
  2. *Bộ lọc & Tìm kiếm*: Lọc theo thẻ tag, tìm kiếm theo từ khóa trong nội dung ghi chú.
  3. *An toàn DOM*: Ngăn chặn tuyệt đối tấn công XSS thông qua nội dung ghi chú.

---

### CHẶNG 6: KHU VỰC QUẢN LÝ NỘI DUNG (CREATOR & MODERATOR)
#### `TASK-6.1`: Cổng Điều Phối & Creator Studio (`management.html`, `creator-lessons.html`, `creator-import.html`)
- **Mục tiêu**: Tạo và quản lý học liệu dành cho vai trò Creator.
- **Tiêu chí kiểm tra**:
  1. *Cổng điều phối*: Hiển thị đúng các thẻ chức năng theo vai trò của người dùng (Creator, Moderator, Admin).
  2. *Tạo bài học mới*: Form tạo bài học, chọn từ vựng, kiểm tra giới hạn 20 từ/bài.
  3. *Nhập liệu hàng loạt*: Công cụ nhập dữ liệu từ CSV/JSON, xem trước và kiểm tra tính hợp lệ trước khi lưu.

#### `TASK-6.2`: Moderator Queue & Thẩm Định Bài Học (`moderator-queue.html`, `moderator-review.html`)
- **Mục tiêu**: Quy trình thẩm định nội dung khách quan, minh bạch.
- **Tiêu chí kiểm tra**:
  1. *Cấm Tự Phê Duyệt (Self-Review Invariant)*: Creator không thể tự phê duyệt hoặc tự từ chối bài học do chính mình tạo ra.
  2. *Giao diện Review*: Xem chi tiết bài học, nghe thử âm thanh, kiểm tra từ vựng, nhập lý do phê duyệt/từ chối.
  3. *Lịch sử Kiểm duyệt*: Lưu vết đầy đủ các quyết định kiểm duyệt vào hệ thống.

---

### CHẶNG 7: QUẢN TRỊ HỆ THỐNG & BẢO MẬT (ADMIN)
#### `TASK-7.1`: Quản Trị Tài Khoản & Phân Quyền (`admin-accounts.html`, `admin-roles.html`)
- **Mục tiêu**: Quản trị tài khoản an toàn, bảo vệ tài khoản quản trị tối cao.
- **Tiêu chí kiểm tra**:
  1. *Danh sách Tài khoản*: Xem, tìm kiếm, kích hoạt/khóa tài khoản, gán vai trò.
  2. *Bảo Vệ Admin Cuối Cùng (Last Admin Invariant)*: Chặn cứng hạ quyền hoặc khóa tài khoản Admin hoạt động duy nhất.

#### `TASK-7.2`: Quản Trị Bài Học, Từ Vựng & Bộ Thủ (`admin-lessons.html`, `admin-vocabulary.html`, `admin-radicals.html`)
- **Mục tiêu**: Quản trị kho dữ liệu học liệu tổng thể của toàn hệ thống.
- **Tiêu chí kiểm tra**: CRUD dữ liệu, kiểm tra ràng buộc toàn vẹn khóa ngoại và liên kết tệp media.

#### `TASK-7.3`: Nhật Ký Kiểm Toán & Trung Tâm Xác Minh UI (`admin-audit-logs.html`, `verification-center.html`)
- **Mục tiêu**: Giám sát an ninh và kiểm thử trực quan trên giao diện web.
- **Tiêu chí kiểm tra**:
  1. *Audit Logs*: Tra cứu nhật ký hành động quản trị, làm mờ mật khẩu và token nhạy cảm (`AuditDataSanitizer`).
  2. *Verification Center*: Chạy kiểm thử trực quan DOM Sinks, CSP, Unit tests ngay trên trình duyệt.

---

### CHẶNG 8: MÔI TRƯỜNG ĐÁM MÂY & THIẾT BỊ THỰC TẾ
#### `TASK-8.1`: Triển Khai GitHub Pages & Subpath URL Safety
- **Mục tiêu**: Đảm bảo 25 trang web, âm thanh MP3 và nét chữ hoạt động không lỗi 404 trên web tĩnh.

#### `TASK-8.2`: Kiến Trúc Render Container & Database TiDB Cloud
- **Mục tiêu**: Đảm bảo backend Java và FastAPI chạy bền bỉ dưới 512MB RAM, sao lưu TiDB định kỳ.

#### `TASK-8.3`: Kiểm Thử Thực Tế Trên Thiết Bị Di Động Thật (Mobile Physical Device)
- **Mục tiêu**: Trực tiếp kiểm thử bàn phím ảo, gõ tiếng Trung IME và vẽ chữ Hán cảm ứng bằng tay thật qua mạng Wi-Fi LAN (`npm run serve:mobile`) hoặc Cloud Tunnel.

---

## 4. NHẬT KÝ PHỐI HỢP & GHI NHẬN LỖI (AUDIT LOGS & USER FEEDBACK)

*(Khu vực này được cập nhật liên tục qua từng nhiệm vụ khi tiến hành)*

| Nhiệm vụ | Thời gian | Phát hiện của Agent | Ý kiến / Lỗi của Người Dùng | Hành động & Kết quả khắc phục |
|---|---|---|---|---|
| `TASK-1.1` (Trang chủ) | 2026-10-26 | Phát hiện 4 vấn đề: (1) Lẫn lộn chữ Phồn thể 學, 憶, 課, 準; (2) Thẻ mẫu thiếu tương tác âm thanh; (3) Cột 4 lộ trang dev ui-verification; (4) Lặp lại nhiều câu chữ & banner CTA. | (1) Xóa 2 phần khoanh đỏ: bỏ 2 nút phụ thẻ mẫu tự, xóa bỏ banner CTA cuối trang; (2) Chuẩn hóa 4 cột tính năng: Bộ thủ, Từ vựng, Bài học, Ôn tập SRS; (3) Đưa mục "Bài học" lên thanh Navbar ngang nằm giữa "Từ vựng" và "Ôn tập" trên toàn bộ 12 trang web. | **ĐÃ HOÀN TẤT & KHÓA CHẶT**: (1) Đã xóa 2 nút phụ dưới thẻ mẫu tự `学`; (2) Đã xóa bỏ toàn bộ khối banner CTA rườm rà ở cuối trang; (3) Chuẩn hóa 4 cột tính năng (214 Bộ thủ, 1.068 Từ vựng, 50 Bài học, Ôn tập SRS); (4) Đồng bộ mục "Bài học" lên Navbar giữa "Từ vựng" và "Ôn tập" trên 12 trang web; (5) Cập nhật `vocabulary.browser.mjs`, `homepage-audit.test.mjs`. PASS 1.029/1.029 fast tests, 12/12 lessons tests, 13/13 vocab tests, 5/5 foundation tests. Commit `4b832c3`. |
| `HOTFIX-NAV` (Bài học vs Ôn tập) | 2026-10-26 | Phát hiện lỗi phân hệ giữa Bài học & Ôn tập: (1) `nav.js` còn chứa `lessons.html` & `lesson-detail.html` trong `REVIEW_HUB_SUBPAGES` khiến khi truy cập "Bài học" lại tự động nhảy sáng tab "Ôn tập"; (2) `lesson-detail-page.js` gán cứng `this.group = 'hsk1'` khi có `lessonId`, biến nhánh `else` thành dead code khiến mọi bài học đều hiển thị breadcrumb và nút back trỏ về "Ôn tập"; (3) Static HTML trên `lesson-detail.html` và `srs-settings.html` thiếu đồng bộ link back/active; (4) Footer 5 trang web (`lessons.html`, `lesson-detail.html`, `srs-review.html`, `srs-dashboard.html`, `srs-settings.html`) bỏ sót "Bài học" giữa "Từ vựng" và "Ôn tập". | Lỗi tab Bài học và Ôn tập bị xung đột / lẫn lộn, đây là 2 phân hệ độc lập. | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**: (1) Tách bạch `LESSON_HUB_SUBPAGES` và `REVIEW_HUB_SUBPAGES` trong `nav.js#syncActiveNavLinks`, hỗ trợ query param `?group=` để khi xem chi tiết chặng SRS thì sáng tab "Ôn tập", xem bài học công khai thì sáng tab "Bài học"; (2) Sửa `this.group = params.get('group') || null;` để khi vào từ `lessons.html` (chỉ có `?id=X`), breadcrumb chuẩn là `Trang chủ > Bài học > [Tên bài]` và các nút back đều trỏ về `lessons.html`; (3) Đồng bộ footer links trên toàn bộ 5 trang web có chứa "Bài học"; (4) Thêm unit tests mở rộng trong `nav-active-sync.test.mjs` và `lessons-catalog.test.mjs`. PASS 1.048/1.048 fast tests, 74/74 E2E tests, 26/26 browser tests. Commit `dcad9d7`. |
| `TASK-1.2` (Xác thực & Hồ sơ cá nhân) | 2026-10-26 – 2026-10-27 | Phát hiện 5 vấn đề: (1) Trải nghiệm tải ảnh đại diện thô ráp do bắt dán URL ảnh web trực tiếp; (2) Thiếu nút bật/tắt hiển thị mật khẩu gây tỷ lệ bỏ form cao; (3) Nhãn "Email hoặc Số điện thoại" gây hiểu nhầm khi không có SMS gateway; (4) Bố cục Hồ sơ cá nhân lặp lại thông tin 2 lần (hộp định danh trên đỉnh lặp lại họ tên, avatar, email giống hệt form bên dưới); (5) Tab Cài đặt chứa cảnh báo localStorage và khung mã kỹ thuật hệ thống không cần thiết cho học viên. | (1) Cho phép chọn ảnh đại diện từ thư mục máy tính/điện thoại; (2) Tra cứu internet và xóa luôn ô link URL ảnh, chỉ để tải ảnh từ thư mục; (3) Thiết kế lại giao diện hồ sơ theo đúng bản vẽ ASCII mockup; (4) Xóa hẳn ô hộp màu xám thừa thãi ở đầu trang (cả ảnh lẫn chữ); (5) Tab Cài đặt để màu xám không để màu xanh; (6) Xóa bỏ dòng lưu ý localStorage và xóa khối "Tài khoản & Định danh hệ thống". | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Nút Ẩn/Hiện Mật Khẩu (Show/Hide 👁️)**: Hàm `setupPasswordToggle()` dùng chung tại `ui.js` phủ kín `login.html`, `register.html`, `profile.html`; (2) **Quên Mật Khẩu**: Modal khôi phục mật khẩu đạt chuẩn WCAG 2.2 trên `login.html`; (3) **Overhaul Tải Ảnh Đại Diện**: Tra cứu chuẩn NN/g & Material Design, xóa hoàn toàn `#profileAvatarUrlInput`, nén ảnh bằng HTML5 Canvas 160x160 JPEG Data URL, hỗ trợ Drag & Drop với bộ đếm `dragCounter` chống nháy, lưu `localStorage` và đồng bộ Navbar; (4) **Tái Thiết Kế Hồ Sơ Theo Mockup**: Khởi đầu trực tiếp bằng 2 tab, tab Cài đặt dùng màu xám trung tính `#6c757d` triệt tiêu màu xanh Bootstrap `#0d6efd`, mục Ảnh đại diện nằm ngang, bố cục 2 cột cho Họ tên và Email `(🔒 Không đổi)`, cặp nút Cinnabar Red và Viền xám; (5) **Dọn Dẹp Đầu Trang**: Xóa bỏ hoàn toàn khối hộp ở đầu trang khỏi màn hình hiển thị, lưu giữ metadata dạng `visually-hidden` bảo toàn Single H1 Rule và test runner; (6) **Tinh Gọn Cài Đặt**: Xóa bỏ `localSettingsNotice` và khối "Tài khoản & Định danh hệ thống". PASS 1.048/1.048 fast tests, 74/74 E2E tests, 0 horizontal overflow. Commits `72b72be`, `8c207ec`, `efccf06`, `0790e47`, `7a2b56f`, `872d73d`. |
| `TASK-2.1` (Từ vựng HSK 1–3) | 2026-10-27 | Phát hiện 6 điểm khi rà soát toàn diện: (1) `demoFallbackEngine` chỉ lọc `query.hskLevel` trong khi `vocabulary-page.js` gửi `query.hsk`; (2) Tab bộ lọc HSK có `min-height: 48px`; (3) Dropdown "Lọc theo chủ đề" rỗng; (4) Modal từ vựng không có nút "Luyện viết chữ này" do đã nhúng trực tiếp `VocabWritingOrchestrator` vào `#modalVocabWritingSection`; (5) Modal từ vựng không có nút "Thêm vào sổ tay" ở footer (dọn dẹp theo thiết kế tối giản đã được khóa bởi E2E tests `VMR-01`, `VCR-03`); (6) `vocabulary-page.js` còn sót dead code: các selector DOM không tồn tại (`groupBanner`, `groupTotalCount`, `groupLearnedCount`, `groupDueCount`, `groupStatusBadge`, `vocabBtnSrsReview`, `vocabBtnExploreLessons`, `pageSizeSelect`), event listener `pageSizeSelect`, hàm `updateGroupOverview` và unused import `authManager`. | 2, 3, 4, 5 không cần thực hiện (đây là thiết kế có chủ đích). Chỉ thực hiện 1, 6 và dọn những phần code thừa cần bỏ đi. | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Tương thích bộ lọc HSK Demo Fallback**: Cập nhật `demo-fallback-engine.js` nhận diện `query.hsk !== undefined ? query.hsk : query.hskLevel` và kiểm tra `level !== null && !isNaN(level)`. Lọc chuẩn xác HSK 1 (300 từ), HSK 2 (200 từ), HSK 3 (500 từ), tổng 1.068 từ; (2) **Dọn dẹp triệt để dead code**: Xóa import `authManager`, xóa các selector DOM rỗng, xóa event listener `pageSizeSelect`, xóa bỏ phương thức `updateGroupOverview` và các lệnh gọi thừa trong `loadCatalog`; (3) **Bổ sung Unit Test**: Thêm Suite 13 vào `tests/frontend/unit/vocabulary/vocabulary-catalog.test.mjs` kiểm tra trọn vẹn cả `query.hsk` và `query.hskLevel`; (4) **Kiểm thử toàn diện**: PASS 1.050/1.050 fast tests (259 suites), 74/74 E2E tests (Tiers 1–4), 29/29 browser tests (`vocabulary.browser.mjs`, `vocab-card-elements-removed.browser.mjs`, `vocab-modal-refactor.browser.mjs`, `vocab-to-radicals-navigation.browser.mjs`, `vocabulary-srs-navigation.browser.mjs`). Commit `ca12282`. |
| `TASK-2.2` (214 Bộ thủ Khang Hy) | 2026-10-27 | Rà soát toàn diện: (1) 214/214 bộ thủ Khang Hy đầy đủ, 214/214 file MP3 vật lý có subpath URL resolver; (2) Tab 50 thông dụng và tab 214 đầy đủ hoạt động chuẩn WAI-ARIA tablist; (3) Modal luyện viết nét HanziWriter và giải nghĩa chiết tự sư phạm 100% không placeholder; (4) Khác biệt so với lộ trình: chưa có bộ lọc số nét 1-17 nét và chưa có danh sách từ vựng HSK trong modal bộ thủ; (5) Dead code cần dọn: Hàm `calculatePagination` không dùng, thẻ audio ẩn `<audio id="modalAudioPlayer">` thừa, khung `<video id="modalVideoPlayer">` và khối code kiểm tra `videoWritingUrl` thừa, thẻ ẩn `#radicalGrid` thừa. | Chỉ triển khai C: bỏ phần thừa. Giữ nguyên thiết kế tinh gọn cho các mục khác. | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Dọn dẹp DOM thừa**: Xóa thẻ neo cũ `#radicalGrid`, xóa thẻ audio ẩn `#modalAudioPlayer`, xóa bỏ khối khung video demo nét viết `#modalVideoWritingSection` & `#modalVideoPlayer` trong `radicals.html`; (2) **Dọn dẹp mã nguồn controller**: Xóa import `sanitizeResourceUrl`, xóa hàm chết `calculatePagination`, xóa các tham chiếu DOM tương ứng trong `bindDomElements`, xóa logic xử lý video thừa trong `openDetailModal` và `closeDetailModal` trong `radicals-page.js`; (3) **Cập nhật Unit Tests**: Loại bỏ import thừa `calculatePagination` trong `radicals-catalog.test.mjs`; (4) **Kiểm thử toàn diện**: PASS 78/78 unit tests (`radicals-catalog.test.mjs`, `kangxi-radicals-comprehensive-audit.test.mjs`), 15/15 browser tests (`radicals.browser.mjs`), 2/2 nav tests (`vocab-to-radicals-navigation.browser.mjs`), 1.050/1.050 fast tests (`verify:frontend:fast`), 74/74 E2E tests (`runner.mjs --tier=all`). |
| `TASK-3.1` (Phần 1: Danh mục `lessons.html`) | 2026-10-27 | Rà soát trang danh mục bài học: (1) Breadcrumb "Trang chủ / Bài học" thừa khi đã có Navbar ngang; (2) Thanh công cụ chứa các liên kết thừa: "Trung tâm Ôn tập →", "Xem theo Cấp độ HSK →", bộ chọn số bài "[20 / trang]", text đếm "Hiển thị 1–20 / 50 bài học"; (3) Phân trang bài học chưa có First/Last (`<< < 1 2 3 > >>`) và đang căn giữa thay vì căn phải như Từ vựng và Bộ thủ. | Xóa "Trang chủ / Bài học" vì thao tác trên thanh ngang; xóa "Trung tâm Ôn tập →", "Xem theo Cấp độ HSK →", "Hiển thị 1–20 / 50 bài học", "Hiển thị: [20 / trang]"; chuẩn hóa phân trang đồng nhất với bộ thủ, từ vựng và đưa phân trang sang bên phải. | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Xóa Breadcrumb**: Bỏ thẻ breadcrumb trên `lessons.html`; (2) **Dọn dẹp Toolbar**: Loại bỏ `#linkReviewHubHeader`, `#linkHskCurriculumHeader`, `#pageSizeSelect`, `#lessonCatalogCount`; (3) **Chuẩn hóa Phân trang First/Last**: Bổ sung `firstPageBtn` (`<<`) và `lastPageBtn` (`>>`), hỗ trợ `aria-label` chuẩn WAI-ARIA, căn lề phải (`justify-content-end`); (4) **Cập nhật Unit & Browser Tests**: Cập nhật Suite 3 & Suite 12 trong `lessons-catalog.test.mjs`, `lessons.browser.mjs`. Commits `e557ffd`, `7fc6806`, `9abe40f`. |
| `TASK-3.1` (Phần 2: Chi tiết `lesson-detail.html`) | 2026-10-27 | Rà soát toàn diện trang chi tiết bài học: (1) Breadcrumb đầu trang thừa; (2) Huy hiệu "Tra từ vựng ↗" & "Tra bộ thủ ↗" gây rối mắt; (3) Bất đối xứng màu sắc 4 nút luyện tập SRS (Flashcard đỏ, Viết/Nghe/Đọc xám); (4) Nút loa phát âm không kêu do thiếu listener; (5) Banner CTA cuối trang rườm rà; (6) Ghi chú cá nhân trong bài học chưa đồng bộ với Flashcard ôn tập; (7) Modal Luyện viết chữ Hán hiển thị dòng tiến trình chữ, nút "Chữ kế →", nút "✍️ Luyện viết từ này" và nhãn `#1: 谢` trên khung vẽ. | (1) Xóa Breadcrumb (Đầu trang); (2) Xóa "tra từ vựng"; (3) Đổi 3 nút xám sang màu đỏ đồng bộ với Flashcard; (4) Sửa loa nghe đang không nghe được; (5) Bỏ thanh ngang cuối cùng đi; (6) Đồng bộ ghi chú này với ghi chú ở phần Flashcard trong Ôn tập; (7) Trong phần Luyện viết xóa dòng "[谢] Đang trình chiếu thứ tự nét...", ô "chữ kế ...", ô "luyện viết từ này", "#1: 谢" ở cả 3 tab (ảnh 1). | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Xóa Breadcrumb**: Loại bỏ thẻ breadcrumb trên `lesson-detail.html`, controller phòng vệ an toàn null; (2) **Xóa Huy Hiệu**: Xóa `vocabLinkBadge` và `linkBadge`; (3) **Đồng Bộ Nút Đỏ**: Cả 4 nút SRS mang class `btn-chinese-primary`; (4) **Sửa Loa Phát Âm**: Gắn listener gọi `playPronunciation({ text, audioUrl, button })`; (5) **Xóa Banner Cuối Trang**: Loại bỏ `section` banner; (6) **Đồng Bộ Ghi Chú 2 Chiều**: `notes-modal.js` đồng bộ trực tiếp với `srs-review-page.js` qua `localStorage` (`srs_vocab_note_${userId}_${vocabId}` và `srs_vocab_note_${vocabId}`), hỗ trợ tạo/sửa/xóa và fallback offline; (7) **Tinh Gọn Modal Luyện Viết**: `statusText` đổi sang `visually-hidden` (WCAG 2.2 SC 4.1.3), xóa nút `nextBtn` ("Chữ kế →"), xóa nút `practiceLink` ("✍️ Luyện viết từ này"), xóa nhãn `#1: 谢` trên khung vẽ ở cả 3 tab (*Cách viết*, *Luyện nét*, *Luyện viết*); (8) **Kiểm thử**: Cập nhật `a11y.browser.mjs` và `lessons.browser.mjs` (thêm mock audio route cho `LB7`). PASS 1.051/1.051 fast tests, 12/12 lessons browser tests, 19/19 a11y tests, 7/7 writing dialog tests, 74/74 E2E tests. Commit `2f2406a`. |
| `TASK-4.1` (SRS Dashboard & Cài đặt học tập) | 2026-10-27 | Rà soát toàn diện bảng điều khiển SRS & cài đặt: (1) Test browser `SD-09` trong `srs-dashboard.browser.mjs` fail do kỳ vọng navbar 4 mục cũ thay vì 5 mục chuẩn (thêm "Bài học"); (2) `validateSrsSettings` trong `srs-dashboard-page.js` thiếu chặn trên `num > 100` (vi phạm Invariant 6); (3) Hơn 120 dòng dead code và selector DOM form không tồn tại trong `srs-dashboard-page.js`; (4) Breadcrumb thừa trên `srs-dashboard.html`; (5) `srs-settings.html` gây trùng lặp với `profile.html#settings`; (6) "Thẻ đến hạn" chỉ có Đọc, Nghe, Viết, thiếu hẳn Flashcard; (7) Cài đặt kích thước ô chữ Mễ (170px vs 200px) và tự động phát lại nét trong `profile.html#settings` chưa kết nối sang phòng Luyện viết SRS. | Thực hiện những phát hiện của bạn; "thẻ đến hạn" đang thiếu flashcard; xóa `srs-settings.html` đi không nên để trùng lặp; những phần về học tập trong `profile.html#settings` phải sử dụng được. | **ĐÃ HOÀN TẤT & KHÓA CHẶT 100%**: (1) **Sửa test SD-09**: Nhận diện đúng 5 liên kết trên thanh navbar thống nhất kèm "Bài học"; (2) **Khóa Chặt Invariant 6**: Bổ sung `else if (num > 100)` cho `validateSrsSettings` trong `srs-dashboard-page.js`; (3) **Dọn Dẹp Dead Code**: Loại bỏ hoàn toàn các selector form rỗng và các phương thức thừa khỏi `srs-dashboard-page.js`; (4) **Xóa Breadcrumb**: Loại bỏ breadcrumb đầu trang trên `srs-dashboard.html`, giao diện tinh gọn, thoáng đãng; (5) **Bổ Sung Flashcard**: Thêm badge `Flashcard` (`#statCardsDueFlashcard`) vào khối phân rã "Thẻ đến hạn" bên cạnh Đọc, Nghe, Viết, bao phủ trọn vẹn cả 4 phòng SRS; (6) **Xóa Bỏ Trùng Lặp**: Xóa hoàn toàn tệp thừa `frontend/srs-settings.html`, đồng bộ danh sách trang kiểm thử trong `responsive-layout.browser.mjs` và `challenger-m3-stress.browser.mjs`; (7) **Kích Hoạt Thực Tế Cài Đặt Học Tập**: `profile.html#settings` giới hạn stepper tăng tối đa 100, nút khôi phục an toàn; phòng Luyện viết SRS (`srs-review.html?mode=writing`) tự động nhận diện `HOC_HAN_NGU_WRITING_SETTINGS` (áp dụng kích thước ô chữ Mễ Chuẩn 170px hoặc Lớn 200px, tự động phát lại nét stroke animation khi nạp chữ); (8) **Kiểm thử**: PASS 1.044/1.044 fast tests (258 suites), 74/74 E2E blackbox tests (Tiers 1–4), 9/9 srs-dashboard browser tests, 19/19 a11y tests, 10/10 responsive tests. |
| `TASK-4.2` (SRS Phòng Lật Thẻ Flashcard) | 2026-10-27 | Nâng cấp toàn diện phòng Flashcard SRS theo yêu cầu Reviewer: (1) Thêm nút "✍️ Cách viết" vào mặt sau flashcard; (2) Màn hình hoàn thành bỏ đếm thời gian, hiển thị đủ 5 chỉ số phân rã đánh giá (Tổng thẻ, Học lại, Khó, Tốt, Dễ) và bỏ nút "Ôn lại thẻ cần học lại"; (3) Thuật toán khi đánh "1 - Học lại" trên bài học đã hoàn thành: thẻ phải được ghi nhận Lapse nhưng trước đó Backend ném lỗi 409 CONFLICT; (4) Vòng requeue trong phiên gửi đè rating = 2 lên server làm mất trạng thái đến hạn; (5) **Phát hiện mới từ Reviewer**: Học hết 20 từ trong bài HSK mới nhưng chỉ hiện 19 từ và bắt học tiếp từ số 20; (6) Các bài học HSK không hiện nút "⚡ Ôn X từ đến hạn". | (1) Nút Cách viết ở mặt sau flashcard; (2) Tinh gọn màn hình hoàn thành theo đúng yêu cầu; (3) Tối ưu hóa thuật toán SRS cho bài đã hoàn thành; (4) Khắc phục lỗi kẹt tiến độ 19/20 từ; (5) Khắc phục lỗi không hiện từ đến hạn trên HSK. | **TIẾN ĐỘ THỰC HIỆN & TỒN ĐỌNG BÀN GIAO KẾ THỪA**: (1) **Nút Cách Viết Mặt Sau**: Đã thêm `#btnCardBackWriting`, tích hợp `HanziWriter` diễn giải hoạt ảnh thứ tự nét trong ô kẻ chữ điền/mễ. Kiểm nghiệm thực tế trên GitHub Pages: Hoạt động chuẩn 100% (Commit `e9bf98d`); (2) **Màn Hình Hoàn Thành Chuẩn**: Đã bỏ đồng hồ thời gian, hiển thị đủ 5 chỉ số (Tổng, Học lại, Khó, Tốt, Dễ), thay bằng nút `← Về danh mục ôn tập` (Commit `e9bf98d`); (3) **Thuật Toán Lapse & Requeue**: Backend `SrsServiceImpl.java` cho phép lapse sớm (`rating == 1`) không ném 409, Frontend không gửi đè đánh giá của vòng requeue lên server. Kiểm nghiệm thực tế: Chặng 04 hiển thị đúng `⚡ Ôn 2 bộ đến hạn` (Commit `6e44992`); (4) **TỒN ĐỌNG CẦN KẾ THỪA**: Lỗi tiến độ 19/20 và Lỗi ID mock làm mất nút Ôn đến hạn của HSK (Xem chi tiết Mục 5.3 & 5.4). |

---

## 5. HƯỚNG DẪN KẾ THỪA CHO AGENT TIẾP THEO (AGENT HANDOFF & CONTEXT INVARIANTS)

> [!IMPORTANT]
> **Dành cho Agent kế thừa**: Toàn bộ **Chặng 1** (`TASK-1.1`, `TASK-1.2`), **Chặng 2** (`TASK-2.1`, `TASK-2.2`), **Chặng 3** (`TASK-3.1`), và **TASK-4.1** đã hoàn thành $100\%$ và được người dùng thẩm định, duyệt mã nguồn và khóa chặt. Nhiệm vụ hiện tại đang xử lý là **Chặng 4: `TASK-4.2` (SRS Phòng Lật Thẻ Flashcard - SM-2 Algorithm)**.
> Dưới đây là toàn bộ thông tin chi tiết về các cập nhật đã triển khai, các phát hiện kiểm nghiệm thực tế, và phân tích sâu các khúc mắc tồn đọng từ Reviewer để bạn tiếp tục thực thi không bị gián đoạn.

### 5.1. Trạng Thái Mã Nguồn & Baseline Kiểm Thử Hiện Tại
- **Nhánh Git**: `main` (commit mới nhất: `6e44992`).
- **Fast Frontend Verification**: `npm run verify:frontend:fast` (1.044 tests / 258 suites, 100% PASS trong ~16.8 giây).
- **E2E Blackbox Runner**: `node tests/e2e/runner.mjs --tier=all` (74 tests Tiers 1–4, 100% PASS trong ~0.89 giây).
- **WCAG 2.2 Accessibility Suite**: `node --test tests/frontend/accessibility/a11y.browser.mjs` (19/19 tests PASS).
- **Responsive Layout**: Zero document-level horizontal overflow trên toàn bộ 24 trang HTML hiện hữu.
- **Môi trường Cloud Live**:
  * GitHub Pages: `https://khoadzsieucapvippro.github.io/WebLearnChinese/srs-review.html` (Module cache buster `?v=12`).
  * Render Cloud Backend: `https://elearning-backend-pwyi.onrender.com` (Health status: UP).
  * TiDB Cloud Serverless: MySQL 8.0, Collation `utf8mb4_unicode_ci`, Nonclustered Primary Keys.

---

### 5.2. Toàn Bộ Cập Nhật Đã Triển Khai (Changelog & Commits Đã Đẩy Lên Main)

1. **Commit `e9bf98d` — Nút "Cách viết", Màn hình hoàn thành & Điều hướng danh mục**:
   - **Nút "✍️ Cách viết" (`#btnCardBackWriting`)**: Thêm vào mặt sau Flashcard cạnh nút phát âm loa. Khi click, mở khung `#cardBackWritingSection` tích hợp thư viện `HanziWriter` hiển thị hoạt ảnh thứ tự nét viết chữ Hán trên ô kẻ chữ điền/mễ, có nút `🔄 Phát lại` và `✕ Đóng`.
   - **Màn hình hoàn thành phiên ôn tập**: Xóa bỏ hoàn toàn đồng hồ đếm thời gian theo yêu cầu của Reviewer; bổ sung 5 chỉ số phân rã đánh giá rõ ràng: *Tổng thẻ*, *Học lại (1)*, *Khó (2)*, *Tốt (3)*, *Dễ (4)*; xóa bỏ nút "Ôn lại thẻ cần học lại", thay bằng nút điều hướng an toàn `← Về danh mục ôn tập` (`#btnCompletionBackToCatalog`).

2. **Commit `82c757f` — Cache Buster & Phân tích nét Bộ thủ**:
   - Cập nhật phiên bản script `srs-review-page.js?v=11` trên `srs-review.html`.
   - Bổ sung bộ phân tích stroke parsing cho bộ thủ Khang Hy mở rộng.

3. **Commit `6e44992` — Thuật toán Lapse trên bài đã hoàn thành & Giữ trạng thái Đến hạn**:
   - **Backend (`SrsServiceImpl.java`)**: Cho phép ghi nhận Lapse khi người dùng bấm `rating == 1` (Học lại) trong bài học đã hoàn thành. Thay vì ném lỗi `409 CONFLICT: Thẻ chưa đến hạn ôn tập`, hệ thống reset ngay `intervalDays = 0`, `repetitions = 0` và đặt `nextReviewAt = now`.
   - **Frontend Controller (`srs-review-page.js`)**: Bọc lệnh gọi `apiClient('/srs/review')` trong điều kiện `!queueItem._requeued`. Các lượt làm lại trong phiên chỉ là luyện tập trí nhớ tức thời (working-memory drill), không được gửi đè đánh giá lên server nhằm bảo toàn tuyệt đối trạng thái ĐẾN HẠN đã ghi nhận ở lượt đầu.
   - **Demo Fallback Engine (`demo-fallback-engine.js`)**: Bổ sung cờ `{ isRequeue: true }` phòng vệ cho môi trường offline.
   - **Cache Buster**: Nâng lên `srs-review-page.js?v=12`.

---

### 5.3. Các Khúc Mắc & Lỗi Tồn Đọng Reviewer Vừa Báo (Chi Tiết Phân Tích Kỹ Thuật)

Dựa trên phản hồi mới nhất của Reviewer kèm ảnh chụp thực tế màn hình HSK 1 (`media_1793102374907_b2b70eb9.png`), có **4 khúc mắc trọng yếu** cần xử lý:

#### Khúc mắc 1: Lỗi tiến độ "Học hết 20 từ nhưng chỉ hiện 19 từ và bấm vào lại bắt học từ số 20"
- **Hiện tượng**: Reviewer mở bài học mới trong HSK 1 ("Bài 02 — Phương tiện, Trường học & Thiết bị", lessonId `30003`) gồm 20 từ vựng. Sau khi học hết cả 20 từ và hoàn thành phiên, quay lại trang danh mục:
  * Thẻ Bài 02 chỉ hiển thị: **`Đã học: 19/20 từ vựng (95%)`**.
  * Các nút hành động hiển thị: **`[↻ Học lại]`** và **`[▶ Học tiếp #20 →]`** thay vì `✅ Đã hoàn thành`.
  * Huy hiệu tổng trên thẻ HSK 1 hiển thị: `15 Bài • Đã học 19/300`.
- **Nguyên nhân kỹ thuật gốc (Root Cause)**:
  1. Trong `frontend/js/pages/srs-review-page.js`, tiến độ học bài được lưu vào `localStorage` qua hàm `persistProgress(mode, nextIndex)` với `topicKey = 'topic_30003'`.
  2. Khi người dùng đánh giá thẻ thứ 20 (chỉ số mảng `this.currentIndex = 19`), nếu đánh giá gặp lỗi mạng, lỗi validate hoặc bị chuyển nhánh exception, `this.persistProgress('flashcard', 20)` không được thực thi.
  3. Đặc biệt, trong hàm `showCompletedState()` (khi toàn bộ phiên học kết thúc), hệ thống **KHÔNG có lệnh chốt chặn bắt buộc** ghi đè `progress[topicKey] = vocabCount` (20/20). Do đó, nếu từ thứ 20 bị requeue hoặc có độ trễ bất đồng bộ, `savedIndex` vẫn lưu là 19.
  4. Khi `renderHskTopics` tải lại, nó đọc `savedIndex = 19`. Vì `savedIndex < vocabCount (19 < 20)`, hàm `createChapterCard` rơi vào nhánh `else if (opts.learnedCount < opts.totalCount)`:
     ```js
     const nextIdx = (opts.stoppedIndex !== null ? opts.stoppedIndex : opts.learnedCount) + 1; // 19 + 1 = 20
     btnContinue.textContent = `▶ Học tiếp #${nextIdx} →`; // "▶ Học tiếp #20 →"
     ```
- **Giải pháp dứt điểm cho Agent kế thừa**:
  * Trong `showCompletedState()`: Nếu đang trong phiên học bài (`this.lessonId` hoặc `this.currentChapterIdx != null`), bổ sung ngay lệnh chốt chặn tiến độ hoàn tất $100\%$:
    ```js
    if (this.lessonId && !this.isReviewMode && this.activeAction !== 'due') {
      const topicKey = `topic_${this.lessonId}`;
      const totalWords = this.sessionQueue?.filter(q => !q._requeued)?.length || 20;
      this.persistProgress(this.activeMode, totalWords);
    }
    ```
  * Đảm bảo khi toàn bộ thẻ bài học đã hoàn thành, `learnedCount` đạt đúng `20/20 (100%)` và hiển thị huy hiệu `✅ Đã hoàn thành` thay vì nút `▶ Học tiếp #20 →`.

---

#### Khúc mắc 2: Lỗi "Không hiện từ đến hạn" trên các bài học HSK
- **Hiện tượng**: Reviewer đánh giá "1 - Học lại" cho nhiều từ vựng trong Bài 02, nhưng trên thẻ Bài 02 hoàn toàn **không xuất hiện nút `⚡ Ôn X từ đến hạn`**.
- **Nguyên nhân kỹ thuật gốc (Root Cause)**:
  1. Trong `renderHskTopics(level)` (dòng 11744 `frontend/js/pages/srs-review-page.js`):
     ```js
     const dueCount = vocabList.filter(v => this.isVocabDue(v.vocabId ?? v.itemId ?? v.id)).length;
     ```
  2. `vocabList` lấy từ mảng hằng số tĩnh `HSK1_TOPICS` định nghĩa ở đầu file `srs-review-page.js`. Trong mảng này, các từ vựng mang ID giả lập (mock ID), ví dụ:
     * Chữ `吃` có `vocabId: 46`
     * Chữ `出租车` có `vocabId: 504`
     * Chữ `穿` có `vocabId: 51`
  3. Trong khi đó, Backend TiDB Cloud Serverless lưu ID từ vựng thật trong cơ sở dữ liệu:
     * Chữ `吃` có `itemId: 2045664`
     * Chữ `出租车` có `itemId: 2047129`
     * Chữ `穿` có `itemId: 2045669`
  4. Khi gọi API `GET /api/v1/srs/due?itemType=VOCABULARY`, Render trả về danh sách mang ID thật (`2045664`, `2047129`...).
  5. Hàm `isVocabDue(vocabId)` kiểm tra:
     ```js
     return this.dueItemsCache.vocab.some(v => Number(v.itemId) === Number(targetId));
     ```
     So sánh `2045664 === 46` -> **Luôn trả về `false`**!
  6. Kết quả: `dueCount` của toàn bộ các bài học HSK luôn luôn bằng `0`, khiến nút `⚡ Ôn X từ đến hạn` **bị ẩn hoàn toàn trên 100% các bài học HSK**!
- **Giải pháp dứt điểm cho Agent kế thừa**:
  * **Cách 1 (So sánh theo Hanzi & ID)**: Nâng cấp hàm `isVocabDue`:
    ```js
    isVocabDue(vocabId, hanzi = null) {
      if (!this.dueItemsCache?.vocab) return false;
      const targetId = vocabId != null ? Number(vocabId) : null;
      return this.dueItemsCache.vocab.some(v => {
        if (targetId != null && (Number(v.itemId) === targetId || Number(v.vocabId) === targetId || Number(v.id) === targetId)) {
          return true;
        }
        if (hanzi && v.hanzi === hanzi) {
          return true;
        }
        return false;
      });
    }
    ```
    Trong `renderHskTopics`:
    ```js
    const dueCount = vocabList.filter(v => this.isVocabDue(v.vocabId ?? v.itemId ?? v.id, v.hanzi)).length;
    ```
  * **Cách 2 (Sử dụng API chuẩn Backend)**: Backend Spring Boot đã có sẵn endpoint chuyên dụng:
    `GET /api/v1/srs/lessons/{lessonId}/stats` trả về `LessonSrsStatsResponse` chứa trường `dueCardsCount` (tính trực tiếp từ TiDB cho bài học đó).

---

#### Khúc mắc 3: Trải nghiệm thực tế về nút "Cách viết" và Vấn đề Cache Trình duyệt
- **Xác minh thực tế**: Kiểm thử headless browser trên GitHub Pages thật (`test_cach_viet.mjs`) xác nhận nút `✍️ Cách viết` (`#btnCardBackWriting`) đã tồn tại trên DOM (`display: flex`), khi click mở thành công khung vẽ `HanziWriter` với 2 SVG render hoàn chỉnh.
- **Lý do người dùng chưa thấy**: Trình duyệt client (Chrome/Edge) trên máy Reviewer cache rất mạnh các tệp JavaScript Native Module (`srs-review-page.js`). Dù GitHub Pages đã deploy, trình duyệt vẫn nạp file từ Disk Cache nếu người dùng không nhấn `Ctrl + F5` hoặc mở tab ẩn danh.
- **Khuyến nghị cho Agent kế thừa**: Bổ sung cơ chế auto-timestamp cache-buster hoặc đăng ký kiểm tra version tự động để ép trình duyệt người dùng luôn lấy phiên bản mới nhất.

---

#### Khúc mắc 4: Thuật toán SuperMemo-2 khi đánh "1 - Học lại" trên bài học đã hoàn thành
- Theo quy chuẩn khoa học SRS (SuperMemo SM-2 & Anki Algorithm):
  1. Khi thẻ đã ở trạng thái Graduate (đã học xong bài), việc bấm **1 - Học lại (Again)** được định nghĩa là một **Lapse (Quên kiến thức)**.
  2. Thẻ lập tức bị hạ về bước Relearning: `intervalDays = 0`, `repetitions = 0`, `nextReviewAt = now`, và Ease Factor bị phạt trừ $0.20$ (suy giảm từ 2.50 xuống 2.30 hoặc tối thiểu 1.30).
  3. Trong phiên hiện tại, thẻ được Requeue để ôn tập tức thời.
  4. Lượt làm lại trong phiên chỉ củng cố Short-term Memory, **không được coi là hoàn thành ôn tập dài hạn**, nên thẻ **BẮT BUỘC PHẢI HIỆN NÚT ÔN ĐẾN HẠN** khi quay lại danh mục để người học ôn tập lại vào các ngày tiếp theo.

---

### 5.4. Kế Hoạch Hành Động Cho Agent Kế Thừa (Handover Action Plan)

Khi tiếp nhận phiên làm việc, Agent kế thừa cần thực hiện ngay các bước sau:

1. **Sửa Lỗi 1 (Kẹt tiến độ 19/20 từ vựng)**:
   - Mở [srs-review-page.js](file:///c:/Users/LENOVO/btlm-test%20(2)/btlm-test/elearning-1.0.0-20260819T062551Z-1-002/elearning-1.0.0/elearning-1.0.0/frontend/js/pages/srs-review-page.js).
   - Trong `showCompletedState()`, kiểm tra nếu phiên học bài (`this.lessonId`) hoàn thành thì ép ghi nhận `progress[topicKey] = totalCount` (20/20) để đảm bảo không bị dừng ở 19.
   - Kiểm tra thêm điều kiện tại `submitRating` để đảm bảo thẻ thứ 20 không bị bỏ sót khi lưu tiến độ.

2. **Sửa Lỗi 2 (Hiển thị nút `⚡ Ôn X từ đến hạn` trên HSK)**:
   - Cập nhật hàm `isVocabDue` trong `srs-review-page.js` để nhận thêm tham số `hanzi`.
   - Trong `renderHskTopics`, truyền `v.hanzi` vào `this.isVocabDue(..., v.hanzi)`. Khi đó các từ vựng đã đánh Lapse trên TiDB sẽ khớp chính xác với danh sách HSK và nút `⚡ Ôn X từ đến hạn` sẽ hiển thị ngay lập tức.

3. **Chạy Bộ Kiểm Thử Xác Minh Chuẩn**:
   - Chạy `npm run verify:frontend:fast` (1.044 tests).
   - Chạy `node tests/e2e/runner.mjs --tier=all` (74 tests).
   - Chạy kịch bản kiểm thử trình duyệt thực tế trên GitHub Pages để lấy screenshot nghiệm thu.

4. **Cam Kết Quy Tắc Bất Biến**:
   - Tuân thủ nghiêm ngặt **Zero-Polling Rule** (không dùng `manage_task(Action='status')` lặp lại).
   - Tuân thủ **DOM Safety Invariant** (không dùng `innerHTML` trên dữ liệu động).
   - Không sửa các file migration từ V1 đến V30.

