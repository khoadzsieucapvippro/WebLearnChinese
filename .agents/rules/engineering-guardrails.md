---
name: engineering-guardrails
description: Evidence-based workflow and safety rules for changes in this repository.
---

# Engineering Guardrails

1. Inspect source, tests, and migrations before inferring behavior.
2. Classify impact: frontend, backend, database, API, security, or full-stack.
3. Verify endpoint paths, DTO fields, status codes, and envelopes against Java controllers/DTOs before writing client code.
4. Do not silently change an API response or database contract.
5. Use the smallest verification command that proves the changed behavior; broaden it when shared contracts are affected.
6. Check official documentation for version-sensitive external tools or libraries.
7. Do not run destructive commands, commit, push, install secrets, or generate artifacts without a clear task scope.
8. If verification is blocked, report `NOT VERIFIED` with the exact blocker; never report blocked work as PASS.
9. Do not rewrite user changes or reset the working tree.
