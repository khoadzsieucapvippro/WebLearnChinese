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
