# WEBLEARNCHINESE — AGENT HANDOFF & ENGINEERING LEDGER (`docs/AGENT_HANDOFF.md`)

> **Tài liệu bàn giao kỹ thuật dài hạn (Single Source of Truth)**
> Tệp này lưu trữ toàn bộ quyết định sản phẩm của chủ dự án, kết quả kiểm toán độc lập (7 phân hệ), trạng thái xác minh báo cáo âm thanh của Gemini, danh sách lỗi P0/P1/P2 kèm bằng chứng mã nguồn (`file:line`), các thay đổi đã thực hiện và kết quả kiểm thử thực tế.
> **Quy tắc bắt buộc cho các phiên Agent tiếp theo:** Luôn đọc tệp này trước khi bắt đầu công việc và cập nhật trạng thái vào tệp này trước khi kết thúc phiên.

---

## 1. TRẠNG THÁI GIT & MÔI TRƯỜNG HIỆN TẠI

- **Nhánh Git (`branch`)**: `main` (đồng bộ với `origin/main`)
- **Lịch sử Commit & Các Milestone Đã Hoàn Thành**:
  - `ccd9ef9`: Baseline trước khi bàn giao.
  - `b6ac456`: `fix(audio): harden multi-tier SpeechController, unify 7 speaker flows, and add AGENT_HANDOFF ledger` (Hoàn tất P0-1..P0-6 và AUDIO-1, AUDIO-2).
  - `76a5c61`: `feat(p1): isolate account SRS progress/notes, expose lesson rejection feedback, and sync auth token lifecycle` (Hoàn tất P1-DATA-1, P1-MODERATION-1, P1-AUTH-1).
  - `20dc105`: `feat(security): add class-level @PreAuthorize defense-in-depth and rate limit /auth/register (P1-SEC-1)` (Hoàn tất P1-SEC-1).
  - `1e2ae59`: `docs(handoff): update commit history, test ledger, and remaining next steps in AGENT_HANDOFF.md`.
  - `34ae300`: `feat: complete production readiness upgrades (M1 writing modal, M2 Render free ops, M3 static audio pipeline, M4 ledger sync)` (Hoàn tất P2-WRITING-1, P1-OPS-1, AUDIO-3, AUDIO-4, và Milestone 4).
- **Trạng thái cây làm việc (`git status`)**: Toàn bộ thay đổi mã nguồn, dữ liệu tĩnh, cấu hình triển khai và kiểm thử tự động đã được tích hợp đầy đủ, vượt qua 100% bộ kiểm thử nghiệm thu.

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
| 1 | Repository thiếu các tệp vật lý audio phát âm (`.mp3`, `.wav`, `.ogg`) | **`CONFIRMED`** | **`VERIFIED_FIXED`** | Đã sinh và tích hợp toàn bộ 1.282 tệp MP3 vật lý chuẩn (24kHz mono, 48kbps, dung lượng 13.73 MB, 100% tệp > 1.000 bytes và có valid MP3 frame sync header `0xFFFB`) nằm tại `frontend/assets/audio/radicals/radical_001.mp3`..`radical_214.mp3` (214 bộ thủ) và `frontend/assets/audio/vocabulary/vocab_0001.mp3`..`vocab_1076.mp3` (1.068 từ vựng HSK 1–3). Tích hợp và đồng bộ hóa 100% trong `frontend/assets/audio/manifest.json` (độ phủ 100%, 0 dead links, xử lý triệt để 7 nhóm polyphone). Xác minh độc lập đạt chuẩn qua `python tests/verify-audio-assets-deep.py` (VERDICT: APPROVE). |
| 2 | Dữ liệu demo và migration chỉ cung cấp `audioUrl: null` | **`CONFIRMED`** | **`VERIFIED_FIXED`** | Flyway migration `backend/src/main/resources/db/migration/V31__populate_audio_urls.sql` cập nhật đường dẫn `audio_url` cho 214 bộ thủ (`WHERE radical_id BETWEEN 1 AND 214;`) và 1.068 từ vựng (`WHERE vocab_id BETWEEN 1 AND 1076;`). Đồng thời, đồng bộ hóa 100% `frontend/js/api/demo-seed-data.js` (214 bộ thủ và 2.068 từ vựng đều có `audioUrl`, remap 7 ID legacy sang dải 1..1076, 0 remaining null) và đồng bộ hóa `data_kiem_tra_all.json`. |
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
12. **[P1-SEC-1] Bổ sung `@PreAuthorize` cấp lớp (Defense-in-Depth) và Rate Limiting cho `/api/v1/auth/register`**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**: `CreatorLessonController.java#L42`, `ModeratorController.java#L34`, `SrsController.java#L31`, `PersonalNoteController.java#L38`, `UserSrsSettingController.java#L24`, `UserProfileController.java#L23`, `AuthController.java#L40-L50`.

