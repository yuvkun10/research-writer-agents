# Usage reference

## Quick start

Create a local `sources.json` with at least one source card:

```json
[
  {
    "id": "source-1",
    "title": "Research Operations Notes",
    "excerpt": "Source cards make evidence visible across planning, drafting, and review."
  }
]
```

Generate a Markdown brief with the deterministic provider (no API key needed):

```bash
node --import tsx src/cli.ts \
  --topic "Citation-first research writing" \
  --sources ./sources.json \
  --out-dir ./out \
  --format markdown \
  --provider deterministic
```

This writes `./out/report.md` containing the plan, claims, report body, a
citation audit, and the rendered source cards.

## Source cards

Create a local JSON file containing either an array of source cards or an object
with a `sourceCards` array:

```json
[
  {
    "id": "source-1",
    "title": "Research Operations Notes",
    "author": "Example Team",
    "publishedAt": "2026-05-01",
    "url": "https://example.com/research-operations",
    "excerpt": "Source cards make evidence visible across planning, drafting, and review.",
    "notes": ["Optional analyst note."]
  }
]
```

Required fields are `id`, `title`, and `excerpt`. Optional fields are `author`,
`publishedAt`, `url`, and `notes`.

## CLI usage

Run from source during development:

```bash
node --import tsx src/cli.ts --topic "Citation-first research writing" --sources ./sources.json --out-dir ./out --format both --provider deterministic
```

Run after building:

```bash
node dist/cli.js --topic "Citation-first research writing" --sources ./sources.json --out-dir ./out --format both
```

Options:

- `--topic <topic>`: required report topic.
- `--sources <path>`: required path to local source-card JSON.
- `--out-dir <dir>`: output directory, defaults to the current directory.
- `--format markdown|json|both`: export format, defaults to `markdown`.
- `--provider auto|deterministic|openai`: provider mode, defaults to `auto`.
- `--model <model>`: optional OpenAI model override.

## Library usage

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
