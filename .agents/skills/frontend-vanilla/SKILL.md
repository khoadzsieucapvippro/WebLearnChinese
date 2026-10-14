---
name: frontend-vanilla
description: Build or review this project's Vanilla JS, CSS, HTML, DOM safety, responsive behavior, and accessibility.
---

# Frontend Vanilla

Read `.agents/SOURCE_OF_TRUTH.md`, the target HTML page, its page module, shared `api.js`, `auth-state.js`, `ui.js`, and relevant tests before editing.

- Keep zero-build native ES modules and the existing CSS token system.
- Keep one page entry module per HTML page and avoid new globals. `window.__ENV__` is configuration only.
- Use `apiClient` for HTTP calls and `authManager` for session/token state.
- Treat API, query strings, local storage, uploaded content, and user text as untrusted.
- Render dynamic values with `textContent`, `createElement`, and validated attributes. Do not use dynamic `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or inline event attributes.
- Validate URL protocols by context. Block executable schemes such as `javascript:`, `data:text/html`, and `vbscript:`.
- Preserve semantic landmarks, keyboard operation, focus restoration, accessible names, live regions, reduced-motion behavior, and responsive no-overflow behavior.
- Use existing visual tokens and patterns; do not add a framework or generic replacement design system.

Run relevant static/unit tests for DOM and API behavior, then browser/accessibility tests for interaction changes. Use the official Playwright CLI only for exploratory inspection; see `frontend-verification`.
