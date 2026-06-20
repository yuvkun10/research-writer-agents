# AGENTS.md

Guidance for AI coding agents (OpenAI Codex, Claude Code, and similar tools)
working in this repository. Humans should read [README.md](./README.md) first;
this file focuses on the conventions an agent needs to make correct, safe
changes.

## Project overview

Research Writer Agents is a TypeScript CLI and library that turns local
**source cards** (small JSON records of vetted evidence) into a cited research
brief through a deterministic, multi-agent pipeline. Output is Markdown and/or
JSON, plus an agent trace and a citation audit.

Two execution modes exist:

- **Deterministic (default):** fully offline. No network, no model provider. The
  same input always produces the same output. This is what the tests and CI
  exercise.
- **OpenAI (optional):** when `OPENAI_API_KEY` is set, a single constrained
  editor pass can call the OpenAI Responses API. Everything else stays
  deterministic, and the pipeline falls back to deterministic output if the key
  is missing or the call fails.

The codebase is intentionally small and dependency-light (`openai` is the only
runtime dependency). Keep it that way unless there is a strong reason not to.

## The 5-agent pipeline

The pipeline runs five agents in a fixed order. Each stage has a pure
deterministic implementation in `src/agents.ts`; only the editor stage can
optionally call a model.

1. **planner** (`planResearch`) — validates the topic and source cards, then
   builds report sections with source IDs attached to each section.
2. **researcher** (`researchSources`) — turns the selected local source cards
   for each section into section-level research notes with citation IDs.
3. **critic** (`critiqueDraft`) — checks the draft for blocking editorial
   issues, most importantly claims that lack source support.
4. **editor** (`editDraft`) — applies a deterministic edit, and, when a model
   client is provided, an optional OpenAI editor pass. **This pass must preserve
   every claim ID and citation ID** (see "Invariants" below).
5. **citation-auditor** (`auditCitations` in `src/citations.ts`) — verifies that
   every final claim cites a known source card, and flags `missing-citation`,
   `unknown-source`, and `unused-source` issues.

Orchestration, provider resolution, and the agent trace live in
`src/pipeline.ts` (`runResearchWriterPipeline`).

## Commands

```bash
npm install          # install dependencies
npm run build        # compile to dist/ via tsconfig.build.json
npm test             # run the Vitest suite (offline, deterministic)
npm run lint         # ESLint (flat config in eslint.config.js)
npm run typecheck    # tsc --noEmit against tsconfig.json
```

Before committing a change, an agent should run **lint, typecheck, and test**
and make sure they pass. CI additionally runs `npm audit --audit-level=moderate`
and `npm outdated`, then `npm run build`, on Node 24.

Run the CLI from source during development:

```bash
node --import tsx src/cli.ts --topic "Your topic" --sources ./sources.json --provider deterministic
```

## Repository structure

```text
src/
  agents.ts       The five agent stages (planner, researcher, critic, editor helpers)
  citations.ts    Citation audit logic (the citation-auditor stage)
  cli.ts          Command-line interface, argument parsing, file I/O
  index.ts        Public library exports (functions + types)
  pipeline.ts     Provider resolution + pipeline orchestration and agent trace
  providers.ts    Deterministic vs OpenAI provider setup and the OpenAI ModelClient
  render.ts       Markdown and JSON renderers
  text.ts         Small text helpers (titleCase, sentence, firstSentence, slugify)
  types.ts        Public TypeScript types (single source of truth for shapes)
tests/            Vitest coverage for pipeline, CLI, rendering, audits, fallbacks
.github/          CI workflow (ci.yml) and Dependabot config
.env.example      Safe local configuration template (placeholders only)
```

When you change a data shape, update `src/types.ts` first; it is the single
source of truth and is re-exported from `src/index.ts`.

## Coding conventions

- **TypeScript, strict.** `tsconfig.json` enables `strict`,
  `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. Handle
  `undefined` from indexed access explicitly and only set optional properties
  when you actually have a value (note the conditional-spread pattern used in
  `pipeline.ts` and `cli.ts`).
- **No `any`.** `@typescript-eslint/no-explicit-any` is an error. Narrow
  `unknown` with type guards (see `isRecord` / `isSourceCard`).
- **Inline type imports.** ESLint enforces
  `import type { ... }` with inline-type-imports. Module specifiers use the
  `.js` extension (NodeNext resolution), even though the sources are `.ts`.
- **ESM only.** `package.json` sets `"type": "module"`.
- **Prefer pure functions.** Agent stages should be deterministic and free of
  side effects so the default pipeline stays reproducible. Confine I/O to
  `cli.ts`.
- **Match the surrounding style.** Favor small, named helper functions and
  `readonly` array/object types, as in the existing files.

## Provider modes

Provider resolution lives in `src/providers.ts` (`resolveProvider`). Mode is
chosen by the `--provider` flag, the `provider` option, or the
`RESEARCH_WRITER_PROVIDER` environment variable:

- `deterministic` — never calls a model; runs fully offline.
- `auto` (default) — use OpenAI only when `OPENAI_API_KEY` is present; otherwise
  silently fall back to deterministic.
- `openai` — request the OpenAI editor pass; fall back to deterministic (with a
  recorded `fallbackReason`) if the key is missing or the provider call throws.

The OpenAI path builds a `ModelClient` that calls the Responses API with
instructions to not browse the web, use only supplied source cards, and preserve
citation IDs exactly. A custom `ModelClient` can be injected via
`PipelineOptions.providerClient` (used in tests) to exercise the OpenAI code
path without a real key.

## Invariants (do not break these)

- **The editor pass must preserve all claim IDs and citation IDs.** In
  `editDraft` / `mergeModelSuggestion`, the model may rewrite the title,
  summary, and body prose, but `final.claims` is always carried over from the
  deterministic draft. Never let a model response add, drop, rename, or
  renumber claim IDs or citation IDs. The citation auditor depends on this.
- **The deterministic path stays offline.** Do not add network calls, web
  scraping, or telemetry to the deterministic flow.
- **Citations are structural.** The auditor checks that claim citation IDs map
  to known source-card IDs; it does not assert factual correctness. Keep that
  contract intact.
- Keep `tests/` green and add coverage for behavior you change.

## Safety notes

- **Never commit `.env`, API keys, or other secrets.** `.env` is git-ignored;
  only `.env.example` (placeholders) is tracked. Supply real keys via the
  environment, never in code or fixtures.
- **Never commit private source-card data** or generated reports derived from
  it. Source cards may contain confidential research; keep them local.
- Do not weaken the network/offline guarantees of the deterministic provider.
- See [SECURITY.md](./SECURITY.md) for the full policy and how to report
  vulnerabilities.