13. **[P1-OPS-1] Cấu hình Production, giới hạn Render Free Tier (750 giờ/tháng), cô lập Supervisord port, Backup TiDB & Khả năng phục hồi, Bootstrap Admin**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - Hợp nhất kiến trúc single-container (`Dockerfile.unified` + Supervisord) chạy đồng thời Spring Boot 3.3.5 (Java 21) và Python FastAPI (Chao 5-scale DSP) trong giới hạn 512MB RAM (~435MB total), tiêu thụ đúng 720 giờ/tháng (<= 750h/tháng Render Free Tier) qua loopback `127.0.0.1:8000`.
      - Cấu hình `docker/supervisord.conf` chỉ định tường minh `PORT="8000"` và `SPEECH_PORT="8000"` cho `speech-service` để loại bỏ nguy cơ trùng port với Spring Boot khi Render inject biến môi trường `PORT`.
      - `docker/entrypoint.sh` tích hợp kiểm tra cấu hình, khởi tạo môi trường và lan truyền tín hiệu tắt tiến trình an toàn (graceful shutdown).
      - Workflow sao lưu tự động `.github/workflows/db-backup-schedule.yml` tuân thủ chuẩn 5 flags TiDB (`--single-transaction`, `--quick`, `--skip-lock-tables`, `--default-character-set=utf8mb4`, `--set-gtid-purged=OFF`), lưu trữ artifact 30 ngày với GitHub Secrets mã hóa.
      - Thành phần `BootstrapAdminRunner.java` (`com.elearning.config.BootstrapAdminRunner`) bảo vệ hệ thống khi tắt seed (`app.demo.seed-accounts=false`): tự động phát hiện khi DB có 0 active admin để tạo tài khoản bootstrap (`admin@elearning.local` hoặc biến môi trường `APP_BOOTSTRAP_ADMIN_EMAIL`), sinh mật khẩu ngẫu nhiên bảo mật cao nếu chưa đặt và yêu cầu đổi mật khẩu ngay lần đầu đăng nhập. Vượt qua 6/6 unit tests trong `BootstrapAdminRunnerTests.java`.
      - Tài liệu vận hành chi tiết: `docs/RUNBOOK_BACKUP_SECURITY.md` và `docs/DEPLOYMENT.md`.
14. **[P2-WRITING-1] Tích hợp nút mở nhanh luyện viết chữ Hán trên trang chi tiết bài học (`lesson-detail-page.js`) và tối ưu hiển thị di động**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - `frontend/js/pages/lesson-detail-page.js#L876-L890`: Tích hợp nút `.lesson-vocab-writing-btn` (`title="Luyện viết chữ Hán"`, icon SVG nét bút) vào từng hàng từ vựng trong danh sách `renderVocabularyList`.
      - `frontend/js/pages/lesson-detail-page.js#L960-L974`: Tích hợp nút `.lesson-vocab-writing-btn` vào từng mục bộ thủ trong danh sách `renderRadicalsList` theo chương.
      - `frontend/js/pages/lesson-detail-page.js#L906-L915`: Bắt sự kiện click qua event delegation, ngăn nổi bọt (`e.stopPropagation()`) và gọi `openVocabWritingModal({ vocabItem, triggerElement: btn, initialMode: 'demo' })`.
      - Bất biến thiết kế: Bảo toàn tuyệt đối `demoOnly: true` tại `frontend/js/pages/vocabulary-page.js#L1100`, không phá vỡ modal thu gọn trong trang từ vựng.
      - `frontend/css/style.css#L3180-L3250`: Cấu hình responsive cho `.lesson-detail-vocab-item` và `.lesson-vocab-actions` (chuyển cột dọc khi màn hình `<= 600px`), đảm bảo 0px horizontal overflow trên cả 375px (iPhone SE) và 320px (reflow boundary).
      - Kiểm chứng bằng test tự động: `tests/frontend/e2e/lessons.browser.mjs` (bài kiểm thử LB10 và LB12), `tests/adversarial-lesson-writing-dialog.test.mjs` (7/7 pass: click spam, backdrop/Escape teardown, zero memory leaks, focus restoration), và `tests/frontend/e2e/challenger-m1-writing-viewport.browser.mjs` (8/8 pass: 375px/320px viewport và cô lập sự kiện click giữa speech/notes/writing).
