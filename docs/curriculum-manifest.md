# Danh Mục Giáo Trình Chuẩn Hoá (Curriculum Manifest)

Tài liệu này là **Bản kiểm kê và đặc tả cấu trúc giáo trình chính thức** (*Official Curriculum Inventory Manifest*) cho toàn bộ phân hệ học từ vựng và bộ thủ của nền tảng **WebLearnChinese** theo tiêu chuẩn HSK 3.0 (2025) và Flyway Migration `V30`.

---

## 1. Tổng Quan Chỉ Số Định Lượng

- **Tổng số bài học chính thức**: Đúng **50 bài học** phân chia theo 3 cấp độ HSK.
  - **HSK 1**: 15 bài học (Bài 01 đến Bài 15) — 300 từ vựng.
  - **HSK 2**: 10 bài học (Bài 16 đến Bài 25) — 200 từ vựng.
  - **HSK 3**: 25 bài học (Bài 26 đến Bài 50) — 500 từ vựng.
- **Số từ vựng mỗi bài**: Đúng **20 từ vựng** / bài học.
- **Tổng số từ vựng giáo trình**: Đúng **1,000 từ vựng duy nhất** (không trùng lặp giữa các bài).
- **Tổng số từ vựng trong cơ sở dữ liệu**: **1,068 từ vựng** (1,000 từ giáo trình chính thức + 68 từ vựng bổ trợ nâng cao).
- **Tổng số Bộ thủ Khang Hy**: Đúng **214 bộ thủ** (đầy đủ video hướng dẫn, biến thể, số nét và giải thích sư phạm).
- **Trạng thái bài học**: 100% `Approved` (công khai cho mọi học viên).
- **Tương thích hệ thống**: Kết nối hoàn chỉnh với thuật toán lặp lại ngắt quãng SM-2 (SRS) qua 4 phòng ôn tập: Flashcard, Luyện viết (HanziWriter), Luyện nghe (Web Speech API) và Luyện đọc (Chao 5-scale Tone Sandhi).

---

## 2. Bảng Tổng Hợp 50 Bài Học Chuẩn Hoá

### 2.1. Phân Hệ HSK 1 (15 Bài học — 300 Từ vựng)

| STT | Mã Bài | Tiêu Đề Bài Học | Chủ Đề Trọng Tâm | Số Từ |
|:---:|:---:|:---|:---|:---:|
| 1 | HSK1-01 | **HSK 1 - Bài 01: Chào hỏi & Giao tiếp cơ bản** | Chào hỏi, xưng hô cơ bản, cảm ơn, xin lỗi | 20 |
| 2 | HSK1-02 | **HSK 1 - Bài 02: Phương tiện, Trường học & Thiết bị** | Xe cộ, lớp học, máy vi tính, điện thoại | 20 |
| 3 | HSK1-03 | **HSK 1 - Bài 03: Thời gian, Ăn uống & Cảm xúc** | Buổi trong ngày, món ăn, thức uống, vui buồn | 20 |
| 4 | HSK1-04 | **HSK 1 - Bài 04: Công việc, Ngôn ngữ & Tính từ cơ bản** | Nghề nghiệp, tiếng Hán, to nhỏ, tốt xấu | 20 |
| 5 | HSK1-05 | **HSK 1 - Bài 05: Thời gian, Gia đình & Hoạt động thường nhật** | Bố mẹ, anh em, ngủ nghỉ, làm việc nhà | 20 |
| 6 | HSK1-06 | **HSK 1 - Bài 06: Mua bán, Thầy cô & Số đếm** | Giá cả, tiền tệ, giáo viên, số từ 1-100 | 20 |
| 7 | HSK1-07 | **HSK 1 - Bài 07: Ẩm thực, Đại từ chỉ định & Nơi chốn** | Đồ ăn vặt, đây đó, cửa hàng, bệnh viện | 20 |
| 8 | HSK1-08 | **HSK 1 - Bài 08: Đại từ xưng hô, Mối quan hệ & Đời sống** | Bạn bè, đồng nghiệp, sinh hoạt hàng ngày | 20 |
| 9 | HSK1-09 | **HSK 1 - Bài 09: Lễ nghi, Thời gian & Công việc hàng ngày** | Phép lịch sự, hẹn hò, giờ giấc làm việc | 20 |
| 10 | HSK1-10 | **HSK 1 - Bài 10: Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện** | Hỏi đường, xem đồng hồ, giao tiếp thông dụng | 20 |
| 11 | HSK1-11 | **HSK 1 - Bài 11: Thời tiết, Đại từ & Lịch trình tuần** | Nắng mưa, nóng lạnh, thứ ngày tháng | 20 |
| 12 | HSK1-12 | **HSK 1 - Bài 12: Trang phục, Y tế & Sinh hoạt gia đình** | Quần áo, thuốc men, chăm sóc sức khoẻ | 20 |
| 13 | HSK1-13 | **HSK 1 - Bài 13: Bữa sáng, Chỉ dẫn vị trí & Không gian** | Điểm tâm, trên dưới, trước sau, trong ngoài | 20 |
| 14 | HSK1-14 | **HSK 1 - Bài 14: Hình dáng, Địa điểm & Cuộc sống học đường** | Thư viện, ký túc xá, thi cử, bài tập | 20 |
| 15 | HSK1-15 | **HSK 1 - Bài 15: Đồ vật, Động từ & Biểu đạt giao tiếp** | Đồ dùng cá nhân, hoạt động thể chất, hội thoại | 20 |

