---
name: frontend-verification
description: Verify this zero-build frontend with static, unit, browser, accessibility, and full-stack checks.
---

# Frontend Verification

Read `package.json`, `tests/frontend/runner.mjs`, the target test, and the target page/module before selecting a tier.

- `npm run verify:frontend:static`: HTML/CSS/SRI/DOM-sink invariants.
- `npm run verify:frontend:unit`: pure module and contract tests.
- `npm run verify:frontend:browser`: browser smoke tests.
- `npm run verify:frontend:a11y`: accessibility browser checks.
- `npm run verify:frontend:gate`: cumulative gate.
- `npm run verify:frontend`: full frontend suite.
- `npm run verify:fullstack`: requires the backend and configured database/runtime.

Use the narrowest relevant tier first, then broaden for shared shell, API, security, or contract changes. Report command, exit code, counts, and environment blockers.

Official Playwright CLI is optional exploratory tooling:

```powershell
npm install -g @playwright/cli@latest
playwright-cli --help
playwright-cli install --skills
```

Prefer role/label/user-visible locators in committed tests. Do not commit `.playwright-cli/`, screenshots, traces, browser binaries, or generated reports unless explicitly requested.