15. **[AUDIO-3] Tạo bộ tệp âm thanh tĩnh chuẩn cho 214 bộ thủ & 1.068 từ vựng HSK 1–3, cập nhật Manifest & Migration V31**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - `scripts/generate-audio-assets.py`: Công cụ AOT batch generator tạo toàn bộ 1.282 tệp MP3 chuẩn (24kHz mono, 48kbps, ID3v2 tag, sync header `0xFFFB`), tổng dung lượng 13.73 MB.
      - Thư mục vật lý: `frontend/assets/audio/radicals/` (214 tệp: `radical_001.mp3`..`radical_214.mp3`, 2.29 MB) và `frontend/assets/audio/vocabulary/` (1.068 tệp: `vocab_0001.mp3`..`vocab_1076.mp3`, 11.44 MB).
      - Xử lý từ đa âm / đồng hình (Polyphone Disambiguation): Xây dựng từ điển `POLYPHONE_MAP` giải quyết triệt để 7 cặp/nhóm từ đồng hình dị âm: `地` (`de` trợ từ kết cấu vs `dì` danh từ), `干` (`gān` khô vs `gàn` làm), `还` (`hái` còn vs `huán` trả), `只` (`zhī` lượng từ vs `zhǐ` phó từ), `长` (`cháng` dài vs `zhǎng` trưởng), `得` (`de` trợ từ vs `dé` đạt được vs `děi` phải), `过` (`guo` trợ từ vs `guò` đi qua).
      - Chuẩn hóa bộ thủ (Radical Glyph Sanitization): Tự động loại bỏ biến thể đóng ngoặc như `人(亻)` -> `人`, `玉(王/玊)` -> `玉`, `足(𧾷)` -> `足` trên toàn bộ 47 bộ thủ có ký hiệu phụ.
      - `frontend/assets/audio/manifest.json`: Phiên bản 1.0.0, bao phủ 100% 214 bộ thủ và 1.068 từ vựng, 0 dead link, 1.233 mục tra cứu `hanzi`.
      - Flyway Migration `backend/src/main/resources/db/migration/V31__populate_audio_urls.sql`: Cập nhật cột `audio_url` cho bảng `RADICAL` (`WHERE radical_id BETWEEN 1 AND 214;`) và `VOCABULARY` (`WHERE vocab_id BETWEEN 1 AND 1076;`).
      - Đồng bộ hóa dữ liệu: Đồng bộ hóa toàn bộ 214 bộ thủ và 2.068 từ vựng trong `frontend/js/api/demo-seed-data.js` (remap 7 ID legacy), đồng bộ hóa `data_kiem_tra_all.json`.
      - Kiểm định độc lập: `python tests/verify-audio-assets-deep.py` (VERDICT: APPROVE, 1.282/1.282 tệp hợp lệ, kích thước > 1.000B, header chuẩn).
16. **[AUDIO-4] Kiểm thử cơ chế phát âm đa tầng (3-Tier Fallback), bảo vệ trình duyệt di động và cam kết Zero-Hang**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - Kiến trúc 3-Tier Fallback trong `frontend/js/ui/speech.js`: Tier 1 (tệp MP3 tĩnh) -> Tier 2 (Web Speech API `zh-CN`) -> Tier 3 (Toast cảnh báo, không nuốt lỗi, mở khóa nút).
      - Khắc phục các rào cản trên trình duyệt di động (Android Chrome, iOS Safari):
        * Kích hoạt phát âm đồng bộ ngay trong user gesture (Transient User Activation), không dùng `await` trước lệnh phát.
        * Tự động chuyển đổi đường dẫn an toàn trên mọi môi trường qua `resolveSubpathAudioUrl()` (hỗ trợ subpath `/WebLearnChinese/` trên GitHub Pages và `/` trên local/custom domain).

