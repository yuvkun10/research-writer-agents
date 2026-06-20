# Contributing

Thanks for your interest in improving Research Writer Agents. This project is a
small, dependency-light TypeScript codebase, so contributions are
straightforward to test locally.

## Prerequisites

- Node.js `20.19` or newer
- npm `11` or newer

## Getting started

```bash
npm install
npm run build
```

## Local checks

Run the same checks that CI runs before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

All of these should pass on a clean checkout. The test suite uses
[Vitest](https://vitest.dev/) and the deterministic provider, so it runs
offline and without an API key.

## Pull requests

- Keep changes focused and scoped to a single concern.
- Add or update tests in `tests/` when you change behavior.
- Update `README.md` and `AGENTS.md` if you change commands, structure, or the
  pipeline contract.
- Make sure `npm run lint`, `npm run typecheck`, and `npm test` are green.
- Write clear commit messages that explain the "why" of a change.

## Coding conventions

- TypeScript runs in `strict` mode with `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. Avoid `any`; ESLint blocks it.
- Use inline `import type { ... }` for type-only imports (enforced by ESLint).
- Prefer pure, deterministic functions. The default pipeline must produce the
  same output for the same input without any network access.
- The optional OpenAI editor pass must preserve every claim ID and citation ID.
  Do not introduce code paths that drop, rename, or fabricate them.

## Reporting bugs and security issues

For functional bugs, open a GitHub issue with steps to reproduce. For security
concerns, follow the process in [SECURITY.md](./SECURITY.md) instead of opening
a public issue.