---

### 2.2. Phân Hệ HSK 2 (10 Bài học — 200 Từ vựng)

| STT | Mã Bài | Tiêu Đề Bài Học | Chủ Đề Trọng Tâm | Số Từ |
|:---:|:---:|:---|:---|:---:|
| 16 | HSK2-01 | **HSK 2 - Bài 01: Xã giao, Đời sống & Xuất hành** | Gặp gỡ đối tác, đi công tác, phương tiện giao thông | 20 |
| 17 | HSK2-02 | **HSK 2 - Bài 02: Di chuyển, Tàu điện & Cảm nhận** | Tàu ngầm, ga tàu, trải nghiệm du lịch | 20 |
| 18 | HSK2-03 | **HSK 2 - Bài 03: Màu sắc, Xe buýt & Phương hướng** | Đỏ xanh vàng, trạm xe buýt, rẽ trái phải | 20 |
| 19 | HSK2-04 | **HSK 2 - Bài 04: Sân bay, Lớp học & Khách sạn** | Chuyến bay, hành lý, nhận phòng khách sạn | 20 |
| 20 | HSK2-05 | **HSK 2 - Bài 05: Trang phục, Thể thao & Du lịch** | Giày dép, bơi lội, đá bóng, danh lam thắng cảnh | 20 |
| 21 | HSK2-06 | **HSK 2 - Bài 06: Gia đình, Công viên & Thời tiết** | Thăm hỏi họ hàng, dạo phố, khí hậu 4 mùa | 20 |
| 22 | HSK2-07 | **HSK 2 - Bài 07: Sức khỏe, Đồng hồ & Cảm xúc** | Khám bệnh, đo nhiệt độ, hồi hộp, vui sướng | 20 |
| 23 | HSK2-08 | **HSK 2 - Bài 08: Thể thao, Khiêu vũ & Vị trí ngoài trời** | Tập gym, khiêu vũ, cắm trại, sân vận động | 20 |
| 24 | HSK2-09 | **HSK 2 - Bài 09: Sức khỏe, Hiệu thuốc & Giải trí** | Mua thuốc, xem phim, nghe nhạc, rạp hát | 20 |
| 25 | HSK2-10 | **HSK 2 - Bài 10: Vận động, Chuẩn bị & Phương hướng** | Chuẩn bị hành lý, xác định toạ độ, xuất phát | 20 |

---

### 2.3. Phân Hệ HSK 3 (25 Bài học — 500 Từ vựng)

