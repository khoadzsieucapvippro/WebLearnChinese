---
name: security-review
description: Review security-sensitive changes in this application and optionally route authorized dynamic testing to Strix.
---

# Security Review

Use for authentication, authorization, file upload, dynamic DOM data, CSP, CORS, secrets, or API abuse controls.

- Trace untrusted input from request/header/file through controller, service, persistence, and response/rendering.
- Check server-side authorization, identity binding, validation, rate limits, error disclosure, and transaction boundaries.
- Check DOM sinks, URL schemes, CSP/SRI/resource graph, token handling, and credential logging on the frontend.
- Read source and security tests before trusting a policy document.

Strix is optional external tooling from <https://github.com/usestrix/strix>. Its official agent-skill command is `npx skills add usestrix/strix`; scans require Docker, an LLM/provider or authorized Strix Cloud setup, and explicit authorization for the target. Never run it automatically against a live target and never commit its reports, credentials, or run directories.
