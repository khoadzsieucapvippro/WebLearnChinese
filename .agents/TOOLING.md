# External Tooling

These tools are optional helpers. They are not copied into `.agents`, and installing them must not add generated output, caches, credentials, browser binaries, or tool configuration to the repository.

## Playwright CLI

Official docs: <https://playwright.dev/docs/getting-started-cli>

```powershell
npm install -g @playwright/cli@latest
playwright-cli --help
playwright-cli install --skills agents
```

The current CLI supports `--skills agents` and installs the official skill at `.agents/skills/playwright-cli`. The existing `tests/frontend/runner.mjs` and `playwright-core` dependency remain the verification authority. Use the CLI for exploratory browser inspection, not as a replacement for committed tests.

## Context7 CLI

Official docs: <https://context7.com/docs/clients/cli>

```powershell
npx ctx7 --help
npm install -g ctx7
ctx7 --help
ctx7 library <library-name> "specific question"
ctx7 docs <context7-library-id> "specific question"
```

Use it to check current third-party API documentation when a version or command matters. It does not override repository source or tests.

## Strix

Official repository: <https://github.com/usestrix/strix>

The repository documents `npx skills add usestrix/strix` for agent skills and a separate Docker/LLM-backed Strix CLI install. Run only against an owned or explicitly authorized target. Strix is not a default verification step and must not be run automatically against a live service.

## Graphify

Official repository: <https://github.com/Graphify-Labs/graphify>

Current official installation for Codex:

```powershell
uv tool install graphifyy
graphify install --platform codex
```

The verified installation is `graphify 0.9.77`, with the discoverable skill at `%USERPROFILE%\\.codex\\skills\\graphify\\SKILL.md` and frontmatter name `graphify`. Use `graphify install --platform codex`; do not use bare `graphify install`.

## SkillUI

No verified official SkillUI repository or Codex-compatible installation source was found during this audit. Do not install an unverified package or use it as a project dependency.