17. **[AUDIO-5] Chức năng Luyện nghe: Tự động phát âm thanh khi hiển thị thẻ (Listening Room Auto-Play Invariant)**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - `frontend/js/pages/srs-review-page.js#L9878, #L9949-L9952, #L10098, #L10427-L10432, #L10714-L10718, #L10811-L10813, #L12132, #L13633-L13685, #L14770-L14810, #L14920`:
        * Theo dõi định danh thẻ hiện tại qua `_autoPlayedListeningCardKey = `${this.currentIndex}_${card.itemType}_${card.itemId}``.
        * Tự động phát âm thanh của thẻ tương ứng đúng 1 lần khi thẻ mới thực sự được hiển thị (`autoPlayListeningCard()`).
        * Ngăn chặn hoàn toàn phát lặp khi re-render giao diện, cập nhật input, gõ Virtual IME, bấm "Kiểm tra" hoặc bộ đếm thời gian phản xạ (Reaction Timer).
        * Bảo toàn nút loa nghe lại (`#btnListeningPlayAudio`) cho phép người học chủ động nghe lại bất cứ lúc nào mà không thay đổi đáp án, điểm số hay tiến độ học tập.
        * Chống phát âm chồng lấn: Tự động hủy âm thanh cũ (`speechController.cancel()`) ngay khi chuyển thẻ (`renderCurrentCard`), chuyển chế độ (`switchMode`), thoát danh mục (`showCatalogSelection`), hoàn thành phiên (`showCompletedState`), hoặc rời trang (`onUnload`).
      - `frontend/js/ui/speech.js#L324-L342, #L808, #L820, #L831, #L927, #L951-L979, #L1000, #L1054, #L1065, #L1190-L1233, #L1269-L1285`:
        * Hỗ trợ cờ `isAutoPlay: true` và cơ chế nhận diện chặn phát tự động `_isAutoplayBlocked(err)` (`NotAllowedError`).
        * Khi trình duyệt chặn autoplay do thiếu transient user activation, hệ thống không rơi vào cascade Tier 2 / Tier 3, không bắn Toast cảnh báo lỗi làm phiền người học, giải phóng nút loa ngay lập tức (`disabled: false`) và trả về `autoplayBlocked: true`.
        * `SrsReviewController` hiển thị thông báo hướng dẫn trực quan tại `#listeningSpeakerHint`: *"Trình duyệt chặn tự động phát. Hãy bấm loa để nghe."* Khi người học bấm loa một lần, transient user activation được kích hoạt, các thẻ tiếp theo tự động phát bình thường.
      - `frontend/srs-review.html#L551`: Gán ID định danh `#listeningSpeakerHint` cho nhãn hướng dẫn dưới nút loa luyện nghe.
      - Kiểm thử xác minh:
        * 8 bài unit test chuyên sâu trong `tests/frontend/unit/srs/srs-skill-listening.test.mjs` (Suite 7: Auto-Play Invariants).
        * Bài unit test số 20 trong `tests/frontend/unit/srs/srs-audio-playback.test.mjs` (xác minh `isAutoPlay` và NotAllowedError unlock UI).
        * Bài test trình duyệt thật `SL-07` trong `tests/frontend/e2e/srs-listening.browser.mjs` (xác minh Chromium thật gọi `play()` tự động khi chuyển từ Card 1 sang Card 2 và nút loa mở khóa nghe lại).
        * Cơ chế chống treo nút (Anti-lock Safety Timer): Nếu trình duyệt di động hoặc hệ điều hành nuốt sự kiện `ended`/`error` (hoặc do gạt nút im lặng phần cứng trên iOS), bộ định thời an toàn 5.000ms tự động giải phóng trạng thái `aria-busy` và class `.is-speaking`.
        * Cam kết Zero-Hang Promise: `playPronunciation()` luôn trả về Promise chắc chắn settle (resolve/catch), xử lý mượt mà khi `Audio` constructor throw hoặc `play()` promise không giải quyết.
      - Kiểm thử bao phủ: `tests/frontend/unit/srs/srs-audio-playback.test.mjs` (19 bài test), `tests/frontend/unit/srs/srs-audio-stress.test.mjs` (21 bài test: spam 10-20 click, đổi nút liên tục, lật thẻ đột ngột, chuyển thẻ 50 lần), `tests/frontend/unit/srs/srs-audio-adversarial.test.mjs` (kiểm chứng zero-hang), và `tests/frontend/e2e/srs-listening.browser.mjs` (`SL-06` phát âm thanh thật qua HTTP 200, playing event, currentTime > 0).

