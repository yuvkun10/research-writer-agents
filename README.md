# Research Writer Agents

[![CI](https://github.com/yuvkun10/research-writer-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/yuvkun10/research-writer-agents/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Research Writer Agents is a TypeScript CLI and library that turns local source
cards into a cited research brief through a five agent pipeline. It is for
analysts, researchers and technical teams who need repeatable drafts where every
claim links to a source card. The default provider is deterministic and makes no
network calls; an optional OpenAI editor pass runs when `OPENAI_API_KEY` is set.
Status: version 0.1.0, not published to npm.

## Installation

Prerequisites: Node.js `20.19` or newer and npm `11` or newer.

```bash
npm install
npm run build
```

Use `npm ci` for a clean, CI style install.

Configuration is optional. Copy `.env.example` to a git-ignored `.env` and set
any of `OPENAI_API_KEY`, `OPENAI_MODEL`, `RESEARCH_WRITER_PROVIDER`. Provider
modes are explained in [docs/configuration.md](docs/configuration.md).

## Usage

Create a `sources.json` with at least one source card (`id`, `title` and
`excerpt` are required), then run from source:

```bash
node --import tsx src/cli.ts \
  --topic "Citation-first research writing" \
  --sources ./sources.json \
  --out-dir ./out \
  --format markdown \
  --provider deterministic
```

This writes `./out/report.md` with the plan, claims, report body, citation audit
and source cards. After `npm run build` the same options work with
`node dist/cli.js`. The source card format, all CLI options and the library API
are in [docs/usage.md](docs/usage.md).

There is no deployment. The tool runs locally as a CLI or is imported as a
library.

## Project structure

```text
├── .github
├── docs
│   ├── architecture.md
│   ├── architecture.mmd
│   └── archive
├── src
│   ├── agents.ts
│   ├── citations.ts
│   ├── cli.ts
│   ├── index.ts
│   ├── pipeline.ts
│   ├── providers.ts
│   ├── render.ts
│   ├── text.ts
│   └── types.ts
├── tests
├── AGENTS.md
├── CONTRIBUTING.md
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

The pipeline and the role of each file are described in [docs/architecture.md](docs/architecture.md).

## Coding style

ESLint runs the `@eslint/js` and `typescript-eslint` recommended rules, blocks
`any`, and requires inline `import type` for type only imports. TypeScript runs
in `strict` mode and is checked with `tsc --noEmit`. No formatter and no commit
message linter are configured. [CONTRIBUTING.md](./CONTRIBUTING.md) lists the
conventions and the pull request workflow.

```bash
npm run lint
npm run typecheck
```

## Test

```bash
npm test
```

Vitest runs the suites in `tests/`: the pipeline, provider fallbacks, the CLI,
rendering and the citation audit. They use the deterministic provider, so they
run offline without an API key. CI also runs `npm run build`,
`npm audit --audit-level=moderate` and `npm outdated`.

## Documentation

- [docs/README.md](docs/README.md): index of all docs, including the archived README
- [docs/overview.md](docs/overview.md): why the project exists and who it is for
- [docs/architecture.md](docs/architecture.md): pipeline, diagram and CI
- [docs/usage.md](docs/usage.md): source cards, CLI options and library usage
- [docs/configuration.md](docs/configuration.md): environment variables and provider modes
- [docs/privacy-and-citations.md](docs/privacy-and-citations.md): privacy and citation notes
- [SECURITY.md](./SECURITY.md): security policy and vulnerability reporting

## License

MIT. See [LICENSE](LICENSE).
