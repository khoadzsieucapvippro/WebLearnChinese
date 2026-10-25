# WEBLEARNCHINESE — AGENT HANDOFF & ENGINEERING LEDGER (`docs/AGENT_HANDOFF.md`)

> **Tài liệu bàn giao kỹ thuật dài hạn (Single Source of Truth)**
> Tệp này lưu trữ toàn bộ quyết định sản phẩm của chủ dự án, kết quả kiểm toán độc lập (7 phân hệ), trạng thái xác minh báo cáo âm thanh của Gemini, danh sách lỗi P0/P1/P2 kèm bằng chứng mã nguồn (`file:line`), các thay đổi đã thực hiện và kết quả kiểm thử thực tế.
> **Quy tắc bắt buộc cho các phiên Agent tiếp theo:** Luôn đọc tệp này trước khi bắt đầu công việc và cập nhật trạng thái vào tệp này trước khi kết thúc phiên.

---

## 1. TRẠNG THÁI GIT & MÔI TRƯỜNG HIỆN TẠI

- **Nhánh Git (`branch`)**: `main`
- **Commit gốc (`HEAD`)**: `ccd9ef9`
- **Trạng thái cây làm việc (`git status`)**: Chứa các bản vá P0 từ đợt rà soát độ trưởng thành (Request #1) và các bản vá hệ thống phát âm thanh trên điện thoại/máy tính (Request #2), chưa commit để bảo toàn quyền kiểm soát lịch sử Git của nhà phát triển.

---

## 2. QUYẾT ĐỊNH SẢN PHẨM & BẤT BIẾN HỆ THỐNG (PRODUCT DECISIONS & INVARIANTS)

1. **Giữ nguyên kiến trúc Luyện viết chữ Hán (`HanziWriter` + hình học nét chữ tuần tự)**:
   - Mục tiêu sản phẩm là giúp người học nhớ mặt chữ Hán, hướng nét và thứ tự nét (Sequential Stroke-Order Matching), **không phải** nhận diện chữ viết tay tự do (OCR/HWR).
   - Giữ nguyên `CharacterWritingEngine` (`frontend/js/ui/character-writing/character-writing-engine.js`), `VocabWritingOrchestrator` (`frontend/js/ui/character-writing/vocab-writing-orchestrator.js`), `stroke-data-loader.js` và bộ dữ liệu `frontend/assets/hanzi-strokes.json` (1.132 chữ Hán).
   - Không chuyển sang OCR/HWR hoặc viết lại giao diện luyện viết; bảo toàn 3 chế độ `DEMO`, `PRACTICE`, `QUIZ` và luồng luyện viết trong SRS.
2. **Bảo toàn tuyệt đối 3 tài khoản quản lý & RBAC**:
   - Giữ nguyên 3 vai trò quản trị (`Admin`, `Moderator`, `Creator`) và 3 tài khoản seed (`admin@elearning.local`, `moderator@elearning.local`, `creator@elearning.local`) trong `DemoAccountSeeder.java` và `demo-fallback-engine.js`.
   - Bảo toàn JWT (`JwtAuthenticationFilter`), RBAC (`SecurityConfig`), khóa bi quan bảo vệ Admin cuối cùng (`findActiveUsersByRoleForUpdate` trong `UserRepository.java`), cấm Creator tự duyệt bài (`LessonService.java#L412-L416`) và khử nhạy cảm nhật ký kiểm toán (`AuditDataSanitizer.java`).
3. **Không sử dụng dịch vụ Cloud TTS trả phí tại runtime & giữ nguyên chính sách quyền riêng tư âm thanh**:
   - Không gọi API TTS trả phí tại runtime và không gửi bản ghi âm người học cho bên thứ ba.
   - Giữ nguyên chính sách **Zero-Storage** cho bản ghi âm luyện đọc của người học (`ReadingAssessmentService.java`, `speech-service/app/api/routes.py` — xử lý trên RAM, giải phóng `URL.revokeObjectURL` khi hủy hoặc chuyển thẻ).
4. **Bất biến Database & Frontend**:
   - Không sửa đổi hoặc xóa các migration Flyway `V1`..`V30` đã áp dụng (`backend/src/main/resources/db/migration/`).
   - Giữ nguyên kiến trúc Zero-Build Vanilla ES2022 (`frontend/`), cấm tuyệt đối `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML` và inline event handlers (`on*=`).

---

## 3. XÁC MINH BÁO CÁO ĐIỀU TRA AUDIO CỦA GEMINI (10 ĐIỂM BẮT BUỘC)

Đối chiếu báo cáo `.agents/teamwork/teamwork_preview_explorer_survey_audio/survey_report.md` với mã nguồn thực tế:

| # | Điểm kiểm chứng trong báo cáo Gemini | Phân loại ban đầu | Trạng thái sau xử lý | Bằng chứng thực tế trong mã nguồn (`file:line`) |
|---|---|---|---|---|
| 1 | Repository thiếu các tệp vật lý audio phát âm (`.mp3`, `.wav`, `.ogg`) | **`CONFIRMED`** | **`PARTIALLY_FIXED` / `OPEN` (cho 1.282 mục học)** | Kho mã không đi kèm bản thu âm tiếng Trung bản ngữ cho 214 bộ thủ và 1.068 từ vựng; máy chủ build local chỉ có voice `en-US` (`Microsoft David/Zira`), không có bộ tổng hợp tiếng Trung ngoại tuyến có bản quyền. Đã tạo `frontend/assets/audio/manifest.json` và tệp chuẩn `frontend/assets/audio/fixtures/diagnostic-tone.wav` (11.244 bytes PCM WAV) phục vụ kiểm thử E2E/Browser thật mà không gắn giả vào mục từ vựng. |
| 2 | Dữ liệu demo và migration chỉ cung cấp `audioUrl: null` | **`CONFIRMED`** | **`CONFIRMED` (`OPEN` cho dữ liệu âm thanh tĩnh)** | `V1__init_schema.sql#L58,L73` tạo cột `audio_url VARCHAR(500) NULL`; toàn bộ `V2..V30` và `frontend/js/api/demo-seed-data.js` đều để `audio_url` / `audioUrl: null`. |
| 3 | Các nút loa sử dụng cơ chế không đồng nhất giữa các trang | **`PARTIALLY_FIXED`** | **`VERIFIED_FIXED`** | Đã đồng bộ hóa `frontend/js/pages/vocabulary-page.js#L25, #L31, #L385, #L854, #L1160` sang `playPronunciation({ text, audioUrl, button })`, thống nhất hoàn toàn với `radicals-page.js#L412-L419`, `lesson-detail-page.js#L859-L869` và `srs-review-page.js#L14591-L14626`. |
| 4 | Máy chủ tĩnh thiếu MIME type cho các định dạng âm thanh di động | **`ALREADY_FIXED` (`STALE`)** | **`VERIFIED_FIXED`** | `scripts/serve.mjs#L26-L31` và `tests/frontend/utils/static-server.mjs#L32-L37` đã cấu hình đầy đủ `.mp3` (`audio/mpeg`), `.wav` (`audio/wav`), `.ogg` (`audio/ogg`), `.webm` (`audio/webm`), `.m4a` (`audio/mp4`), `.aac` (`audio/aac`) kèm `Accept-Ranges: bytes` (`scripts/serve.mjs#L197`). |
| 5 | Còn lời gọi auto-play không có tương tác người dùng | **`PARTIALLY_FIXED`** | **`VERIFIED_FIXED`** | `renderListeningRoomCard` (`srs-review-page.js#L13416-L13497`) không còn gọi `this.playPronunciation(null)` khi tải trang. Các điểm phát hỗ trợ sau thao tác của người học (`handleWritingItemCompleted` tại `#L13153` và `handleListeningIncorrect` tại `#L13601`) đều đi qua `playPronunciation()` có bảo vệ lỗi và giải phóng nút an toàn. |
| 6 | Có `await` hoặc thao tác bất đồng bộ chen trước lệnh phát trong click flow | **`ALREADY_FIXED` (`STALE`)** | **`VERIFIED_FIXED`** | `srs-review-page.js#L14591-L14626` gọi `playPronunciation()` đồng bộ ngay trong click handler; việc prefetch `/vocabulary/{id}` hoặc `/radicals/{id}` chạy nền không chặn Transient User Activation. |
| 7 | Lỗi `SpeechSynthesis` bị nuốt hoặc giả vờ phát khi thiết bị không có giọng đọc tiếng Trung | **`CONFIRMED`** | **`VERIFIED_FIXED`** | `frontend/js/ui/speech.js#L186-L202, #L980-L1085` đã kiểm tra danh sách voice (`_getAvailableVoices()`, `_getChineseVoice()` hỗ trợ `zh-CN`, `zh_CN`, `cmn-Hans`, `zh*`, `cmn*`). Khi trình duyệt đã nạp danh sách voice (`voices.length > 0`) nhưng không có bất kỳ giọng đọc tiếng Trung nào (rất phổ biến trên Android/iOS hoặc Windows chỉ cài tiếng Anh), hệ thống không giả vờ phát âm mà chuyển ngay sang Tier 3 (`ui_fallback`), mở khóa nút loa và hiển thị thông báo rõ ràng: *"Thiết bị hoặc trình duyệt chưa cài đặt gói giọng đọc tiếng Trung (zh-CN)."* |
| 8 | Gọi `speechSynthesis.cancel()` ngay trước `speak()` trên toàn bộ lần bấm kể cả khi đang rảnh | **`CONFIRMED`** | **`VERIFIED_FIXED`** | Đã sửa tại 2 tầng: (1) `frontend/js/ui/speech.js#L452-L464`: `cancel()` chỉ gọi `window.speechSynthesis.cancel()` khi thực sự có phiên đang nói hoặc chờ (`this._activeUtterance !== null \|\| synth.speaking \|\| synth.pending`); (2) `frontend/js/pages/srs-review-page.js#L10367-L10372, #L13601-L13604`: xóa bỏ lệnh `speechController.cancel()` dư thừa trước `this.playPronunciation(this.dom.btnListeningPlayAudio)`. |
| 9 | Các test hiện tại chỉ dùng mock `Audio` / `SpeechSynthesis`, chưa kiểm chứng luồng phát thật | **`CONFIRMED`** | **`VERIFIED_FIXED`** | Đã bổ sung 6 bài unit test mới (`Tests 14..19` trong `tests/frontend/unit/srs/srs-audio-playback.test.mjs`) và bài kiểm thử trình duyệt thật `SL-06` (`tests/frontend/e2e/srs-listening.browser.mjs#L407-L488`) xác minh tải tệp WAV thật qua HTTP 200, `Content-Type: audio/wav`, sự kiện `playing`, `currentTime > 0` và tự mở khóa nút sau khi phát xong. |
| 10 | Khác biệt giữa dữ liệu local/demo và production DB | **`UNVERIFIED` (Cloud DB)** | **`UNVERIFIED` (Cloud DB)** | Toàn bộ migration `V1..V30` trong kho mã đều để `audio_url = null`. Database TiDB Cloud thực tế không thể truy vấn trực tiếp từ môi trường local khi không có thông tin xác thực prod. |

---

## 4. KIỂM TRA & KHẮC PHỤC 7 LUỒNG ÂM THANH (FLOWS A–G)

| Luồng | Trang / Thành phần | Nút / Phần tử DOM | Tệp và Dòng đã kiểm tra / sửa (`file:line`) | Trạng thái |
|---|---|---|---|---|
| **A** | Từ vựng (`vocabulary.html`) | Nút loa trên thẻ từ vựng (`.vocab-speech-btn`) và trong modal chi tiết (`#modalSpeechBtn`) | `frontend/js/pages/vocabulary-page.js#L25, #L31, #L385, #L854, #L1160`: Chuyển từ `speakHanzi` sang `playPronunciation({ text, audioUrl, button })`; cập nhật `this.currentModalVocab.audioUrl` khi tải chi tiết từ vựng; hủy phát âm khi đóng modal (`#L1416`). | `VERIFIED_FIXED` |
| **B** | Bộ thủ (`radicals.html`) và Chi tiết bài học (`lesson-detail.html`) | Nút loa trên thẻ bộ thủ, modal bộ thủ (`#modalHeroSpeakerBtn`), và danh sách từ vựng bài học | `frontend/js/pages/radicals-page.js#L412-L419, #L1382` và `frontend/js/pages/lesson-detail-page.js#L859-L869`: Sử dụng `playPronunciation({ text, audioUrl, button })` đồng bộ và gọi `speechController.cancel()` khi đóng modal. | `VERIFIED_FIXED` |
| **C** | Ôn tập SRS — Thẻ ghi nhớ (`srs-review.html` Flashcard) | `#btnAudioPronounceFront` và `#btnAudioPronounceBack` | `frontend/js/pages/srs-review-page.js#L10268-L10282, #L12111, #L14591-L14626`: Gọi `playPronunciation` đồng bộ; tự động gọi `speechController.cancel()` trong `renderCurrentCard()` khi chuyển thẻ. | `VERIFIED_FIXED` |
| **D** | Ôn tập SRS — Phòng luyện viết (`srs-review.html` Writing Room) | `#btnWritingAudio` và phát âm khi hoàn thành chữ | `frontend/js/pages/srs-review-page.js#L10324-L10329, #L12111, #L13153`: Hủy âm thanh cũ khi chuyển sang thẻ viết tiếp theo; không để nút loa bị khóa nếu trình duyệt chặn phát tự động. | `VERIFIED_FIXED` |
| **E** | Ôn tập SRS — Phòng luyện nghe (`srs-review.html` Listening Room) | `#btnListeningPlayAudio` | `frontend/js/pages/srs-review-page.js#L10367-L10372, #L13601-L13604`: Loại bỏ lệnh `speechController.cancel()` vô điều kiện trước `playPronunciation()`, khôi phục cơ chế chống bấm lặp (anti-spam) và ngăn lỗi rơi utterance trên trình duyệt di động/Chromium. | `VERIFIED_FIXED` |
| **F** | Ôn tập SRS — Phòng luyện đọc: Nghe mẫu (`srs-review.html` Reading Room) | `#btnReadingSampleAudio` và `#btnReadingPlaySampleAgain` | `frontend/js/pages/srs-review-page.js#L10416-L10428, #L14592-L14597`: Tự động tạm dừng và đưa `this.currentUserAudioElement.currentTime = 0` trước khi phát âm mẫu để không chồng âm thanh với bản ghi cá nhân. | `VERIFIED_FIXED` |
| **G** | Ôn tập SRS — Phòng luyện đọc: Thu âm & Nghe lại bản ghi cá nhân (`srs-review.html` Reading Room) | `#btnReadingStartRecord` và `#btnReadingPlayUserAudio` | `frontend/js/pages/srs-review-page.js#L10454-L10481, #L13787`: Gọi `speechController.cancel()` trước khi bắt đầu thu âm micro và trước khi phát lại bản ghi cá nhân; bổ sung thông báo Toast nếu trình duyệt không phát lại được Blob âm thanh vừa thu. | `VERIFIED_FIXED` |

---

## 5. SỔ CÁI ĐẦY ĐỦ CÁC VẤN ĐỀ KỸ THUẬT (ISSUE LEDGER — P0 / P1 / P2)

### 5.1. Các hạng mục đã sửa và xác minh bằng kiểm thử (`VERIFIED_FIXED`)

1. **[P0-1] GitHub Pages & Demo Mode bị lỗi `isApiConfigured()` trả về `true` cho giá trị mặc định `'/api/v1'`**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/api/api.js#L71-L82`. Nhận diện `*.github.io` hoặc `isDemoModeEnabled()`, kích hoạt `demoFallbackEngine` và hiển thị `#demoSimulationBadge`.
2. **[P0-2] Chấm điểm phát âm Phòng luyện đọc (Reading Room) báo lỗi trên Demo Mode / GitHub Pages**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/api/demo-fallback-engine.js#L1340-L1364`. Bổ sung nhánh xử lý `/srs/reading/status` và `/srs/reading/assess` kèm thông báo mô phỏng trung thực.
3. **[P0-3] Kẹt luồng Ôn tập sớm (Early-Review Lockup) tại 3 phòng thực hành (Viết, Nghe, Đọc)**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/pages/srs-review-page.js#L13337-L13344` (Writing), `#L13641-L13648` (Listening), `#L14298-L14305` (Reading).
4. **[P0-4] Kết nối số lỗi nét viết / dùng gợi ý và điểm phát âm Reading với mức đánh giá SRS (`rating 1..4`)**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/pages/srs-review-page.js#L12945-L12961, #L13183-L13191, #L13301-L13314` (Writing) và `#L14242-L14249` (Reading).
5. **[P0-5] Lỗi phân loại Thanh nhẹ (Neutral Tone 5) và thiếu trường `syllables` trong DTO Backend**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `speech-service/app/core/evaluator.py#L45-L88` và `backend/src/main/java/com/elearning/dto/response/PronunciationAssessmentResponse.java#L27`.
6. **[P0-6] Lỗi HTTP 500 khi truyền tham số `sort` không hợp lệ và thiếu token CSS `--color-primary`**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `backend/src/main/java/com/elearning/exception/GlobalExceptionHandler.java#L212-L227` và `frontend/css/style.css#L92-L97, #L4418-L4430`.
7. **[AUDIO-1] `SpeechController` gọi `speechSynthesis.cancel()` khi đang rảnh và không kiểm tra sự tồn tại của giọng đọc tiếng Trung (`zh`/`cmn`)**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/ui/speech.js#L50-L280, #L452-L464, #L980-L1145` và `tests/frontend/unit/srs/srs-audio-playback.test.mjs#L570-L685`.
8. **[AUDIO-2] Đồng bộ hóa cả 7 luồng phát âm (A–G) về `playPronunciation()`, hỗ trợ `speechRate` trên `HTMLAudioElement`, xử lý subpath GitHub Pages (`resolveSubpathAudioUrl`) và chống chồng chéo với bản ghi cá nhân**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/ui/speech.js#L52-L76, #L475-L505`, `frontend/js/pages/vocabulary-page.js#L385, #L854`, `frontend/js/pages/srs-review-page.js#L10367, #L10454, #L12111, #L13601, #L13787, #L14592`.
9. **[P1-DATA-1] Cô lập tiến độ học tập và ghi chú cá nhân giữa các tài khoản trên cùng trình duyệt**:
   - **Trạng thái**: `VERIFIED_FIXED`
   - **Bằng chứng**: `frontend/js/pages/srs-review-page.js#L162-L250, #L12695-L12980` (`resolveAccountProgressKeys`, `getProgress`, `saveProgress`, `getRadicalNotes`, `getVocabNoteStorageKey`) và `tests/frontend/unit/srs/srs-audit-fixes.test.mjs#L469-L496`.
10. **[P1-AUTH-1] Hoàn thiện vòng đời đăng xuất (`POST /api/v1/auth/logout`) và cấp lại phiên JWT mới sau khi đổi mật khẩu (`POST /api/v1/auth/change-password`)**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**: `backend/src/main/java/com/elearning/service/impl/AuthServiceImpl.java#L148-L179`, `frontend/js/ui/nav.js#L429-L435`, `frontend/js/pages/profile-page.js#L1054-L1080`, `frontend/js/api/demo-fallback-engine.js#L349-L361`.
11. **[P1-MODERATION-1] Hiển thị lý do từ chối bài học (`rejectionReason` & `flaggedFields` từ `MODERATION_LOG`) cho Creator**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**: `backend/src/main/java/com/elearning/dto/response/LessonDetailResponse.java#L25-L26, #L114-L128`, `backend/src/main/java/com/elearning/service/impl/CreatorLessonServiceImpl.java#L147-L163`, `backend/src/test/java/com/elearning/CreatorLessonServiceTests.java#L317-L343`, `frontend/js/pages/creator-lesson-editor-page.js#L177-L244`.

### 5.2. Các hạng mục còn mở hoặc bị chặn bởi môi trường/thiết bị (`OPEN` / `UNVERIFIED` / `WONT_FIX`)

12. **[AUDIO-3] Tạo/nhập bộ tệp âm thanh tĩnh (`.mp3`/`.ogg`) có bản quyền cho toàn bộ 214 bộ thủ & 1.068 từ vựng**:
    - **Trạng thái**: `OPEN`
    - **Nguyên nhân & Việc cần làm tiếp theo**: Môi trường máy trạm hiện tại chỉ có giọng đọc tiếng Anh (`Microsoft David/Zira en-US`), không có công cụ TTS tiếng Trung ngoại tuyến có giấy phép phân phối hoặc bộ thu âm người thật. Hạ tầng `frontend/assets/audio/manifest.json` và `resolveSubpathAudioUrl()` đã sẵn sàng; cần chạy script sinh/nhập tệp âm thanh từ nguồn CC0/CC-BY hoặc mô hình TTS ngoại tuyến được cấp phép rồi cập nhật `manifest.json` / migration `V31`.
13. **[AUDIO-4] Kiểm thử vật lý trên loa điện thoại Android Chrome và iPhone Safari thật**:
    - **Trạng thái**: `UNVERIFIED`
    - **Nguyên nhân & Việc cần làm tiếp theo**: Trong môi trường phát triển chỉ có trình duyệt Chromium tự động (Playwright desktop + mobile viewport 375x667). Cần kiểm tra thực tế trên điện thoại Android Chrome và iOS Safari thật để xác nhận âm lượng, chế độ chuông/im lặng phần cứng (iOS Ringer Switch) và gói giọng đọc hệ điều hành.
14. **[P1-SEC-1] Bổ sung `@PreAuthorize` cấp lớp và Rate Limiting mở rộng**:
    - **Trạng thái**: `OPEN`
    - **Bằng chứng**: Bổ sung `@PreAuthorize` rõ ràng trên `CreatorLessonController`, `ModeratorLessonController`, `UserSrsController`, `PersonalNoteController` để tăng phòng vệ chiều sâu (ngoài `SecurityConfig.java`).
15. **[P1-OPS-1] Cấu hình Production, giới hạn Render Free Tier (750 giờ/tháng), triển khai `speech-service` vào `render.yaml`, Backup & Khả năng phục hồi**:
    - **Trạng thái**: `OPEN`
    - **Bằng chứng**: `render.yaml` hiện mới định nghĩa 1 container `elearning-backend`, chưa định nghĩa container `speech-service` (hoặc nếu chạy cả 2 sẽ vượt 750 giờ/tháng của gói Free). Cần thiết lập quy trình sao lưu định kỳ cho TiDB Cloud và đổi mật khẩu mặc định của 3 tài khoản seed ngay sau khi khởi tạo.
16. **[P2-WRITING-1] Kết nối `CharacterWritingModal` với `lesson-detail-page.js` và mở rộng chế độ `PRACTICE`/`QUIZ` trên modal từ vựng/bộ thủ**:
    - **Trạng thái**: `OPEN`
    - **Bằng chứng**: `lesson-detail-page.js` đã import `CharacterWritingModal` nhưng chưa gắn nút mở modal luyện viết cho từng từ; `vocabulary-page.js#L1100` đang cấu hình `demoOnly: true`.
17. **[P2-SPEECH-1] Kiểm chứng chất lượng chấm thanh điệu của `speech-service` trên tập dữ liệu giọng người thật (300–500 mẫu)**:
    - **Trạng thái**: `OPEN`
    - **Bằng chứng**: `speech-service/test_pipeline.py` hiện kiểm thử bằng sóng âm tổng hợp (synthetic pitch contours); cần thu thập 300–500 mẫu giọng người học thật có gán nhãn để hiệu chuẩn ngưỡng điểm F0.
18. **[WONT_FIX-1] Chuyển đổi luyện viết `HanziWriter` sang mô hình AI OCR/HWR nhận diện chữ viết tay tự do**:
    - **Trạng thái**: `WONT_FIX` (Theo quyết định sản phẩm Mục I.1 của chủ dự án).
19. **[WONT_FIX-2] Sử dụng dịch vụ Cloud TTS trả phí tại runtime hoặc lưu trữ lâu dài bản ghi âm người học**:
    - **Trạng thái**: `WONT_FIX` (Theo quyết định sản phẩm Mục I.3 của chủ dự án).

---

## 6. KẾT QUẢ KIỂM THỬ THỰC TẾ ĐÃ CHẠY

1. `node --test tests/frontend/unit/srs/srs-audio-playback.test.mjs tests/frontend/unit/ui/speech-controller.test.mjs tests/frontend/unit/srs/srs-audio-challenger-edge.test.mjs`:
   - **Kết quả**: **PASS 32/32 tests** (3 suites, 0 failed).
2. `npm run verify:frontend:fast`:
   - **Kết quả**: **PASS 947/947 tests** (228 suites, 0 failed).
3. `node --test tests/frontend/e2e/srs-listening.browser.mjs`:
   - **Kết quả**: **PASS 6/6 tests** (bao gồm `SL-06` kiểm chứng tải tệp WAV thật HTTP 200, `audio/wav`, sự kiện `playing`, `currentTime > 0`, tự mở khóa nút và 0 runtime error).
4. `node tests/e2e/runner.mjs --tier=all`:
   - **Kết quả**: **PASS 74/74 tests** (Tiers 1–4, 0 failed).
5. `python speech-service/test_pipeline.py` & `python speech-service/test_adversarial_m2.py`:
   - **Kết quả**: **PASS 9/9 nhóm test DSP + 10/10 bài test bảo mật** (0 failed).
6. `mvn -f backend/pom.xml test "-Dtest=CreatorLessonServiceTests,LessonServiceTests,AuthControllerTests,AuthServiceTests"`:
   - **Kết quả**: **BUILD SUCCESS — PASS 65/65 tests** (0 failed).
7. `mvn -f backend/pom.xml test "-Dtest=ReadingAssessmentControllerTests,ReadingAssessmentServiceTests,LocalSpeechServiceClientTests"`:
   - **Kết quả**: **BUILD SUCCESS — PASS 34/34 tests** (0 failed).

---

## 7. HƯỚNG DẪN BẮT ĐẦU NGAY CHO AGENT KẾ NHIỆM (NEXT STEPS)

Khi bắt đầu phiên làm việc tiếp theo, Agent kế nhiệm thực hiện theo thứ tự ưu tiên sau:

1. **Bước 1 (AUDIO-3 & AUDIO-4 — Bổ sung học liệu âm thanh tĩnh & kiểm thử thiết bị vật lý)**:
   - Tích hợp gói âm thanh phát âm HSK 1–3 và 214 bộ thủ có giấy phép hợp lệ vào `frontend/assets/audio/` + `manifest.json`, và kiểm thử thực tế trên thiết bị Android Chrome / iOS Safari.
2. **Bước 2 (P1-SEC-1 — Bổ sung `@PreAuthorize` cấp lớp)**:
   - Bổ sung `@PreAuthorize` rõ ràng trên `CreatorLessonController`, `ModeratorLessonController`, `UserSrsController`, `PersonalNoteController`.
3. **Bước 3 (P2-WRITING-1 — Kết nối `CharacterWritingModal` với `lesson-detail-page.js`)**:
   - Gắn nút mở modal luyện viết cho từng từ vựng trong trang chi tiết bài học và mở khóa tab `PRACTICE`/`QUIZ`.