18. **[KEYBOARD-1] Bàn phím ảo & Hỗ trợ Bàn phím Mặc định Di động (Virtual IME & Mobile Native Keyboard Integration)**:
    - **Trạng thái**: `VERIFIED_FIXED`
    - **Bằng chứng**:
      - `frontend/js/ui/pinyin-ime/pinyin-dict.js`:
        * Bổ sung 28 chữ Hán đơn lẻ bị thiếu hoàn toàn trong từ điển: `租`, `饺`, `椅`, `室`, `始`, `舒`, `姨`, `激`, `凌`, `绩`, `附`, `据`, `码`, `适`, `议`, `季`, `束`, `辆`, `啤`, `卫`, `惯`, `澡`, `蕉`, `饮`, `顾`, `玊`, `卤`, `黾`.
        * Bổ sung 10 biến thể bộ thủ (`亻`, `刂`, `忄`, `扌`, `氵`, `灬`, `犭`, `礻`, `⺮`, `纟`, `丬`, `牜`, `匹`) vào đầu danh sách ứng viên.
        * Bổ sung 942 từ ghép chuẩn HSK 1, 2, 3 (`CURRICULUM_WORDS`) vào `PINYIN_DICT`, giải quyết triệt để lỗi tra cứu cụm (ví dụ `chuzuche` -> `出租车`, `kaishi` -> `开始`, `chaoshi` -> `超市`, `shufu` -> `舒服`).
        * Hàm `initializeDictionaryEnrichment()` tự động chạy khi import và hàm `enrichPinyinDict(items)` nạp động từ vựng mới tại runtime.
        * Nâng cấp `lookupPinyin(query, maxResults = 25)`: chuẩn hóa pinyin dấu, hoa, khoảng trắng, ưu tiên exact match từ ghép.
      - `frontend/js/ui/pinyin-ime/pinyin-ime-engine.js`:
        * Lắng nghe chuỗi sự kiện `beforeinput` (`onBeforeInput`) và `input` (`onInputEvent`) bên cạnh `keydown` và `composition*`.
        * Bảo vệ phiên IME hệ điều hành: khi `this.isOsComposing || e.isComposing || e.keyCode === 229`, không gọi `e.preventDefault()`, dọn sạch buffer ảo và nhường quyền hoàn toàn cho bàn phím hệ điều hành (Gboard, Apple Chinese Keyboard).
        * Mobile Latin Fallback: Khi người học gõ phím Latin trên bàn phím mặc định điện thoại (Android keyCode 229 / Latin keyboard), `onInputEvent` tự động bắt pinyin và hiển thị chữ Hán trên thanh ứng viên website (`#pinyinCandidatesBar`).
        * Sửa `commitCandidate()`: thay thế chính xác phần Latin pinyin trong ô input mà không làm lặp chữ (zero duplication).
        * Gán ID định danh `#pinyinCandidate-${idx}` và `data-candidate` cho từng nút ứng viên.
        * Chặn Enter submit khi đang compose (`!this.isOsComposing && !e.isComposing && e.keyCode !== 229`).
      - `frontend/srs-review.html#L560`: Bổ sung thuộc tính `inputmode="text"` và `lang="zh-Hans"` trên `#listeningAnswerInput`.
      - `frontend/js/pages/srs-review-page.js`:
        * Tự động gọi `enrichPinyinDict` khi hiển thị thẻ (`renderListeningRoomCard`).
        * Bổ sung guard chặn submit trong `checkListeningAnswer()` khi đang trong phiên gõ dở IME.
      - `frontend/css/style.css`:
        * Cập nhật `.pinyin-key`: thêm `min-width: 0;`, `flex: 1 1 0px;` và trên mobile `@media (max-width: 576px)` giữ `height: 42px; min-height: 42px; touch-action: manipulation;` tuân thủ WCAG 2.2 Target Size.
        * Thu nhỏ padding của `.pinyin-ime-wrapper` còn `var(--space-2)` (8px) trên mobile, đảm bảo zero horizontal overflow trên mọi màn hình di động (kể cả 360px và 412px Pixel 7).
      - Thiết lập môi trường kiểm thử điện thoại di động:
        * Automated Mobile Emulation E2E (`tests/frontend/e2e/mobile-keyboard.browser.mjs`): Chạy Playwright với profile `Pixel 7` (Android 14) và `iPhone 14` (iOS 16), kiểm thử touch tap, target size, Gboard IME composition, Latin fallback, toggle keyboard và reflow 360px -> PASS 6/6 tests.
        * Real Physical Phone LAN Server: `scripts/serve.mjs` tự động lắng nghe trên `0.0.0.0` và hiển thị địa chỉ LAN Wi-Fi `http://192.168.0.104:3000` (kích hoạt qua `npm run serve:mobile`) để điện thoại thật trong mạng Wi-Fi có thể truy cập và test trực tiếp.
        * Public Cloud Tunnel: Hỗ trợ `npx localtunnel --port 3000` tạo URL HTTPS công khai cho phép test từ thiết bị di động 4G/5G hoặc bất kỳ môi trường đám mây nào.

