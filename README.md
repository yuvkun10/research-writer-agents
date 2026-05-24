# Research Writer Agents

Production-grade TypeScript CLI for a local, multi-agent research writing pipeline. It turns local source cards into a cited report through five stages:

- Planner
- Researcher
- Critic
- Editor
- Citation auditor

The default path is deterministic and network-free, which keeps tests stable. An optional OpenAI Responses API editor pass is available when `OPENAI_API_KEY` is set locally.

## Features

- Deterministic local pipeline for repeatable tests and offline drafting
- Optional OpenAI Responses API provider with automatic deterministic fallback
- Source-card input model with claim-to-citation linking
- Citation audit for missing citations, unknown source IDs, and unused sources
- Markdown and JSON report export
- TypeScript library API plus CLI
- No live web scraping requirement

## Install

```bash
npm install
npm run build
```

## Source Cards

Create a local JSON file containing an array of source cards:

```json
[
  {
    "id": "source-1",
    "title": "Research Operations Notes",
    "author": "Example Team",
    "publishedAt": "2026-05-01",
    "url": "https://example.com/research-operations",
    "excerpt": "Source cards make evidence visible across planning, drafting, and review."
  }
]
```

## CLI Usage

Run from source during development:

```bash
node --import tsx src/cli.ts --topic "Citation-first research writing" --sources ./sources.json --out-dir ./out --format both --provider deterministic
```

After building:

```bash
node dist/cli.js --topic "Citation-first research writing" --sources ./sources.json --out-dir ./out --format both
```

Options:

- `--topic <topic>`: required report topic
- `--sources <path>`: required local source-card JSON file
- `--out-dir <dir>`: output directory, defaults to the current directory
- `--format markdown|json|both`: export format, defaults to `markdown`
- `--provider auto|deterministic|openai`: provider mode, defaults to `auto`
- `--model <model>`: optional OpenAI model override

## Optional OpenAI Provider

Copy `.env.example` to a local ignored env file and set `OPENAI_API_KEY`:

```bash
OPENAI_API_KEY=
RESEARCH_WRITER_PROVIDER=auto
```

The OpenAI path uses the Responses API for an editorial pass only. It is instructed not to browse and to use only the supplied source cards. If the API key is missing or the provider call fails, the pipeline falls back to deterministic local execution.

## Library Usage

```ts
import { renderMarkdownReport, runResearchWriterPipeline } from "research-writer-agents";

const report = await runResearchWriterPipeline({
  topic: "Citation-first research writing",
  sourceCards: [
    {
      id: "source-1",
      title: "Research Operations Notes",
      excerpt: "Source cards make evidence visible across planning, drafting, and review."
    }
  ]
});

console.log(renderMarkdownReport(report));
```

## Development

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

The CI workflow runs install, lint, typecheck, tests, and build on Node 24 using `actions/checkout@v6` and `actions/setup-node@v6`.