| STT | Mã Bài | Tiêu Đề Bài Học | Chủ Đề Trọng Tâm | Số Từ |
|:---:|:---:|:---|:---|:---:|
| 26 | HSK3-01 | **HSK 3 - Bài 01: Bạn bè, Gia đình & An toàn** | Tình bạn thân thiết, bảo hộ lao động, an toàn | 20 |
| 27 | HSK3-02 | **HSK 3 - Bài 02: Thi đấu, So sánh & Kế hoạch** | Tranh tài thể thao, đối chiếu kết quả, lập kế hoạch | 20 |
| 28 | HSK3-03 | **HSK 3 - Bài 03: Thực đơn, Thành tích & Thành phố** | Gọi món nhà hàng, bảng điểm học tập, đô thị hóa | 20 |
| 29 | HSK3-04 | **HSK 3 - Bài 04: Xuất phát, Sinh nhật & Bánh ngọt** | Tiệc mừng, quà tặng, khởi hành đúng giờ | 20 |
| 30 | HSK3-05 | **HSK 3 - Bài 05: Cơ hội, Điểm số & Phương hướng** | Tìm kiếm cơ hội việc làm, thang điểm, chỉ đường | 20 |
| 31 | HSK3-06 | **HSK 3 - Bài 06: Mùa đông, Động vật & Tiện lợi** | Tuyết rơi, thú cưng, dịch vụ tiện ích công cộng | 20 |
| 32 | HSK3-07 | **HSK 3 - Bài 07: Phương pháp, Cảm mạo & Công việc** | Cách giải quyết vấn đề, điều trị cúm, xử lý sự cố | 20 |
| 33 | HSK3-08 | **HSK 3 - Bài 08: Đường sắt cao tốc, Quốc gia & Lễ tết** | Vé tàu cao tốc, phong tục ngày tết, giao lưu quốc tế | 20 |
| 34 | HSK3-09 | **HSK 3 - Bài 09: Biến cố, Môi trường & Đổi trả** | Bảo vệ môi trường, xử lý khiếu nại mua sắm | 20 |
| 35 | HSK3-10 | **HSK 3 - Bài 10: Hội nghị, Trả lời & Kiểm tra vé** | Tham dự hội thảo, phỏng vấn, soát vé vào cửa | 20 |
| 36 | HSK3-11 | **HSK 3 - Bài 11: Sức khỏe, Gặp gỡ & Quản lý** | Chế độ ăn kiêng, hẹn gặp đối tác, điều hành nhóm | 20 |
| 37 | HSK3-12 | **HSK 3 - Bài 12: Quyết định, Thư từ & Điều hòa** | Ra quyết định kinh doanh, trao đổi email, tiện nghi | 20 |
| 38 | HSK3-13 | **HSK 3 - Bài 13: Dễ dàng, Du học & Hàng xóm** | Chuẩn bị hồ sơ du học, quan hệ láng giềng | 20 |
| 39 | HSK3-14 | **HSK 3 - Bài 14: Giao thông, Bậc thang & Phố xá** | Quy tắc giao thông, quy hoạch đô thị, kiến trúc phố | 20 |
| 40 | HSK3-15 | **HSK 3 - Bài 15: Độ khó, Lớp học & Sự kỳ lạ** | Chuyên đề nghiên cứu, hiện tượng tự nhiên | 20 |
| 41 | HSK3-16 | **HSK 3 - Bài 16: Khởi hành, Bút chì & Dễ dàng** | Đồ dùng học tập, lộ trình du lịch ngắn ngày | 20 |
| 42 | HSK3-17 | **HSK 3 - Bài 17: Nhà cửa, Trang phục & Cảm nhận** | Bất động sản, phong cách thời trang, thị hiếu | 20 |
| 43 | HSK3-18 | **HSK 3 - Bài 18: Toán học, Đồng nghiệp & Đồng ý** | Tính toán số liệu, đàm phán hợp đồng, thống nhất ý kiến | 20 |
| 44 | HSK3-19 | **HSK 3 - Bài 19: Thư viện, Văn hóa & Căn phòng** | Không gian đọc, di sản văn hóa, bài trí phòng ở | 20 |
| 45 | HSK3-20 | **HSK 3 - Bài 20: Phương hướng, Thói quen & Hiệu trưởng** | Lãnh đạo trường học, rèn luyện thói quen tốt | 20 |
| 46 | HSK3-21 | **HSK 3 - Bài 21: Tin tức, Báo chí & Yêu cầu** | Điểm tin thời sự, xuất bản truyền thông, yêu cầu kỹ thuật | 20 |
| 47 | HSK3-22 | **HSK 3 - Bài 22: Trang sách, Tương đồng & Ảnh hưởng** | Trích dẫn tài liệu, so sánh văn phong, tác động xã hội | 20 |
| 48 | HSK3-23 | **HSK 3 - Bài 23: Trò chơi, Hòm thư & Đại hội thể thao** | Giải trí điện tử, thư tín quốc tế, thi đấu Olympic | 20 |
| 49 | HSK3-24 | **HSK 3 - Bài 24: Vận động viên, Vệ sinh & Điều kiện** | Vận động viên chuyên nghiệp, điều kiện sinh hoạt | 20 |
| 50 | HSK3-25 | **HSK 3 - Bài 25: Trọng tâm, Cuộc sống & Bài tập về nhà** | Đúc kết trọng tâm ngữ pháp, bài tập tổng kết | 20 |