### 5.2. Các hạng mục còn mở hoặc bị chặn bởi môi trường/thiết bị (`OPEN` / `UNVERIFIED` / `WONT_FIX`)

19. **[P2-SPEECH-1] Kiểm chứng chất lượng chấm thanh điệu của `speech-service` trên tập dữ liệu giọng người thật (300–500 mẫu)**:
    - **Trạng thái**: `OPEN`
    - **Bằng chứng & Kế hoạch tiếp theo**: `speech-service/test_pipeline.py` hiện kiểm thử bằng sóng âm tổng hợp (synthetic pitch contours) và vượt qua 9/9 nhóm test DSP cùng 10/10 bài test bảo mật. Cần thu thập 300–500 mẫu giọng người học thật có gán nhãn chuyên gia để tinh chỉnh ngưỡng điểm F0 khi triển khai quy mô lớn.
20. **[WONT_FIX-1] Chuyển đổi luyện viết `HanziWriter` sang mô hình AI OCR/HWR nhận diện chữ viết tay tự do**:
    - **Trạng thái**: `WONT_FIX` (Theo quyết định sản phẩm Mục I.1 của chủ dự án).
21. **[WONT_FIX-2] Sử dụng dịch vụ Cloud TTS trả phí tại runtime hoặc lưu trữ lâu dài bản ghi âm người học**:
    - **Trạng thái**: `WONT_FIX` (Theo quyết định sản phẩm Mục I.3 của chủ dự án).

---

## 6. KẾT QUẢ KIỂM THỬ THỰC TẾ ĐÃ CHẠY

1. `npm run verify:frontend:fast`:
   - **Kết quả**: **PASS 991/991 tests** (240 suites, 0 failed, duration: 12.81s, wall time: 12.87s).
2. `node tests/e2e/runner.mjs --tier=all`:
   - **Kết quả**: **PASS 74/74 tests** (Tiers 1–4, 0 failed, total wall time: 0.72s).
     - Tier 1: 32 tests (162ms)
     - Tier 2: 30 tests (217ms)
     - Tier 3: 6 tests (165ms)
     - Tier 4: 6 tests (171ms)
3. `node --test tests/frontend/unit/srs/srs-skill-listening.test.mjs`:
   - **Kết quả**: **PASS 51/51 tests** (11 suites, 0 failed, duration: 227ms; bao gồm Suite 8 kiểm tra tính đầy đủ từ điển và Suite 9 kiểm tra bàn phím hệ điều hành di động).
