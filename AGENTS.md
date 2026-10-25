<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<what to look up>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<what to look up>"` — run a separate `docs` command per distinct concept if the question spans multiple topics, unless it's about how they interact
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Be specific about what to look up in the library's documentation — specific and detailed queries return better results than vague single words, but keep each query to a single concept unless the question is about how concepts interact; combined multi-topic queries dilute ranking and return shallow results for each topic. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
Run Context7 CLI requests outside Codex's default sandbox. If a Context7 CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.
<!-- context7 -->

<!-- anti-loop-and-polling-guardrail -->
# Cơ chế Chống Vòng Lặp Vô Hạn & Cấm Polling Tác Vụ Nền (Anti-Loop & Zero-Polling Guardrail)

Khi thực thi bất kỳ lệnh hoặc tác vụ nền (background task) nào:

1. **Tuyệt đối CẤM Polling (Zero-Polling Rule):**
   - Khi một lệnh chạy nền (ví dụ: test suite, build, server watcher), KHÔNG ĐƯỢC gọi liên tục `manage_task(Action='status')` để chờ đợi kết quả.
   - Cơ chế Antigravity tự động đánh thức agent khi tác vụ hoàn thành (Reactive Wakeup). Do đó, sau khi khởi chạy lệnh chạy nền, agent PHẢI dừng gọi tool để nhường quyền xử lý cho hệ thống.

2. **Dừng Ngay Khi Phát Hiện Treo/Lặp (Loop Breaker):**
   - Nếu một tác vụ chạy quá thời gian dự kiến hoặc nghi ngờ rơi vào vòng lặp vô hạn, PHẢI lập tức gọi `manage_task(Action='kill')` hoặc gửi tín hiệu hủy.
   - Không được cố gắng retry liên tục cùng một hành động gây lỗi mà không thay đổi chiến lược giải quyết.
<!-- anti-loop-and-polling-guardrail -->

---

# Quy Tắc Bất Biến Dành Cho Coding Agent (Project Invariants & Agent Rules)

## 1. Cấu Trúc Dự Án (Project Structure)
- `backend/`: Java 21, Spring Boot 3.3.5 REST API, Spring Security/JWT, Spring Data JPA, Flyway (V1..V30).
- `frontend/`: Zero-Build Semantic HTML5 (25 trang), CSS3 tokens, ES2022 Native Modules. Không đưa vào bundler hoặc production npm dependencies.
- `speech-service/`: Python 3.11 FastAPI microservice phân tích phát âm theo thang Chao 5-scale DSP (offline, không phụ thuộc Cloud AI).
- `tests/`: Tầng kiểm thử độc lập bao gồm `tests/frontend/` (940 tests), `tests/e2e/` (74 tests Tiers 1–4), `tests/postman/` (83 requests).
- `docs/`: Thư mục tài liệu chính thức (`ARCHITECTURE.md`, `DEVELOPMENT.md`, `TESTING.md`, `DEPLOYMENT.md`, `curriculum-manifest.md`).

## 2. Lệnh Kiểm Thử & Xác Minh Chuẩn (Verification Baseline)
- `npm run verify:frontend:fast`: Chạy 940 bài kiểm thử tĩnh và đơn vị (Static + Unit), hoàn tất trong ~8 giây.
- `node tests/e2e/runner.mjs --tier=all`: Chạy 74 bài kiểm thử E2E Hộp Đen (Tiers 1–4), hoàn tất trong ~0.75 giây.
- `mvn -f backend/pom.xml test`: Chạy bộ kiểm thử backend (yêu cầu Docker daemon cho Testcontainers).
- Tuyệt đối không phỏng đoán kết quả kiểm thử từ tài liệu cũ; luôn chạy lệnh và lấy bằng chứng thực tế.

## 3. Quy Tắc Cơ Sở Dữ Liệu & Flyway Migrations
- **Baseline Migration Hiện Tại**: Từ `V1` đến `V30` tại `backend/src/main/resources/db/migration/`.
- **Tuyệt đối không sửa đổi hay xóa** bất kỳ migration nào từ `V1` đến `V30` đã áp dụng.
- Mọi thay đổi schema mới phải được đưa vào một tệp migration mới (`V31__...sql`).
- `spring.jpa.hibernate.ddl-auto` luôn giữ giá trị `none`.
- Toàn bộ bảng và collation phải là `utf8mb4_unicode_ci`. Bảng kết nối phải tương thích cơ chế khóa phi phân cụm (`NONCLUSTERED` primary key) của TiDB Cloud Serverless (xem V24).

## 4. Các Bất Biến Bảo Mật (Security Invariants)
- **Zero Hardcoded Secrets**: Toàn bộ khóa bí mật, mật khẩu DB, JWT secret phải nạp từ biến môi trường.
- **Fail-Fast JWT Secret**: Trên production profile, JWT secret bắt buộc >= 32 ký tự (256 bits).
- **IDOR Defense**: Danh tính người dùng (`account_id`) luôn được lấy từ `SecurityContextHolder` đã giải mã từ JWT, không chấp nhận `account_id` từ client payload.
- **Vai trò người dùng (RBAC)**: Trả về client không có tiền tố `ROLE_` (`Admin`, `Creator`, `Moderator`, `Learner`). Kiểm tra vai trò trên frontend chỉ để phục vụ UX, backend chịu trách nhiệm ủy quyền tuyệt đối.
- **Bảo Vệ Admin Cuối Cùng (Last Admin Invariant)**: Hệ thống ngăn chặn hạ quyền hoặc khóa tài khoản Admin duy nhất còn hoạt động.
- **Khử Trừ Dữ Liệu Nhạy Cảm**: Mọi thao tác quản lý ghi log qua `management_audit_log` phải tự động bóc tách và làm mờ mật khẩu, token qua `AuditDataSanitizer`.

## 5. Các Bất Biến An Toàn Frontend (DOM Safety & Design Tokens)
- **Cấm XSS Sinks**: Tuyệt đối không sử dụng `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML` hoặc inline event handlers (`onclick=...`).
- Luôn sử dụng DOM APIs an toàn: `document.createElement()`, `element.textContent`, `element.setAttribute()`.
- Mọi liên kết URL và tài nguyên media phải qua `sanitizeNavigationUrl()` và `sanitizeResourceUrl()` trong `frontend/js/ui/security.js`.
- Tuân thủ bảng màu Scholarly Cinnabar: `--color-primary: #8B2635`.

## 6. Các Bất Biến Nghiệp Vụ & Quy Trình
- **Cấm Tự Phê Duyệt (Self-Review Prohibition)**: Creator không được phép tự phê duyệt hoặc tự từ chối bài học do chính mình tạo ra.
- **Giới Hạn Thẻ SRS (Card Bounds)**: Tham số `newCardsPerDay` trong cài đặt học tập bị chặn cứng trong khoảng `[1, 100]`.
- **Cấm Seeder Tài Khoản Trên Prod**: `app.demo.seed-accounts` bắt buộc phải là `false` trên môi trường Production (`render.yaml`).
