# HƯỚNG DẪN KIỂM THỬ THỰC TẾ: WORKFLOW CREATOR & MODERATOR

Tài liệu này cung cấp đầy đủ tệp dữ liệu mẫu và quy trình kiểm thử thực tế từ bước **Tạo bài học / Nhập Excel** của **Creator** đến bước **Kiểm duyệt bài học** của **Moderator**.

---

## 1. Danh Sách Tệp Kiểm Thử Đã Chuẩn Bị Sẵn

Các tệp được lưu trữ tại thư mục:  
`c:\Users\LENOVO\btlm-test (2)\btlm-test\elearning-1.0.0-20260819T062551Z-1-002\elearning-1.0.0\elearning-1.0.0\test_materials\`

| Tên tệp | Định dạng | Mục đích kiểm thử |
| :--- | :---: | :--- |
| **`bai_hoc_tu_vung_moi.xlsx`** | Excel (.xlsx) | File chuẩn 6 cột (Chữ Hán, Pinyin, Hán-Việt, Nghĩa tiếng Việt, Câu ví dụ, Dịch câu ví dụ). Âm thanh tự động phát âm AI `zh-CN` hoặc Creator tự tải MP3 lên. |
| **`bai_hoc_tu_vung_moi_co_audio.xlsx`** | Excel (.xlsx) | File mở rộng 7 cột bao gồm cột `Âm thanh` (`/assets/audio/custom/...`). |
| **`yuhangyuan.mp3`** | Audio MP3 | Tệp phát âm chuẩn giọng Bắc Kinh cho từ **宇航员** (yǔhángyuán). |
| **`bingqilin.mp3`** | Audio MP3 | Tệp phát âm chuẩn giọng Bắc Kinh cho từ **冰淇淋** (bīngqílín). |
| **`qukuailian.mp3`** | Audio MP3 | Tệp phát âm chuẩn giọng Bắc Kinh cho từ **区块链** (qūkuàiliàn). |

---

## 2. Chi Tiết Các Từ Vựng Mới Trong Tệp Excel
> **Lưu ý**: Cả 3 từ vựng này đều hoàn toàn **chưa có trong cơ sở dữ liệu** (không trùng lặp với 214 Bộ thủ Khang Hy hay 1.068 từ HSK 1–3 hiện có).

1. **宇航员**
   * Pinyin: `yǔhángyuán` (PinyinRaw: `yuhangyuan`)
   * Âm Hán-Việt: `Vũ Hàng Viên`
   * Nghĩa tiếng Việt: `Phi hành gia, nhà du hành vũ trụ`
   * Câu ví dụ: `他从小就梦想成为一名宇航员。`
   * Dịch câu ví dụ: `Từ nhỏ anh ấy đã mơ ước trở thành một phi hành gia.`
   * Tệp audio kèm theo: `yuhangyuan.mp3`

2. **冰淇淋**
   * Pinyin: `bīngqílín` (PinyinRaw: `bingqilin`)
   * Âm Hán-Việt: `Băng Kỳ Lâm`
   * Nghĩa tiếng Việt: `Kem, kem que`
   * Câu ví dụ: `夏天的下午吃冰淇淋真舒服。`
   * Dịch câu ví dụ: `Buổi chiều mùa hè ăn kem thật sảng khoái.`
   * Tệp audio kèm theo: `bingqilin.mp3`

3. **区块链**
   * Pinyin: `qūkuàiliàn` (PinyinRaw: `qukuailian`)
   * Âm Hán-Việt: `Khu Khối Liên`
   * Nghĩa tiếng Việt: `Công nghệ chuỗi khối, blockchain`
   * Câu ví dụ: `区块链技术具有去中心化的特点。`
   * Dịch câu ví dụ: `Công nghệ blockchain có đặc điểm phi tập trung.`
   * Tệp audio kèm theo: `qukuailian.mp3`

---

## 3. Các Bước Kiểm Thử Thực Tế

### Bước 1: Tài khoản Creator nhập file Excel tạo bài học
1. Đăng nhập vào hệ thống với tài khoản có vai trò **`Creator`**.
2. Truy cập trang **Nhập từ vựng qua Excel**: `creator-import.html`.
3. Bấm chọn tệp và chọn tệp **`bai_hoc_tu_vung_moi.xlsx`** trong thư mục `test_materials`.
4. Bấm **"Kiểm tra tệp Excel"** (Bước 1 Preview):
   * Hệ thống sẽ hiển thị bảng Báo cáo thẩm định:
     * Trạng thái tệp: **HỢP LỆ (VALID)**
     * Tổng số dòng: **3**
     * Từ vựng mới: **3** (Chưa từng có trong kho từ điển)
     * Từ vựng trùng: **0**
     * Dòng lỗi: **0**
5. Nhập tiêu đề bài học, ví dụ: `Bài Học Mở Rộng: Công Nghệ & Đời Sống`.
6. Bấm **"Xác nhận tạo bài học"** (Bước 2 Confirm).
   * Hệ thống sẽ tự động tạo bài học mới và chuyển hướng đến trang chỉnh sửa bài học `creator-lesson-editor.html?id=...`.

### Bước 2: Creator tải tệp MP3 và kiểm tra phát âm
1. Tại danh sách từ vựng trong bài học vừa tạo, bấm **Sửa** từ vựng `宇航员`.
2. Bấm nút **"Tải tệp MP3"**, cửa sổ Windows hiện lên:
   * **Thử nghiệm tính năng chống lỗi Cancel**: Bấm **Cancel** trên cửa sổ chọn file của Windows -> **Modal vẫn giữ nguyên vẹn**, không bị mất dữ liệu đang nhập!
   * Bấm lại **"Tải tệp MP3"**, chọn file `test_materials/yuhangyuan.mp3`.
3. Bấm nút **"Nghe thử"** `[🔊 Nghe thử]` -> Trình duyệt phát trực tiếp âm thanh từ tệp MP3 vừa chọn.
4. Bấm **"Lưu thay đổi"**.
5. Bấm nút **"Gửi duyệt bài học"** (Chuyển trạng thái sang `Pending`).

### Bước 3: Moderator kiểm tra và phê duyệt
1. Đăng xuất tài khoản Creator, đăng nhập bằng tài khoản có vai trò **`Moderator`**.
   *(Lưu ý: Hệ thống có cơ chế bảo vệ bất biến nghiêm ngặt - Creator không thể tự duyệt bài do chính mình tạo ra).*
2. Truy cập trang **Kiểm duyệt bài học**: `moderator-review.html`.
3. Chọn bài học `Bài Học Mở Rộng: Công Nghệ & Đời Sống` đang ở hàng đợi `Chờ duyệt`.
4. Xem chi tiết các từ vựng:
   * Từ nào đã được gắn file MP3 sẽ có nút nghe thử MP3 thực tế.
   * Từ nào để trống sẽ có badge `[🔊 AI zh-CN]` cho phép nghe giọng đọc chuẩn AI.
   * Nét vẽ viết chữ Hán của cả 3 từ đều được hệ thống tự động sinh vector động theo bộ nét chuẩn HanziWriter.
5. Bấm **"Phê duyệt bài học"** (hoặc thử nghiệm chức năng **"Từ chối"** kèm lý do nhận xét).