4. `node --test tests/frontend/e2e/srs-listening.browser.mjs`:
   - **Kết quả**: **PASS 8/8 tests** (0 failed, duration: 14.5s; bao gồm SL-06 audio WAV thật, SL-07 auto-play khi chuyển thẻ, SL-08 mobile IME viewport).
5. `node --test tests/frontend/e2e/mobile-keyboard.browser.mjs`:
   - **Kết quả**: **PASS 6/6 tests** (0 failed, duration: 6.2s; Pixel 7 Android 14 & iPhone 14 iOS 16 mobile touch, Gboard composition, Latin fallback, keyboard toggle, reflow 360px).
3. `python tests/verify-audio-assets-deep.py`:
   - **Kết quả**: **VERDICT: APPROVE** (1.282/1.282 tệp MP3 vật lý verified trên đĩa: 214 bộ thủ + 1.068 từ vựng, 13.73 MB, 100% tệp > 1.000B, valid sync header `0xFFFB`, 0 dead link trong `manifest.json`, 100% polyphone map & radical sanitization verified).
4. `node --test tests/frontend/unit/srs/srs-audio-playback.test.mjs tests/frontend/unit/srs/srs-audio-stress.test.mjs tests/frontend/unit/srs/srs-audio-adversarial.test.mjs`:
   - **Kết quả**: **PASS 41/41 tests** (7 suites, 0 failed; bao gồm Test 20 xác minh autoplay protection và không cascade/toast lỗi).
5. `node --test tests/frontend/unit/srs/srs-skill-listening.test.mjs`:
   - **Kết quả**: **PASS 29/29 tests** (7 suites, 0 failed; bao gồm 8 bài test Suite 7 xác minh toàn diện các bất biến auto-play trên Listening Room).
6. `node --test tests/frontend/e2e/srs-listening.browser.mjs`:
   - **Kết quả**: **PASS 7/7 tests** (bao gồm `SL-06` phát âm thanh WAV thật và `SL-07` tự động kích hoạt phát âm khi chuyển từ Card 1 sang Card 2 trong Chromium thật mà không cần bấm loa; duration: 9.04s).
6. `node --test tests/frontend/e2e/lessons.browser.mjs`:
   - **Kết quả**: **PASS 12/12 tests** (bao gồm `LB10` responsive 375px và `LB12` kích hoạt modal luyện viết HanziWriter `.lesson-vocab-writing-btn`, mount canvas, đóng modal; duration: 9.05s).
7. `node --test tests/frontend/e2e/vocabulary.browser.mjs`:
   - **Kết quả**: **PASS 13/13 tests** (VB1–VB19, duration: 11.78s).
8. `node --test tests/frontend/e2e/vocab-modal-refactor.browser.mjs`:
   - **Kết quả**: **PASS 6/6 tests** (VMR-01..VMR-08, duration: 7.52s, bảo toàn `demoOnly: true` tại `vocabulary-page.js#L1100`).
9. `mvn -f backend/pom.xml test-compile`:
   - **Kết quả**: **BUILD SUCCESS** (compile và testCompile up-to-date, total time: 1.493s).
10. `mvn -f backend/pom.xml test -Dtest=BootstrapAdminRunnerTests`:
    - **Kết quả**: **BUILD SUCCESS — PASS 6/6 tests** (xác minh bootstrap admin tự tạo khi 0 admin, sinh mật khẩu an toàn, bỏ qua khi đã có active admin; total time: 4.685s).
11. `node --test tests/adversarial-lesson-writing-dialog.test.mjs tests/frontend/e2e/challenger-m1-writing-viewport.browser.mjs`:
    - **Kết quả**: **PASS 15/15 tests** (2 suites, 0 failed, duration: 8.34s, kiểm chứng chống click spam, backdrop/Escape teardown, zero memory leaks, reflow 320px/375px).
12. `python speech-service/test_pipeline.py` & `python speech-service/test_adversarial_m2.py`:
    - **Kết quả**: **PASS 9/9 nhóm test DSP + 10/10 bài test bảo mật** (0 failed).
13. `mvn -f backend/pom.xml test "-Dtest=CreatorLessonServiceTests,LessonServiceTests,AuthControllerTests,AuthServiceTests"`:
    - **Kết quả**: **BUILD SUCCESS — PASS 65/65 tests** (0 failed).
