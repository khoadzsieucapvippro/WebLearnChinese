# Báo Cáo Nghiên Cứu Benchmark Nền Tảng Học Ngôn Ngữ & Spaced Repetition (SRS)

- **Vị trí tài liệu**: `.agents/research/language-learning-platform-benchmark.md`
- **Ngày tra cứu & kiểm chứng**: 2026-10-10
- **Phạm vi**: E-Learning Platform: Kangxi Radicals & Chinese Vocabulary with SRS
- **Mục tiêu**: Nghiên cứu các sản phẩm thực tế (Duolingo, Anki, Skritter, ChineseSkill) và cơ sở khoa học nhận thức (Cepeda et al., 2006) để đưa ra quyết định kiến trúc cho hệ thống học từ vựng tiếng Trung, phân định rõ ràng giữa Học bài mới, Luyện lại bài tự do (Practice-only) và Ôn tập SRS theo lịch (Scheduled Review).

---

## 1. Cơ sở lý thuyết nhận thức: Spacing Effect & Distributed Practice

### 1.1. Nguồn tra cứu & Thông tin kiểm chứng
- **Tài liệu**: Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). *Distributed practice in verbal recall tasks: A review and quantitative synthesis*. **Psychological Bulletin**, 132(3), 354–380.
- **Mã định danh**: PubMed PMID: [16719566](https://pubmed.ncbi.nlm.nih.gov/16719566/) | DOI: [10.1037/0033-2909.132.3.354](https://doi.org/10.1037/0033-2909.132.3.354).
- **Quy mô nghiên cứu**: Phân tích tổng hợp (meta-analysis) trên 839 đánh giá thực nghiệm từ 317 thí nghiệm trong 184 bài báo khoa học về tác động của luyện tập phân bổ thời gian đối với ghi nhớ từ vựng.

### 1.2. Kết luận khoa học đã xác minh
1. **Khoảng cách học và độ bền trí nhớ (ISI vs RI)**: Khoảng thời gian giữa các lần học (Interstudy Interval - ISI) và khoảng thời gian duy trì trí nhớ mục tiêu (Retention Interval - RI) liên kết chặt chẽ. Để nhớ lâu dài (vài tuần đến vài tháng), khoảng cách ôn tập cần phải giãn dần một cách có hệ thống.
2. **Hiệu ứng lặp lại tập trung (Massed Practice)**: Việc lặp lại một từ vựng nhiều lần liên tiếp trong cùng một buổi học (hoặc cách nhau vài phút) chỉ tạo ra cảm giác quen thuộc tạm thời trong trí nhớ ngắn hạn (working memory), không làm tăng độ bền vững (memory stability) trong trí nhớ dài hạn.
3. **Ý nghĩa kỹ thuật đối với hệ thống SRS**:
   - **Tuyệt đối không tăng khoảng cách ôn tập dài hạn (`interval_days`) chỉ dựa trên nhiều lần bấm đánh giá liên tục trong cùng một buổi**.
   - Cần phân tách rạch ròi giữa:
     - Các bước làm quen ngắn hạn trong buổi học (`LEARNING_STEP`).
     - Các phiên ôn tập dài hạn đúng lịch (`SCHEDULED_REVIEW`).
     - Các lượt luyện tập tự do theo nhu cầu của người học (`PRACTICE_ONLY`).

---

## 2. Benchmark các nền tảng học ngôn ngữ phổ biến

### 2.1. Duolingo
- **Địa chỉ truy cập**:
  - `https://www.duolingo.com/`
  - `https://blog.duolingo.com/guide-to-duolingo-practice-hub/`
  - `https://blog.duolingo.com/how-to-review-lessons-on-duolingo/`
- **Ngày tra cứu**: 2026-10-10
- **Chức năng đã xác minh**:
  - *Quay lại bài cũ (Review Previous Units)*: Duolingo cho phép người học cuộn lại bất kỳ unit/lesson nào đã hoàn thành trên lộ trình học và bấm vào để mở lại ("Review"). Việc học lại bài cũ không bị khóa vĩnh viễn, không reset tiến trình của cả cây bài học, và không xóa bỏ trạng thái đã hoàn thành của unit đó.
  - *Practice Hub*: Phân tách rõ ràng giữa bài học cốt lõi theo tuyến tính và trung tâm luyện tập (luyện từ vựng đã học, xem lại các câu trả lời sai, luyện nghe/nói mục tiêu).
  - *Luyện theo nhu cầu (On-Demand Practice)*: Người học có thể vào luyện tập bổ trợ bất cứ lúc nào mà không làm rối loạn thuật toán đo lường bài học chính.
- **Ý tưởng áp dụng vào dự án**:
  - Trên giao diện chi tiết bài học (`lesson-detail.html`), bài học sau khi hoàn thành hoặc đã học hết từ vựng **vẫn luôn có nút hành động "Học lại bài" (Luyện tập tự do)** hoạt động bình thường, không bao giờ bị disable.
  - Cung cấp nút điều hướng rõ ràng: **"Học bài mới"** (nếu còn từ mới), **"Học lại bài"** (luyện tự do toàn bộ 20 từ) và **"Ôn tập SRS"** (dẫn đến phiên ôn thẻ đến hạn).
- **Không nên sao chép**:
  - Không sao chép hệ thống phạt tim/năng lượng (Hearts) làm hạn chế quyền học của học viên.
  - Không sao chép hệ thống gamification phức tạp (bảng xếp hạng League, cược streak, mua vật phẩm ảo) gây loãng trọng tâm học tập.

---

### 2.2. Anki
- **Địa chỉ truy cập**:
  - `https://apps.ankiweb.net/`
  - `https://docs.ankiweb.net/deck-options.html`
  - `https://docs.ankiweb.net/filtered-decks.html`
- **Ngày tra cứu**: 2026-10-10
- **Chức năng đã xác minh**:
  - *New Cards & Learning Steps*: Khi thẻ mới được giới thiệu, thẻ nằm ở trạng thái `Learning`. Anki áp dụng các bước học ngắn hạn (ví dụ mặc định `1m 10m`). Đánh giá *Good* chuyển thẻ sang bước tiếp theo; *Again* đưa thẻ về bước đầu. Thẻ chỉ "tốt nghiệp" (`Graduated`) và chuyển sang thẻ ôn dài hạn (`Review Card`) sau khi vượt qua bước học cuối cùng, bắt đầu với khoảng thời gian tốt nghiệp (`Graduating Interval`, mặc định 1 ngày).
  - *Review Cards & Scheduled Reviews*: Thẻ đã tốt nghiệp được quản lý bởi công thức tính giãn cách (SM-2 hoặc FSRS). Mỗi lần review đúng hạn sẽ cập nhật `interval`, `repetitions`, `ease_factor` và `next_review_at`.
  - *Lapses & Relearning*: Khi quên thẻ trong kỳ ôn dài hạn (*Again*), thẻ không bị xóa hay quay về thẻ mới tinh, mà rơi vào trạng thái `Relearning Steps` để củng cố ngắn hạn trước khi tái hòa nhập lịch dài hạn.
  - *Custom Study / Filtered Decks (Tùy chọn Reschedule)*: Anki cho phép người học tạo Filtered Deck để cày bài, preview thẻ, hoặc ôn tập theo tag. Quan trọng nhất: Anki có tùy chọn **"Reschedule cards based on my answers"**. Nếu tắt tùy chọn này, người học có thể lật thẻ, xem lại và kiểm tra kiến thức tự do mà **hoàn toàn không làm thay đổi lịch ôn dài hạn của thẻ**.
  - *Sự khác biệt SM-2 và FSRS*: SM-2 dựa trên hệ số Ease Factor và phép nhân lũy tiến cơ học; FSRS dựa trên mô hình không gian 3 biến (Retrievability, Stability, Difficulty). Cả hai thuật toán đều yêu cầu phải có khoảng cách thời gian thực tế mới được giãn lịch dài hạn.
- **Ý tưởng áp dụng vào dự án**:
  - **Tách bạch 3 chế độ vận hành**:
    1. **Học bài mới**: Nạp thẻ mới trong bài, áp dụng giới hạn `newCardsPerDay`.
    2. **Luyện lại bài tự do (Practice-only)**: Tương tự cơ chế Filtered Deck tắt Reschedule của Anki. Trả về toàn bộ 20 từ theo đúng `order_index`, cho phép lật thẻ ôn tập bao nhiêu lần tùy ý, không bị giới hạn daily limits, và **tuyệt đối không gửi đánh giá thay đổi `CardProgress` hay tạo `ReviewLog` chính thức**.
    3. **Ôn tập SRS theo lịch (Scheduled Review)**: Lấy các thẻ có `nextReviewAt <= NOW()`, thực hiện đánh giá SM-2 chuẩn mực.
  - Phân tách rõ ràng giữa bước học ban đầu và lịch ôn dài hạn.
- **Không nên sao chép**:
  - Không sao chép hàng chục tham số cấu hình phức tạp của Anki (leech threshold, maximum interval cap, lapse multiplier, burying siblings) gây khó hiểu cho người mới học tiếng Trung sơ cấp.

---

### 2.3. Skritter
- **Địa chỉ truy cập**:
  - `https://skritter.com/`
  - `https://skritter.com/features/`
  - `https://legacy.skritter.cn/demo`
- **Ngày tra cứu**: 2026-10-10
- **Chức năng đã xác minh**:
  - *Handwriting Recognition & Instant Feedback*: Học viên viết chữ trực tiếp trên màn hình/canvas và nhận phản hồi tức thì theo từng nét (stroke-level feedback).
  - *Stroke Order Guidance*: Hướng dẫn thứ tự nét viết đúng chuẩn, sửa sai phong cách viết (writing style corrections).
  - *Active Recall*: Bắt buộc người học tự nhớ và viết ra nét chữ thay vì chỉ thụ động nhìn mặt chữ và nghĩa.
  - *Character Decomposition*: Phân tích chữ Hán thành các bộ phận cấu thành (bộ thủ / radicals và các thành phần cấu tạo chữ).
- **Ý tưởng áp dụng vào dự án**:
  - Tận dụng tối đa module luyện viết chữ Hán có sẵn trong repository (`frontend/js/ui/character-writing/` và `CharacterWritingModal` dựa trên thư viện HanziWriter).
  - Module này đã có sẵn các chế độ: Minh họa nét viết (Stroke Order Animation), Luyện viết từng nét có gợi ý (Practice mode), và Tự viết kiểm tra (Quiz mode).
  - Gắn kết trực tiếp module luyện viết chữ Hán vào modal chi tiết bộ thủ (`radicals.html` và `radicals-page.js`) để thay thế hoàn toàn cho video YouTube bài giảng thụ động.
- **Không nên sao chép**:
  - Không xây dựng lại từ đầu hệ thống nhận diện chữ viết bằng AI/backend riêng biệt; tiếp tục phát huy kiến trúc phía client nhẹ nhàng, an toàn và độc lập của HanziWriter SVG hiện có.

---

### 2.4. ChineseSkill
- **Địa chỉ truy cập**:
  - `https://www.chineseskill.com/`
  - Google Play App Profile
- **Ngày tra cứu**: 2026-10-10
- **Chức năng đã xác minh**:
  - *Bite-Sized Lessons*: Bài học được chia nhỏ theo dung lượng vừa phải (10–20 từ/bài) xoay quanh các chủ đề sơ cấp HSK 1 như Chào hỏi, Số đếm, Gia đình, Trường học, Mua sắm.
  - *Đa dạng hoạt động trong một bài*: Kết hợp chữ Hán, phiên âm pinyin, phát âm chuẩn người bản xứ, nghĩa tiếng bản ngữ và luyện viết nét.
  - *Chế độ Review riêng*: Có tab "Review" tập trung quản lý các từ vựng cần ôn tập bằng flashcard.
- **Ý tưởng áp dụng vào dự án**:
  - Giữ vững cấu trúc 10 bài học sơ cấp chính thức, mỗi bài đúng 20 từ (tổng 200 từ vựng duy nhất, HSK 1).
  - Trên giao diện bài học, phân tách các chuỗi hoạt động rõ mục tiêu: xem danh sách từ vựng, nghe phát âm, luyện viết chữ Hán, học flashcard và ôn tập SRS.
- **Không nên sao chép**:
  - Không tạo các màn hình khóa tính năng (paywall) hay các bước trung gian gây cản trở trải nghiệm học.

---

## 3. Bảng tổng hợp Benchmark

| Nền tảng | Chức năng cốt lõi đã xác minh | Ý tưởng áp dụng cho E-Learning Platform | Điều không nên sao chép |
|:---|:---|:---|:---|
| **Duolingo** | Luyện lại bài cũ bất cứ lúc nào; Practice Hub tách rời bài học tuyến tính. | Người học có thể mở lại bất kỳ bài đã học để luyện tập tự do; điều hướng phân định rõ ràng giữa học mới và luyện lại. | Không sao chép phạt tim (Hearts) và cơ chế gamification/leagues phức tạp. |
| **Anki** | Phân định Learning steps, Relearning, Scheduled reviews; Filtered Decks với tùy chọn tắt Rescheduling. | Thiết lập 3 chế độ: Học mới, Luyện lại bài tự do (không đổi lịch SRS), và Ôn tập SRS theo lịch. | Không sao chép giao diện cài đặt quá nhiều tham số phức tạp của Anki. |
| **Skritter** | Luyện viết chữ Hán tương tác, phản hồi nét tức thì, hướng dẫn thứ tự nét, phân tích bộ thủ. | Khai thác triệt để module `CharacterWritingModal` (HanziWriter) có sẵn cho toàn bộ bộ thủ và từ vựng; thay thế video YouTube. | Không tự dựng engine nhận diện chữ viết riêng biệt ở backend. |
| **ChineseSkill** | Bài học ngắn (bite-sized), chia theo chủ đề thực tế, kết hợp nghe - nhìn - viết - phản xạ. | Hoàn thiện 10 bài học chuẩn 20 từ (200 từ HSK 1 duy nhất); chia luồng thao tác trực quan. | Không tạo paywall và các màn hình chuyển hướng thừa thãi. |

---

## 4. Quyết định kiến trúc (Architectural Decision Records - ADR)

### ADR-01: Phân tách rõ ràng ba chế độ học (Mode A, Mode B, Mode C)
- **Bối cảnh**: Hiện tại, khi người học đã học hết các từ trong một bài, hệ thống coi bài học là "hoàn thành" và các truy vấn candidate SRS (`/api/v1/srs/new-cards?lessonId=...`) trả về danh sách rỗng, khiến người học không thể mở lại bài để luyện tập nếu không có từ mới.
- **Quyết định**:
  1. **Chế độ A — Học bài mới (`STUDY_NEW`)**: Gọi `/api/v1/srs/new-cards?lessonId=...`, trả về các từ vựng chưa có `CardProgress`, chịu giới hạn `newCardsPerDay`. Khi học sinh gửi đánh giá, hệ thống khởi tạo tiến độ SRS.
  2. **Chế độ B — Luyện lại bài tự do (`PRACTICE_ONLY`)**: Gọi `/api/v1/lessons/{id}` (hoặc endpoint luyện tập chuyên biệt), trả về đủ 20 từ theo đúng `order_index`. Giao diện flashcard ở chế độ này **hoạt động ở chế độ tự luyện thuần túy (Flip & Self-test)**, không gọi API `/api/v1/srs/reviews` và **tuyệt đối không thay đổi lịch ôn dài hạn**.
  3. **Chế độ C — Ôn tập SRS theo lịch (`SCHEDULED_REVIEW`)**: Gọi `/api/v1/srs/due-cards`, trả về các thẻ đến hạn ôn (`nextReviewAt <= NOW()`), áp dụng thuật toán SM-2 cập nhật lịch ôn tiếp theo.
- **Hệ quả**: Người học có thể mở lại bài cũ vô số lần mà không làm hỏng dữ liệu phân bổ khoảng cách của thuật toán SRS.

### ADR-02: Duy trì thuật toán SM-2 hiện tại, chuẩn hóa ánh xạ chất lượng và trì hoãn FSRS
- **Bối cảnh**: SM-2 hiện đang được triển khai qua `SrsCalculator.java` với 4 nút đánh giá (Again = 1, Hard = 2, Good = 3, Easy = 4).
- **Quyết định**:
  - Giữ vững SM-2 trong giai đoạn này vì phù hợp với dữ liệu từ vựng sơ cấp và cơ sở hạ tầng hiện hành.
  - Đảm bảo tính nhất quán: Khi một thẻ đang trong giai đoạn học ban đầu (`repetitions == 0`), *Again* giữ thẻ ở bước học ngắn hạn; khi thẻ tốt nghiệp vào lịch ôn dài hạn, *Good* giãn lịch theo Ease Factor ($EF \ge 1.30$).
  - Chỉ xem xét chuyển sang FSRS khi hệ thống thu thập đủ lượng dữ liệu lịch sử review lớn (> 10,000 logs) và có cơ chế tối ưu tham số cá nhân hóa.

### ADR-03: Loại bỏ hoàn toàn tính năng Video YouTube bài giảng trong phân hệ Bộ Thủ
- **Bối cảnh**: Tính năng video bài giảng YouTube qua `video_lesson_url` phụ thuộc vào bên thứ ba, dễ lỗi liên kết, trải nghiệm thụ động và gây ra các vấn đề CSP/nhúng iframe không đồng nhất.
- **Quyết định**:
  - Gỡ bỏ hoàn toàn `video_lesson_url` khỏi database schema (thông qua Flyway migration mới V18), gỡ bỏ khỏi DTO backend, Service, Controller và UI frontend.
  - Bảo toàn 100% cột `video_writing_url` (video hướng dẫn nét viết độc lập nếu có), phát âm audio (`audio_url`), giải thích gợi nhớ (`explanation_vi`) và phát huy tối đa `CharacterWritingModal` tương tác trực tiếp.