---

## 3. Kiến Trúc Đồng Bộ Từ Vựng Giáo Trình & Vòng Đời Lặp Lại Đa Chu Kỳ (Multi-Pass SRS)

### 3.1. Đồng Bộ Hoá Tuyệt Đối 50 Bài Học Với Migration `V30`
Toàn bộ 50 bài học (1.000 từ vựng giáo trình) được đồng bộ nhất quán 100% giữa 4 phân hệ cốt lõi:
1. **Cơ sở dữ liệu Backend**: Migration `V30__seed_standardized_curriculum_50_lessons_1000_words.sql`.
2. **Kho Dữ Liệu Demo Client**: `SEED_LESSONS` và `SEED_SRS_CARDS` trong `frontend/js/api/demo-seed-data.js`.
3. **Phân Hệ Ôn Tập SRS**: `HSK1_TOPICS`, `HSK2_TOPICS`, `HSK3_TOPICS` trong `frontend/js/pages/srs-review-page.js`.
4. **Bộ Nhớ Trình Duyệt Học Viên**: `CURRENT_DATASET_VERSION = 11` trong `frontend/js/api/demo-fallback-engine.js` đảm bảo tự động dọn sạch các bản ghi localStorage cũ bị lệch ID.

Hệ thống đã triệt tiêu hoàn toàn **567 trường hợp lệch vocabId** lịch sử (xung đột ID giữa các bài, ví dụ `出租车` ID 504 bị trùng với `哪些`, `大家` ID 505 trùng với `请问`). Giờ đây mỗi từ vựng trên toàn bộ 50 bài đều sở hữu định danh kinh điển (`canonical vocabId`) duy nhất, ngăn chặn triệt để hiện tượng rò rỉ trạng thái đến hạn từ bài này sang bài khác.

### 3.2. Vòng Đời Lặp Lại Đa Chu Kỳ Khi Học Lại Bài (Lần 3, Lần 4)
Khi học viên ôn tập hoặc học lại một bài học nhiều lần (Lần 1, Lần 2, Lần 3, Lần 4...):
- **Lần 1 (Khởi tạo học mới)**: Cả 20 từ vựng được nạp vào phiên. Đánh giá "1 - Học lại" tạo trạng thái quên (`interval = 0`, `repetitions = 0`), tự động xếp lại vào cuối phiên để học ngay (`requeue`) và giữ nguyên trạng thái ĐẾN HẠN trong danh mục. Đánh giá "2..4" tạo khoảng cách ôn tập đầu tiên (`interval = 1 ngày` hoặc 2 phút ở chế độ test).
- **Lần 2 (Ôn tập sớm / Học lại)**:
  - Nếu đánh giá "1 - Học lại": Quy tắc SuperMemo SM-2 cho phép ghi nhận Lapse ngay lập tức mà không bị chặn bởi kiểm tra đến hạn, cập nhật chính xác số thẻ đến hạn trong danh mục (ví dụ từ 2 thẻ lên 5 thẻ).
  - Nếu đánh giá "2..4" khi thẻ chưa đến hạn: Backend phòng thủ chống gian lận/cày điểm với mã phản hồi `409 CONFLICT` ("Thẻ chưa đến hạn ôn tập"). Frontend bắt lỗi 409 an toàn và chuyển tiếp thẻ tiếp theo mà không ghi đè chu kỳ SM-2.
- **Lần 3 & Lần 4 (Chu kỳ ngắt quãng mở rộng SM-2)**:
  - Thẻ nhớ thành công lần 1: $I(1) = 1$ ngày.
  - Thẻ nhớ thành công lần 2: $I(2) = 6$ ngày.
  - Thẻ nhớ thành công lần 3: $I(3) = \lceil I(2) \times EF \rceil \approx 15$ ngày (với $EF = 2.50$).
  - Thẻ nhớ thành công lần 4: $I(4) = \lceil I(3) \times EF' \rceil \approx 38$ ngày.
  - Bất kỳ khi nào ở lần 3 hay lần 4 học viên đánh giá "1 - Học lại", chu kỳ lập tức quay về $I=0$, $repetitions=0$, $EF$ giảm $0.80$, và từ vựng ngay lập tức xuất hiện trong danh mục cần ôn tập hôm nay.