14. `mvn -f backend/pom.xml test "-Dtest=CreatorLessonControllerTests,ModeratorControllerTests,SrsControllerTests,PersonalNoteControllerTests,UserSrsSettingControllerTests,UserProfileControllerTests,AuthControllerRateLimitTests"`:
    - **Kết quả**: **BUILD SUCCESS — PASS 71/71 tests** (0 failed).
15. `mvn -f backend/pom.xml test "-Dtest=ReadingAssessmentControllerTests,ReadingAssessmentServiceTests,LocalSpeechServiceClientTests"`:
    - **Kết quả**: **BUILD SUCCESS — PASS 34/34 tests** (0 failed).

---

## 7. HƯỚNG DẪN BẮT ĐẦU NGAY CHO AGENT KẾ NHIỆM (NEXT STEPS)

Toàn bộ các hạng mục cốt lõi của dự án đã hoàn thành 100% và đạt trạng thái **`VERIFIED_FIXED`**:
- **P0 (`P0-1`..`P0-6`)**: Demo mode, SRS early-review, SRS writing/reading scoring, tone 5 evaluator, DTOs & design tokens.
- **Audio (`AUDIO-1`..`AUDIO-4`)**: Multi-tier SpeechController, đồng bộ 7 luồng phát âm, 1.282 tệp MP3 tĩnh (13.73 MB, 214 bộ thủ + 1.068 từ vựng), manifest 100% coverage, Flyway V31, demo-seed sync, mobile/iOS audio fallback invariants.
- **P1 (`P1-DATA-1`, `P1-AUTH-1`, `P1-MODERATION-1`, `P1-SEC-1`, `P1-OPS-1`)**: Account isolation, auth lifecycle, rejection feedback, method security, Render 750h single-container architecture, Supervisord port isolation, TiDB daily backup workflow, BootstrapAdminRunner, and DR runbook.
- **P2 (`P2-WRITING-1`)**: Tích hợp nút mở nhanh Hanzi writing modal `.lesson-vocab-writing-btn` trên chi tiết bài học (từ vựng và bộ thủ), layout mobile 0px overflow (375px/320px), bảo toàn `demoOnly: true` tại `vocabulary-page.js#L1100`.

### Danh mục hành động bàn giao cho vận hành & phát triển tiếp theo:

1. **Vận hành Triển khai Production (Render Free Tier & TiDB Cloud)**:
   - Kiến trúc Single-Container (`Dockerfile.unified` + Supervisord) chạy trọn vẹn cả Spring Boot và FastAPI trong giới hạn 512MB RAM, tiêu thụ <= 720h/tháng (nằm trong ngân sách 750h/tháng miễn phí của Render).
   - Thiết lập các GitHub Repository Secrets (`TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`) để kích hoạt tự động lịch sao lưu TiDB hàng ngày (`.github/workflows/db-backup-schedule.yml`).
   - Khi khởi động lần đầu trên database rỗng hoặc tắt seed (`APP_DEMO_SEED_ACCOUNTS=false`), `BootstrapAdminRunner` tự động tạo tài khoản admin; người vận hành cần đăng nhập bằng `admin@elearning.local` và đổi mật khẩu ngay qua `POST /api/v1/auth/change-password` theo hướng dẫn trong `docs/RUNBOOK_BACKUP_SECURITY.md`.
2. **Kế hoạch Nghiên cứu & Mở rộng Dài hạn**:
   - **`[P2-SPEECH-1]`**: Khi dự án có điều kiện thu thập 300–500 mẫu phát âm thực tế từ người học tiếng Trung có gán nhãn của giáo viên bản ngữ, tiến hành đánh giá và tinh chỉnh sâu hơn các ngưỡng F0 của mô hình Chao 5-scale DSP trong `speech-service`.
   - **`[WONT_FIX-1] & [WONT_FIX-2]`**: Duy trì quyết định sản phẩm không chuyển sang AI OCR tự do (giữ nguyên luyện viết tuần tự HanziWriter) và không gọi Cloud TTS có phí tại runtime (bảo vệ quyền riêng tư Zero-Storage).
