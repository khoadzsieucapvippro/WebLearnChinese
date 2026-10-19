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

<!-- boost-adaptive-architecture -->
# Multi-Agent Boost Architecture (/boost) - Adaptive Model Allocation

Khi người dùng kích hoạt lệnh `/boost`:
Hệ thống tự động kích hoạt cơ chế phân bổ mô hình thích ứng thông minh (**Adaptive Model Allocation**) dựa trên mô hình đang được chọn ở khung chat:

## 1. Cơ chế thích ứng tự động (Adaptive Subagent Model Rule)
- **Kịch bản A: Khi Khung Chat Chính đang chọn `Gemini 4 Argon`:**
  - **Main Agent (Gemini 4 Argon):** Giữ vai trò Kiến trúc sư trưởng & Kiểm duyệt viên độc lập (Tech Lead & Inspector).
  - **Subagent:** BẮT BUỘC gán `Model: "flash"` (`Gemini 3.8 Flash`).
  - **Mục tiêu:** Tiết kiệm tối đa token quý giá của Argon. Flash gánh vác toàn bộ việc cày file lớn, code chi tiết và chạy test runner; Argon tập trung vào định hướng kiến trúc và soi sản phẩm cuối cùng.

- **Kịch bản B: Khi Khung Chat Chính đang chọn `Gemini 3.8 Flash (High)`:**
  - **Main Agent (Gemini 3.8 Flash High):** Điều phối toàn diện nhiệm vụ.
  - **Subagent:** BẮT BUỘC gán `Model: "inherit"`.
  - **Mục tiêu:** Đảm bảo toàn bộ đội hình worker con đều thừa hưởng nguyên vẹn bộ não **`Flash (High Thinking)`** mạnh nhất với tư duy sâu, không bị hệ thống tự động hạ cấp xuống mức Medium.

## 2. Tiêu chuẩn Thẩm định linh hoạt theo Ngữ cảnh (Context-Aware Inspection)
- **Khi tác vụ có chỉnh sửa Giao diện (Frontend/UI):**
  1. **Đa màn hình (Multi-Viewport):** Chụp ảnh màn hình đối chiếu wireframe chuẩn ở Desktop (1280px) và Mobile (375px), phát hiện vỡ layout, co cụm hoặc tràn ngang (`overflow-x`).
  2. **Bản địa hóa Design System ([`frontend/css/style.css`](file:///c:/Users/LENOVO/btlm-test%20%282%29/btlm-test/elearning-1.0.0-20260819T062551Z-1-002/elearning-1.0.0/elearning-1.0.0/frontend/css/style.css)):** Dùng đúng các token màu cổ điển (Cinnabar Đỏ Chu Sa, Canvas Giấy Ngà, Ink Mực Tàu, Celadon Men Ngọc, Amber Hổ Phách, Cobalt Xanh Lam).
  3. **Quang học Hán tự:** Hán tự hiển thị rõ nét (font `Noto Sans SC`/`PingFang SC`), Pinyin cân đối chính tâm, khoảng cách padding theo nhịp 8px không dính sát mép thẻ.
  4. Nếu giao diện chưa đạt độ tinh tế: Main Agent gửi phản hồi chi tiết yêu cầu worker sửa lại.
- **Khi tác vụ là Backend / Database / Logic thuần túy:**
  - Tự động bỏ qua khâu kiểm tra giao diện, Main Agent tập trung nghiệm thu kiến trúc mã nguồn Java Spring Boot, tính toàn vẹn Flyway SQL, an ninh RBAC và kết quả test suite (`tests/frontend/runner.mjs`, `mvn test`).

> [!TIP]
> **TIỆN LỢI TỐI ĐA:**
> Bạn có thể tự do chuyển đổi giữa Gemini 4 Argon và Gemini 3.8 Flash ở khung chat mà không cần cấu hình lại. Hệ thống sẽ luôn tự động chọn mức thinking và phân bổ tài nguyên tối ưu nhất cho từng mô hình!
<!-- boost-adaptive-architecture -->



